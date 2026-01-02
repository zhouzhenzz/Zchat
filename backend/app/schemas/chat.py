from pydantic import BaseModel, Field #type:ignore
from typing import Optional

class ChatSessionOut(BaseModel):
    # 对方的 ID（在会话列表中，我们需要知道点击这个头像该给谁发消息）
    peer_id: int = Field(..., description="对方用户ID")
    
    # 对方的信息（直接对齐 UserBase 的字段名）
    username: str = Field(..., description="对方用户名")
    avatar_url: Optional[str] = Field(None, description="对方头像地址")
    
    # 消息缩略信息
    last_message: str = Field(..., description="最后一条消息缩略内容")
    last_time: str = Field(..., description="最后消息发送时间 (格式化字符串)")
    msg_type: str = Field(..., description="消息类型: text, image, etc.")
    
    # 核心业务字段
    unread_count: int = Field(0, description="当前会话的未读消息总数")

    class Config:
        from_attributes = True