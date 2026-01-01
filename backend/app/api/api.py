from fastapi import APIRouter #type:ignore
from app.api.endpoints import user,chat,friendship,file,moment
api_router = APIRouter()

@api_router.get("/health")
def health_check():
    return {"status": "ok"}

api_router.include_router(user.router, prefix="/users", tags=["用户"])
api_router.include_router(chat.router, prefix="/chat", tags=["消息"])
api_router.include_router(friendship.router, prefix="/friends", tags=["社交"])
api_router.include_router(file.router, prefix="/media", tags=["媒体服务"])
api_router.include_router(moment.router, prefix="/moments", tags=["朋友圈"])