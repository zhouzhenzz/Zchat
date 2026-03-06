import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool #type:ignore
from alembic import context #type:ignore
from dotenv import load_dotenv

# 导入你的模型
from app.db.session import Base
from app.models.chat import Message
from app.models.friendship import Friendship
from app.models.moment import Moment
from app.models.user import User

# 1. 加载指定的 .env 文件
# 假设 .env.development 在项目根目录（backend/ 下）
load_dotenv(".env.development")

# 获取 Alembic 配置对象
config = context.config

# 2. 动态设置 sqlalchemy.url
database_url = os.getenv("DATABASE_URL")
if database_url:
    # 关键点：Alembic 迁移建议使用同步驱动
    # 如果 DATABASE_URL 是 postgresql+asyncpg://... 
    # 替换为 postgresql://... (使用 psycopg2)
    if "+asyncpg" in database_url:
        database_url = database_url.replace("+asyncpg", "")
    
    config.set_main_option("sqlalchemy.url", database_url)

# 配置日志
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    # 这里的配置会读取上面 config.set_main_option 设置好的 url
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()