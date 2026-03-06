from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime #type:ignore
from sqlalchemy.sql import func #type:ignore
from app.db.session import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    group_id = Column(Integer, index=True, nullable=True)
    
    content = Column(Text, nullable=False)
    msg_type = Column(String, default="text")
    
    # --- 新增/完善字段 ---
    is_read = Column(Boolean, default=False, index=True) # 已读/未读状态
    is_recalled = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())