from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status, HTTPException #type:ignore
from sqlalchemy.ext.asyncio import AsyncSession #type:ignore
from sqlalchemy import select, or_, and_ #type:ignore
import json
from datetime import datetime, timezone, timedelta

from app.db.session import get_db, AsyncSessionLocal
from app.models.chat import Message
from app.models.user import User
from app.api.endpoints.user import get_current_user 
from app.core.security import verify_token

router = APIRouter()

# --- 1. 连接管理器：负责维护在线 WebSocket 连接 ---
class ConnectionManager:
    def __init__(self):
        # 键是 user_id (int), 值是 WebSocket 对象
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: int):
        """发送 JSON 数据到目标用户的 WebSocket"""
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# --- 2. WebSocket 接口：身份验证 + 实时转发 + 自动存库 ---
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    # 连接时通过 Token 验证身份
    user = await verify_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(user.id, websocket)
    try:
        while True:
            # 接收客户端发来的 JSON 消息
            data = await websocket.receive_text()
            msg_in = json.loads(data)
            
            # 消息存入数据库
            async with AsyncSessionLocal() as db:
                new_msg = Message(
                    sender_id=user.id,
                    receiver_id=msg_in.get("receiver_id"),
                    content=msg_in.get("content"),
                    msg_type=msg_in.get("msg_type", "text")
                )
                db.add(new_msg)
                await db.commit()
                await db.refresh(new_msg)
                
                # 构造响应 payload
                payload = {
                    "id": new_msg.id,
                    "sender_id": user.id,
                    "receiver_id": new_msg.receiver_id,
                    "content": new_msg.content,
                    "msg_type": new_msg.msg_type,
                    "is_recalled": False,
                    "created_at": str(new_msg.created_at)
                }

            # 实时转发给接收者
            await manager.send_personal_message(payload, new_msg.receiver_id)
            # 回显给发送者
            await websocket.send_json({"status": "delivered", "data": payload})

    except WebSocketDisconnect:
        manager.disconnect(user.id)
    except Exception as e:
        print(f"WebSocket 错误: {e}")
        manager.disconnect(user.id)

# --- 3. HTTP 接口：获取历史记录 (包含撤回脱敏逻辑) ---
@router.get("/history", response_model=list[dict])
async def get_chat_history(
    target_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取与特定用户的最近 50 条私聊记录"""
    query = (
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == target_id),
                and_(Message.sender_id == target_id, Message.receiver_id == current_user.id)
            )
        )
        .order_by(Message.created_at.desc())
        .limit(50)
    )
    result = await db.execute(query)
    messages = result.scalars().all()
    
    history = []
    for m in reversed(messages):
        # 工业级逻辑：如果消息已撤回，不返回真实内容
        display_content = "此消息已撤回" if m.is_recalled else m.content
        
        history.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": display_content,
            "msg_type": m.msg_type,
            "is_recalled": m.is_recalled,
            "created_at": str(m.created_at)
        })
    return history

# --- 4. HTTP 接口：撤回消息 (2分钟限制) ---
@router.post("/recall/{message_id}")
async def recall_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 查找消息
    result = await db.execute(select(Message).where(Message.id == message_id))
    msg = result.scalars().first()
    
    if not msg:
        raise HTTPException(status_code=404, detail="未找到该消息")

    # 权限检查：只有发送者本人可以撤回
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权撤回此消息")
    
    if msg.is_recalled:
        return {"status": "info", "message": "该消息已处于撤回状态"}

    # 2. 时间校验逻辑
    now = datetime.now(timezone.utc)
    # 兼容性处理：补全时区信息
    msg_time = msg.created_at
    if msg_time.tzinfo is None:
        msg_time = msg_time.replace(tzinfo=timezone.utc)

    if now - msg_time > timedelta(minutes=2):
        raise HTTPException(
            status_code=400, 
            detail="消息发送已超过 2 分钟，无法撤回"
        )
    
    # 3. 标记撤回并提交
    msg.is_recalled = True
    await db.commit()
    
    return {"status": "success", "message": "已成功撤回消息"}