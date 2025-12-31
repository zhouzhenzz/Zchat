# app/models/__init__.py
from app.db.session import Base  # 从 session 导入 Base
from .user import User           # 导入具体模型类
# from .chat import Message      # 如果写好了就取消注释
# from .moment import Moment     # 如果写好了就取消注释

# 这里的 __all__ 确保了外部 from app.models import * 时能拿到 Base
__all__ = ["Base", "User"]