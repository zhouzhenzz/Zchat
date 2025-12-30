import os
# 注意：是从 pydantic_settings 导入，而不是 pydantic
from pydantic_settings import BaseSettings, SettingsConfigDict # type: ignore

# 获取当前环境标识
env_type = os.getenv("APP_ENV", "development")
env_file = f".env.{env_type}"

class Settings(BaseSettings):
    PROJECT_NAME: str
    DEBUG: bool
    DATABASE_URL: str
    SECRET_KEY: str

    # Pydantic V2 的配置方式
    model_config = SettingsConfigDict(
        env_file=env_file,
        env_file_encoding='utf-8',
        extra='ignore'  # 允许 env 文件中有额外的变量而不报错
    )

settings = Settings()