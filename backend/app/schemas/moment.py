from pydantic import BaseModel #type:ignore
from typing import List, Optional
from datetime import datetime

class CommentSchema(BaseModel):
    user_id: int
    username: str
    content: str
    created_at: str

class LikeSchema(BaseModel):
    user_id: int
    username: str

class MomentResponse(BaseModel):
    id: int
    user_id: int
    username: str
    avatar: Optional[str]
    content: Optional[str]
    images: List[str]
    likes: List[LikeSchema]
    comments: List[CommentSchema]
    created_at: datetime

    class Config:
        from_attributes = True