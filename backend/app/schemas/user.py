from pydantic import BaseModel, EmailStr, Field #type:ignore
from typing import Optional
from datetime import datetime

# 基础 User 字段
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None

# 创建用户时的输入（注册时需要密码）
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72  )

# 返回给前端的用户信息（不包含密码！）
class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        # 必须开启，否则 Pydantic 无法直接读取 SQLAlchemy 对象
        from_attributes = True

# 登录逻辑需要的模型
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None