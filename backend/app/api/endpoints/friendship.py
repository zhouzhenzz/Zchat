from fastapi import APIRouter, Depends, HTTPException, status #type:ignore
from sqlalchemy.ext.asyncio import AsyncSession #type:ignore
from sqlalchemy import select, and_, or_ #type:ignore
from typing import List

from app.db.session import get_db
from app.models.friendship import Friendship
from app.models.user import User
from app.api.endpoints.user import get_current_user
from app.schemas.friendship import FriendshipOut, FriendshipDetailOut

router = APIRouter()

# --- 1. 发送好友申请 ---
@router.post("/request/{friend_id}", response_model=FriendshipOut)
async def send_friend_request(
    friend_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.id == friend_id:
        raise HTTPException(status_code=400, detail="不能加自己为好友")

    # 检查记录是否已存在
    query = select(Friendship).where(
        or_(
            and_(Friendship.user_id == current_user.id, Friendship.friend_id == friend_id),
            and_(Friendship.user_id == friend_id, Friendship.friend_id == current_user.id)
        )
    )
    result = await db.execute(query)
    existing = result.scalars().first()

    if existing:
        if existing.status:
            raise HTTPException(status_code=400, detail="已经是好友了")
        raise HTTPException(status_code=400, detail="申请已发送或待处理")

    new_rel = Friendship(user_id=current_user.id, friend_id=friend_id, status=False)
    db.add(new_rel)
    await db.commit()
    await db.refresh(new_rel)
    return new_rel

# --- 2. 通过好友申请 ---
@router.post("/accept/{requester_id}", response_model=FriendshipOut)
async def accept_friend(
    requester_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 必须是对方发给我的申请 (friend_id == current_user.id)
    query = select(Friendship).where(
        and_(
            Friendship.user_id == requester_id, 
            Friendship.friend_id == current_user.id, 
            Friendship.status == False
        )
    )
    result = await db.execute(query)
    rel = result.scalars().first()

    if not rel:
        raise HTTPException(status_code=404, detail="未找到待处理的申请记录")

    rel.status = True
    await db.commit()
    await db.refresh(rel)
    return rel

# --- 3. 拒绝申请或删除好友 ---
@router.delete("/remove/{target_id}")
async def remove_friendship(
    target_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = select(Friendship).where(
        or_(
            and_(Friendship.user_id == current_user.id, Friendship.friend_id == target_id),
            and_(Friendship.user_id == target_id, Friendship.friend_id == current_user.id)
        )
    )
    result = await db.execute(query)
    rel = result.scalars().first()

    if not rel:
        raise HTTPException(status_code=404, detail="关系不存在")

    await db.delete(rel)
    await db.commit()
    return {"status": "success", "message": "已解除关系或拒绝申请"}

# --- 4. 获取好友列表 ---
@router.get("/list", response_model=List[FriendshipDetailOut])
async def get_friends_list(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有已通过(status=True)的好友关系"""
    # 先获取好友关系
    query = select(Friendship).where(
        and_(
            or_(Friendship.user_id == current_user.id, Friendship.friend_id == current_user.id),
            Friendship.status == True
        )
    )
    result = await db.execute(query)
    friendships = result.scalars().all()
    
    # 为每个好友关系添加friend_info
    friendship_details = []
    for fs in friendships:
        # 确定好友的用户ID
        friend_user_id = fs.friend_id if fs.user_id == current_user.id else fs.user_id
        # 获取好友的用户信息
        friend_query = select(User).where(User.id == friend_user_id)
        friend_result = await db.execute(friend_query)
        friend_user = friend_result.scalars().first()
        
        # 构建friend_info
        if friend_user:
            fs_dict = {
                "id": fs.id,
                "user_id": fs.user_id,
                "friend_id": fs.friend_id,
                "status": fs.status,
                "created_at": fs.created_at,
                "friend_info": {
                    "id": friend_user.id,
                    "username": friend_user.username,
                    "avatar_url": friend_user.avatar_url
                }
            }
            friendship_details.append(fs_dict)
        else:
            # 如果找不到好友用户，返回基础信息
            fs_dict = {
                "id": fs.id,
                "user_id": fs.user_id,
                "friend_id": fs.friend_id,
                "status": fs.status,
                "created_at": fs.created_at,
                "friend_info": None
            }
            friendship_details.append(fs_dict)
    
    return friendship_details

# --- 5. 获取待处理的申请 (收到的) ---
@router.get("/pending", response_model=List[FriendshipDetailOut])
async def get_pending_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """查看谁想加我为好友"""
    query = select(Friendship).where(
        and_(Friendship.friend_id == current_user.id, Friendship.status == False)
    )
    result = await db.execute(query)
    pending_requests = result.scalars().all()
    
    # 为每个申请添加friend_info
    pending_details = []
    for req in pending_requests:
        # 获取请求者的用户信息
        requester_query = select(User).where(User.id == req.user_id)
        requester_result = await db.execute(requester_query)
        requester_user = requester_result.scalars().first()
        
        # 构建friend_info
        if requester_user:
            req_dict = {
                "id": req.id,
                "user_id": req.user_id,
                "friend_id": req.friend_id,
                "status": req.status,
                "created_at": req.created_at,
                "friend_info": {
                    "id": requester_user.id,
                    "username": requester_user.username,
                    "avatar_url": requester_user.avatar_url
                }
            }
            pending_details.append(req_dict)
        else:
            # 如果找不到请求者用户，返回基础信息
            req_dict = {
                "id": req.id,
                "user_id": req.user_id,
                "friend_id": req.friend_id,
                "status": req.status,
                "created_at": req.created_at,
                "friend_info": None
            }
            pending_details.append(req_dict)
    
    return pending_details