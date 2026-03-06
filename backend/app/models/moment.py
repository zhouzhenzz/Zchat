from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey #type:ignore
from sqlalchemy.dialects.postgresql import JSONB #type:ignore
from sqlalchemy.sql import func #type:ignore
from app.db.session import Base

class Moment(Base):
    __tablename__ = "moments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=True)
    
    # images: ["/static/1.jpg", "/static/2.jpg"]
    images = Column(JSONB, server_default='[]')
    
    # likes: [{"user_id": 1, "username": "张三"}, ...]
    likes = Column(JSONB, server_default='[]')
    
    # comments: [{"user_id": 2, "username": "李四", "content": "顶", "created_at": "..."}]
    comments = Column(JSONB, server_default='[]')
    
    created_at = Column(DateTime, server_default=func.now())