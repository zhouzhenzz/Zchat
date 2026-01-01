from pydantic import BaseModel #type:ignore
from datetime import datetime
from typing import Optional

# 基础模型
class FriendshipBase(BaseModel):
    friend_id: int

# 响应模型：用于返回好友列表或申请列表
class FriendshipOut(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: bool
    created_at: datetime

    class Config:
        from_attributes = True # 允许从 SQLAlchemy 模型自动转换

# 扩展响应：包含好友的详细信息（如昵称）
class FriendUserInfo(BaseModel):
    id: int
    username: str
    # 可以根据需要添加 avatar 等字段

class FriendshipDetailOut(FriendshipOut):
    friend_info: Optional[FriendUserInfo] = None