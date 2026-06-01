from fastapi import APIRouter, Depends, HTTPException, status #type:ignore
from sqlalchemy.ext.asyncio import AsyncSession #type:ignore
from sqlalchemy import select, and_, or_ #type:ignore
from typing import List

from app.db.session import get_db
from app.models.friendship import Friendship
from app.models.user import User
from app.api.endpoints.user import get_current_user
from app.schemas.friendship import FriendshipOut, FriendshipDetailOut
from app.core.cache import (
    get_friend_list_cache, set_friend_list_cache, invalidate_friend_list_cache,
    get_friend_pending_cache, set_friend_pending_cache,
    invalidate_friend_check_cache, invalidate_all_feeds, get_user_cache, set_user_cache,
)

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

    await invalidate_friend_list_cache(friend_id)

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

    await invalidate_friend_list_cache(current_user.id)
    await invalidate_friend_list_cache(requester_id)
    await invalidate_friend_check_cache(current_user.id, requester_id)
    await invalidate_all_feeds()

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

    await invalidate_friend_list_cache(current_user.id)
    await invalidate_friend_list_cache(target_id)
    await invalidate_friend_check_cache(current_user.id, target_id)
    await invalidate_all_feeds()

    return {"status": "success", "message": "已解除关系或拒绝申请"}

# --- 4. 获取好友列表 ---
@router.get("/list", response_model=List[FriendshipDetailOut])
async def get_friends_list(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await get_friend_pending_cache(current_user.id)
    if cached is not None:
        return cached

    query = select(Friendship).where(
        and_(
            or_(Friendship.user_id == current_user.id, Friendship.friend_id == current_user.id),
            Friendship.status == True
        )
    )
    result = await db.execute(query)
    friendships = result.scalars().all()

    friend_user_ids = [
        fs.friend_id if fs.user_id == current_user.id else fs.user_id
        for fs in friendships
    ]

    user_map: dict[int, dict] = {}
    missing_ids = []
    for uid in friend_user_ids:
        cu = await get_user_cache(uid)
        if cu is not None:
            user_map[uid] = cu
        else:
            missing_ids.append(uid)

    if missing_ids:
        user_query = select(User).where(User.id.in_(missing_ids))
        user_result = await db.execute(user_query)
        for u in user_result.scalars().all():
            user_map[u.id] = {
                "id": u.id, "username": u.username, "avatar_url": u.avatar_url
            }
            await set_user_cache(u.id, {
                "id": u.id, "username": u.username, "email": u.email,
                "avatar_url": u.avatar_url, "bio": u.bio, "location": u.location,
                "is_active": u.is_active, "created_at": u.created_at.isoformat() if u.created_at else None,
            })

    friendship_details = []
    for fs in friendships:
        fid = fs.friend_id if fs.user_id == current_user.id else fs.user_id
        info = user_map.get(fid)
        friendship_details.append({
            "id": fs.id, "user_id": fs.user_id, "friend_id": fs.friend_id,
            "status": fs.status, "created_at": fs.created_at,
            "friend_info": {
                "id": fid, "username": info["username"], "avatar_url": info["avatar_url"]
            } if info else None
        })

    await set_friend_list_cache(current_user.id, friendship_details)
    return friendship_details

# --- 5. 获取待处理的申请 (收到的) ---
@router.get("/pending", response_model=List[FriendshipDetailOut])
async def get_pending_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await get_friend_list_cache(current_user.id)
    if cached is not None:
        return cached

    query = select(Friendship).where(
        and_(Friendship.friend_id == current_user.id, Friendship.status == False)
    )
    result = await db.execute(query)
    pending_requests = result.scalars().all()

    requester_ids = [req.user_id for req in pending_requests]

    user_map: dict[int, dict] = {}
    missing_ids = []
    for uid in requester_ids:
        cu = await get_user_cache(uid)
        if cu is not None:
            user_map[uid] = cu
        else:
            missing_ids.append(uid)

    if missing_ids:
        user_query = select(User).where(User.id.in_(missing_ids))
        user_result = await db.execute(user_query)
        for u in user_result.scalars().all():
            user_map[u.id] = {
                "id": u.id, "username": u.username, "avatar_url": u.avatar_url
            }
            await set_user_cache(u.id, {
                "id": u.id, "username": u.username, "email": u.email,
                "avatar_url": u.avatar_url, "bio": u.bio, "location": u.location,
                "is_active": u.is_active, "created_at": u.created_at.isoformat() if u.created_at else None,
            })

    pending_details = []
    for req in pending_requests:
        info = user_map.get(req.user_id)
        pending_details.append({
            "id": req.id, "user_id": req.user_id, "friend_id": req.friend_id,
            "status": req.status, "created_at": req.created_at,
            "friend_info": {
                "id": req.user_id, "username": info["username"], "avatar_url": info["avatar_url"]
            } if info else None
        })

    await set_friend_pending_cache(current_user.id, pending_details)
    return pending_details