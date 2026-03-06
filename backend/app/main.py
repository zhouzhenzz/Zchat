<<<<<<< HEAD
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os
import re
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.api.api import api_router
from app.db.session import engine
from app.core.config import settings
from app.models import Base 
from app.models.chat import Message
=======
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
>>>>>>> 06f023cec3d1107a77276ffc167723bdc2dcc36e
from app.models.friendship import Friendship
from app.models.moment import Moment
from app.models.user import User


UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


<<<<<<< HEAD
async def create_database_if_not_exists():
    database_url = settings.DATABASE_URL
    match = re.match(r'postgresql\+asyncpg://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', database_url)
    if match:
        username, password, host, port, database_name = match.groups()
        
        system_url = f'postgresql+asyncpg://{username}:{password}@{host}:{port}/postgres'
        engine_system = create_async_engine(system_url, echo=settings.DEBUG)
        
        try:
            async with engine_system.connect() as conn:
                result = await conn.execute(
                    text(f"SELECT 1 FROM pg_database WHERE datname = '{database_name}'")
                )
                database_exists = result.scalar()
                
                if not database_exists:
                    print(f"--- 数据库 {database_name} 不存在，正在创建 ---")
                    await conn.execute(text('COMMIT'))
                    await conn.execute(text(f'CREATE DATABASE "{database_name}"'))
                    print(f"--- 数据库 {database_name} 创建成功 ---")
                else:
                    print(f"--- 数据库 {database_name} 已存在 ---")
        finally:
            await engine_system.dispose()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_database_if_not_exists()
    
    async with engine.begin() as conn:
        if settings.DEBUG:
            print("--- 正在检测并自动创建数据表 ---")
            await conn.run_sync(Base.metadata.create_all)
            print("--- 数据表初始化完成 ---")
    yield
=======

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
>>>>>>> 06f023cec3d1107a77276ffc167723bdc2dcc36e
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME, 
    version="1.0.0",
    lifespan=lifespan
)

<<<<<<< HEAD
=======
# 配置跨域
>>>>>>> 06f023cec3d1107a77276ffc167723bdc2dcc36e
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
app.include_router(api_router, prefix="/api")
=======
# 挂载路由
app.include_router(api_router, prefix="/api")
#挂载图片路径
>>>>>>> 06f023cec3d1107a77276ffc167723bdc2dcc36e
app.mount("/static", StaticFiles(directory="uploads"), name="static")

@app.get("/")
async def root():
    return {"message": "Welcome to Zchat API", "db_status": "connected"}