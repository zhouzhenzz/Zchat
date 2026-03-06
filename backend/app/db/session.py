from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession #type:ignore
from sqlalchemy.orm import declarative_base #type:ignore
from typing import AsyncGenerator
from app.core.config import settings

# 1. 创建异步引擎
# 删除了重复参数，并保留了对 Windows 稳定性有帮助的配置
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,                # 连接池保持 10 个连接
    max_overflow=20,             # 允许在高峰期额外增加 20 个连接
    pool_recycle=1800,           # 30 分钟自动回收连接，防止数据库主动断开
    pool_pre_ping=True,          # 每次使用前检查连接有效性
    connect_args={
        "command_timeout": 60,   # 增加命令执行的超时时间
    }
)

# 2. 异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,      # 提交后不使对象失效，方便在路由中使用
    autoflush=False
)

# 3. 模型基类
Base = declarative_base()

# 4. 依赖注入：用于 FastAPI 路由获取数据库连接
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            # async with 会自动处理关闭，显式写出来更保险
            await session.close()