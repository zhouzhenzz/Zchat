from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON #type:ignore
from sqlalchemy.sql import func #type:ignore
from app.db.session import Base

class Moment(Base):
    __tablename__ = "moments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    media_urls = Column(JSON) # 存储图片数组 ["url1", "url2"]
    location = Column(String, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())