from fastapi import FastAPI #type:ignore
from fastapi.middleware.cors import CORSMiddleware #type:ignore
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles #type:ignore
import os
from app.api.api import api_router
from app.db.session import engine
from app.core.config import settings
# 注意：这里从 app.models 导入 Base，此时 Base 已经关联了 User 等模型
from app.models import Base 
from app.models.chat import Message # 必须导入，Base 才会把它加入建表清单
from app.models.friendship import Friendship
from app.models.moment import Moment


UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)



@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时：自动建表
    async with engine.begin() as conn:
        if settings.DEBUG:
            print("--- 正在检测并自动创建数据表 ---")
            # 这里会扫描所有已导入 app.models 的模型并建表
            await conn.run_sync(Base.metadata.create_all)
            print("--- 数据表初始化完成 ---")
    yield
    # 关闭时：释放连接
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME, 
    version="1.0.0",
    lifespan=lifespan
)

# 配置跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载路由
app.include_router(api_router, prefix="/api")
#挂载图片路径
app.mount("/static", StaticFiles(directory="uploads"), name="static")

@app.get("/")
async def root():
    return {"message": "Welcome to Zchat API", "db_status": "connected"}