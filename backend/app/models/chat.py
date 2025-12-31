from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime #type:ignore
from sqlalchemy.sql import func #type:ignore
from app.db.session import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True) # 私聊
    group_id = Column(Integer, index=True, nullable=True) # 群聊ID (后面可以加专门的Group表)
    
    content = Column(Text, nullable=False)
    msg_type = Column(String, default="text") # text, image, file, voice
    
    # 撤回与删除逻辑
    is_recalled = Column(Boolean, default=False)  # 撤回状态
    created_at = Column(DateTime, server_default=func.now())