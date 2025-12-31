from fastapi import APIRouter, Depends, HTTPException, status #type:ignore
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer #type:ignore
from sqlalchemy.ext.asyncio import AsyncSession #type:ignore
from sqlalchemy.future import select #type:ignore
from jose import jwt, JWTError #type:ignore
from typing import Any

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token
from app.core.security import get_password_hash, create_access_token, verify_password
from app.core.config import settings

router = APIRouter()

# 1. 定义 OAuth2 方案，告诉 Swagger 登录接口的相对路径
# 这个 tokenUrl 会让 Swagger 右上角出现 Authorize 按钮
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

# --- 身份验证依赖项 (Dependency) ---

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    核心安全依赖：解析 Token 并验证用户身份
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="认证已失效，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 解密 JWT Token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        # 解决类型检查警告：先获取 sub，再验证其合法性
        user_id_raw = payload.get("sub")
        if user_id_raw is None:
            raise credentials_exception
        
        # 确保 user_id 可以被识别为字符串或数字以供数据库查询
        user_id = str(user_id_raw)
        
    except JWTError:
        raise credentials_exception
    
    # 到数据库中查找对应的用户
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
    return user


# --- 业务逻辑接口 (Endpoints) ---

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    用户注册：检查唯一性 -> 加密密码 -> 存入数据库
    """
    # 1. 检查邮箱唯一性
    email_check = await db.execute(select(User).where(User.email == user_in.email))
    if email_check.scalars().first():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")
    
    # 2. 检查用户名唯一性
    user_check = await db.execute(select(User).where(User.username == user_in.username))
    if user_check.scalars().first():
        raise HTTPException(status_code=400, detail="用户名已被占用")

    # 3. 处理数据
    user_data = user_in.model_dump(exclude={"password"})
    hashed_password = get_password_hash(user_in.password)
    
    # 4. 创建用户并保存
    new_user = User(**user_data, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    用户登录：验证身份并颁发 JWT Token
    """
    # 1. 查找用户
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalars().first()
    
    # 2. 校验密码
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. 生成访问令牌
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    受保护接口：获取当前登录用户的详细资料
    """
    return current_user