from sqlalchemy import Column, Integer, String, Text,Boolean, DateTime #type:ignore
from sqlalchemy.sql import func #type:ignore
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # 个人资料字段
    avatar_url = Column(String, nullable=True)  # 头像
    bio = Column(String, nullable=True)         # 签名/简介
    location = Column(String, nullable=True)    # 地区
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    is_active = Column(Boolean, default=True)