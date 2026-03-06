from sqlalchemy import Column, Integer, ForeignKey, Boolean, UniqueConstraint, DateTime #type:ignore
from sqlalchemy.sql import func #type:ignore
from app.db.session import Base 

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    
    # 发起者 ID
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # 被添加者 ID
    friend_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # 状态：True 代表已成为好友，False 代表申请中或已屏蔽（取决于业务）
    status = Column(Boolean, default=True)
    
    # 添加时间
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 核心：联合唯一约束，确保 A 和 B 之间只存在一条关系记录
    __table_args__ = (
        UniqueConstraint('user_id', 'friend_id', name='_user_friend_uc'),
    )