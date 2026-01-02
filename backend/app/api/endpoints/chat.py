from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status, HTTPException #type:ignore
from sqlalchemy.ext.asyncio import AsyncSession #type:ignore
from sqlalchemy import select, or_, and_, func, desc, case, update #type:ignore
import json
from datetime import datetime, timezone, timedelta

from app.db.session import get_db, AsyncSessionLocal
from app.models.chat import Message
from app.models.user import User
from app.models.friendship import Friendship 
from app.api.endpoints.user import get_current_user 
from app.core.security import verify_token
from app.schemas.chat import ChatSessionOut

router = APIRouter()

# --- 辅助函数：校验好友关系 ---
async def check_is_friend(db: AsyncSession, user_a_id: int, user_b_id: int) -> bool:
    query = select(Friendship).where(
        or_(
            and_(Friendship.user_id == user_a_id, Friendship.friend_id == user_b_id, Friendship.status == True),
            and_(Friendship.user_id == user_b_id, Friendship.friend_id == user_a_id, Friendship.status == True)
        )
    )
    result = await db.execute(query)
    return result.scalars().first() is not None

# --- 1. 连接管理器 ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# --- 2. WebSocket 接口 ---
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    user = await verify_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(user.id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg_in = json.loads(data)
            receiver_id = msg_in.get("receiver_id")
            content = msg_in.get("content")
            msg_type = msg_in.get("msg_type", "text")
            
            async with AsyncSessionLocal() as db:
                is_friend = await check_is_friend(db, user.id, receiver_id)
                if not is_friend:
                    await websocket.send_json({"status": "error", "message": "发送失败：对方不是好友"})
                    continue 

                new_msg = Message(sender_id=user.id, receiver_id=receiver_id, content=content, msg_type=msg_type)
                db.add(new_msg)
                await db.commit()
                await db.refresh(new_msg)
                
                payload = {
                    "id": new_msg.id, "sender_id": user.id, "receiver_id": receiver_id,
                    "content": content, "msg_type": msg_type, "is_recalled": False,
                    "is_read": False, "created_at": str(new_msg.created_at)
                }

            await manager.send_personal_message(payload, receiver_id)
            await websocket.send_json({"status": "delivered", "data": payload})
    except WebSocketDisconnect:
        manager.disconnect(user.id)
    except Exception:
        manager.disconnect(user.id)

# --- 3. 获取最近会话列表 ---
@router.get("/sessions", response_model=list[ChatSessionOut])
async def get_chat_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    le_id = case((Message.sender_id < Message.receiver_id, Message.sender_id), else_=Message.receiver_id)
    gr_id = case((Message.sender_id > Message.receiver_id, Message.sender_id), else_=Message.receiver_id)

    # A. 子查询：最后一条消息
    subquery = (
        select(func.max(Message.id).label("last_msg_id"))
        .where(or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id))
        .group_by(le_id, gr_id)
        .subquery()
    )

    # B. 未读数子查询：使用 correlate(User) 显式关联修复报错
    unread_subquery = (
        select(func.count(Message.id))
        .where(and_(
            Message.sender_id == User.id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ))
        .correlate(User) # 修复 auto-correlation 报错的核心
        .scalar_subquery()
    )

    # C. 主查询
    query = (
        select(
            Message, 
            User.username, 
            User.avatar_url, # 对应你 UserSchema 的 avatar_url
            User.id.label("peer_id"),
            unread_subquery.label("unread_count")
        )
        .join(subquery, Message.id == subquery.c.last_msg_id)
        .join(User, User.id == case(
            (Message.sender_id == current_user.id, Message.receiver_id),
            else_=Message.sender_id
        ))
        .order_by(Message.created_at.desc())
    )

    result = await db.execute(query)
    rows = result.all()

    sessions = []
    for m, uname, avt_url, p_id, unread in rows:
        last_content = "消息已撤回" if m.is_recalled else (m.content if m.msg_type == "text" else f"[{m.msg_type}]")
        
        sessions.append({
            "peer_id": p_id,
            "username": uname,
            "avatar_url": avt_url, # 修正字段名对齐
            "last_message": last_content, 
            "last_time": m.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "msg_type": m.msg_type,
            "unread_count": unread
        })
    return sessions

# --- 4. 标记已读 ---
@router.post("/read/{peer_id}")
async def mark_messages_as_read(
    peer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Message)
        .where(and_(
            Message.sender_id == peer_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ))
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "success"}

# --- 5. 获取历史记录 ---
@router.get("/history", response_model=list[dict])
async def get_chat_history(
    target_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_friend = await check_is_friend(db, current_user.id, target_id)
    if not is_friend: return [] 

    query = (
        select(Message)
        .where(or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == target_id),
            and_(Message.sender_id == target_id, Message.receiver_id == current_user.id)
        ))
        .order_by(Message.created_at.desc()).limit(50)
    )
    result = await db.execute(query)
    messages = result.scalars().all()
    
    history = []
    for m in reversed(messages):
        display_content = ("消息已撤回") if m.is_recalled else m.content
        history.append({
            "id": m.id, "sender_id": m.sender_id, "receiver_id": m.receiver_id,
            "content": display_content, "msg_type": m.msg_type,
            "is_recalled": m.is_recalled, "is_read": m.is_read, "created_at": str(m.created_at)
        })
    return history

# --- 6. 撤回消息 ---
@router.post("/recall/{message_id}")
async def recall_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Message).where(Message.id == message_id))
    msg = result.scalars().first()
    if not msg or msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作")
    
    now = datetime.now(timezone.utc)
    msg_time = msg.created_at.replace(tzinfo=timezone.utc) if msg.created_at.tzinfo is None else msg.created_at
    if now - msg_time > timedelta(minutes=2):
        raise HTTPException(status_code=400, detail="超过2分钟无法撤回")
    
    msg.is_recalled = True
    await db.commit()
    return {"status": "success"}