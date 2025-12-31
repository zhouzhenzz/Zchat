from fastapi import APIRouter #type:ignore
from app.api.endpoints import user,chat

api_router = APIRouter()

@api_router.get("/health")
def health_check():
    return {"status": "ok"}

api_router.include_router(user.router, prefix="/users", tags=["用户"])
api_router.include_router(chat.router, prefix="/chat", tags=["消息"])