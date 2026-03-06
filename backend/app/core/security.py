from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt, JWTError
import bcrypt
from sqlalchemy import select
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.user import User

# --- 密码处理 ---
def get_password_hash(password: str) -> str:
    """生成哈希密码"""
    pwd_bytes = password.encode('utf-8')[:71]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """校验密码"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8')[:71], hashed_password.encode('utf-8'))
    except Exception:
        return False

# --- JWT 生成 ---
def create_access_token(subject: Union[str, Any], expires_delta: timedelta | None = None) -> str:
    """创建 JWT 访问令牌"""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# --- 工业级 Token 异步验证 (已修复类型警告) ---
async def verify_token(token: str) -> User | None:
    """验证 Token 并返回数据库中的 User 对象"""
    try:
        # 1. 解码载荷
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # 2. 安全提取 sub 并进行空值校验 (修复类型分配警告)
        user_id_raw = payload.get("sub")
        if user_id_raw is None:
            return None
        
        user_id = str(user_id_raw) # 明确转换为 str

        # 3. 数据库二次校验确保用户状态
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == int(user_id)))
            return result.scalars().first()
            
    except (JWTError, ValueError, TypeError):
        return None