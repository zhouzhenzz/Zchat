import os
from pydantic_settings import BaseSettings, SettingsConfigDict

env_type = os.getenv("APP_ENV", "development")
env_file = f".env.{env_type}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zchat-Dev"
    DEBUG: bool = True

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    model_config = SettingsConfigDict(
        env_file=env_file,
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()