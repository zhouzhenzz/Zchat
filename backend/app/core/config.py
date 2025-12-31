import os
from pydantic_settings import BaseSettings, SettingsConfigDict # type: ignore

# 确保环境变量正确，或者直接硬编码为 ".env.development"
env_type = os.getenv("APP_ENV", "development")
env_file = f".env.{env_type}"

class Settings(BaseSettings):
    # --- 基础配置 ---
    PROJECT_NAME: str = "Zchat-Dev"
    DEBUG: bool = True

    # --- 数据库与 Redis ---
    DATABASE_URL: str 
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- 安全配置 ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7天

    model_config = SettingsConfigDict(
        env_file=env_file,
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()