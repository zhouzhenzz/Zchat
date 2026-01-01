import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status #type:ignore
from sqlalchemy.ext.asyncio import AsyncSession #type:ignore
from sqlalchemy import select, update, delete, and_, or_ #type:ignore
from pydantic import BaseModel #type:ignore

from app.db.session import get_db
from app.api.endpoints.user import get_current_user
from app.models.user import User
from app.models.moment import Moment
from app.models.friendship import Friendship
from app.schemas.moment import MomentResponse 

# --- Pydantic 模型 ---
class MomentCreate(BaseModel):
    content: str
    images: List[str] = []

router = APIRouter()

# --- 1. 发布动态 ---
@router.post("/create")
async def create_moment(
    data: MomentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if len(data.images) > 9:
        raise HTTPException(status_code=400, detail="最多上传 9 张图片")
        
    new_moment = Moment(
        user_id=current_user.id,
        content=data.content,
        images=data.images,
        likes=[],
        comments=[]
    )
    db.add(new_moment)
    await db.commit()
    return {"status": "success", "moment_id": new_moment.id}

# --- 2. 删除动态 ---
@router.delete("/{moment_id}")
async def delete_moment(
    moment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = delete(Moment).where(
        and_(Moment.id == moment_id, Moment.user_id == current_user.id)
    )
    result = await db.execute(query)
    if result.rowcount == 0:
        raise HTTPException(status_code=403, detail="无权删除或动态不存在")
    await db.commit()
    return {"status": "success"}

# --- 3. 获取朋友圈 Feed (核心修复版本) ---
@router.get("/feed", response_model=List[MomentResponse])
async def get_moments_feed(
    page: int = 1,
    size: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 查找所有 status=True 的双向好友关系
    friend_query = select(Friendship).where(
        and_(
            or_(Friendship.user_id == current_user.id, Friendship.friend_id == current_user.id),
            Friendship.status == True
        )
    )
    res = await db.execute(friend_query)
    friendships = res.scalars().all()

    # 2. 提取好友 ID 并强制转换为 int (防止类型不匹配导致查询失败)
    friend_ids = []
    for f in friendships:
        if int(f.user_id) == int(current_user.id):
            friend_ids.append(int(f.friend_id))
        else:
            friend_ids.append(int(f.user_id))
    
    # 3. 目标列表：我自己 + 所有好友
    target_uids = list(set(friend_ids)) + [int(current_user.id)]

    # 4. 关联 User 表，获取发布者的基本信息
    query = (
        select(Moment, User.username, User.avatar_url)
        .join(User, Moment.user_id == User.id)
        .where(Moment.user_id.in_(target_uids))
        .order_by(Moment.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    
    result = await db.execute(query)
    rows = result.all()

    # 5. 组装返回数据，avt_url 对应数据库 User.avatar_url
    return [{
        "id": m.id,
        "user_id": m.user_id,
        "username": uname,
        "avatar": avt_url, 
        "content": m.content,
        "images": m.images,
        "likes": m.likes,
        "comments": m.comments,
        "created_at": m.created_at
    } for m, uname, avt_url in rows]

# --- 4. 点赞/取消点赞 ---
@router.post("/{moment_id}/like")
async def toggle_like(
    moment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 查询动态
    res = await db.execute(select(Moment).where(Moment.id == moment_id))
    moment = res.scalars().first()
    if not moment:
        raise HTTPException(status_code=404, detail="动态不存在")

    current_likes = list(moment.likes)
    like_index = next((i for i, l in enumerate(current_likes) if int(l['user_id']) == int(current_user.id)), None)

    if like_index is not None:
        current_likes.pop(like_index)
        is_liked = False
    else:
        current_likes.append({
            "user_id": current_user.id, 
            "username": current_user.username,
            "avatar": current_user.avatar_url
        })
        is_liked = True

    # 更新数据库
    await db.execute(
        update(Moment).where(Moment.id == moment_id).values(likes=current_likes)
    )
    await db.commit()
    
    return {
        "status": "success", 
        "is_liked": is_liked,
        "latest_likes": current_likes 
    }

# --- 5. 评论 ---
@router.post("/{moment_id}/comment")
async def add_comment(
    moment_id: int,
    content: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_comment = {
        "cid": str(uuid.uuid4())[:8],
        "user_id": current_user.id,
        "username": current_user.username,
        "avatar": current_user.avatar_url,
        "content": content,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # 原子操作：将新评论追加到 jsonb 数组
    await db.execute(
        update(Moment).where(Moment.id == moment_id)
        .values(comments=Moment.comments.concat([new_comment]))
    )
    await db.commit()
    return {"status": "success", "comment": new_comment}