import os
import uuid
import io
from datetime import datetime, time, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request #type:ignore
from pydantic import BaseModel #type:ignore
from PIL import Image #type:ignore
from sqlalchemy.ext.asyncio import AsyncSession #type:ignore
from sqlalchemy import select, func, and_ #type:ignore

from app.db.session import get_db
from app.api.endpoints.user import get_current_user
from app.models.user import User
from app.models.chat import Message  # 用于统计限额

router = APIRouter()

# 配置项
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
DAILY_UPLOAD_LIMIT = 50          # 每日限额
TARGET_WIDTH = 800  # 调整为更适合聊天框的宽度
TARGET_HEIGHT = 600  # 调整为更适合聊天框的高度

class UploadResponse(BaseModel):
    status: str
    url: str
    filename: str
    mimetype: str
    size: str

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    工业级文件上传：
    1. 每日限额校验
    2. 文件类型校验
    3. 自动图像压缩 (适合聊天框大小)
    4. PNG 转 JPEG 优化
    5. 返回完整图片URL
    """
    
    # --- A. 每日上传限额拦截 ---
    # 获取今天的 00:00:00
    today_start = datetime.combine(datetime.now().date(), time.min)
    
    # 统计该用户今天已发送的图片消息数量
    limit_query = select(func.count(Message.id)).where(
        and_(
            Message.sender_id == current_user.id,
            Message.msg_type == "image",
            Message.created_at >= today_start
        )
    )
    limit_result = await db.execute(limit_query)
    count = limit_result.scalar() or 0
    
    if count >= DAILY_UPLOAD_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"今日上传额度已用完（每日限额 {DAILY_UPLOAD_LIMIT} 张）"
        )

    # --- B. 基础校验 ---
    file_extension = os.path.splitext(file.filename)[1].lower()
    img_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    doc_extensions = {".pdf", ".docx", ".txt"}
    
    if file_extension not in img_extensions.union(doc_extensions):
        raise HTTPException(status_code=400, detail="不支持的文件格式")

    # 读取内容并校验原始大小
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="文件大小不能超过 5MB")

    # 准备存储路径
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # --- C. 核心处理逻辑 ---
    final_mimetype = file.content_type

    if file_extension in img_extensions:
        try:
            # 异步图像处理：在内存中操作
            img = Image.open(io.BytesIO(content))
            
            # 1. 格式优化：PNG/RGBA 转 RGB (JPEG 压缩率更高)
            if img.mode in ("RGBA", "P") and file_extension != ".gif":
                img = img.convert("RGB")
                unique_filename = f"{uuid.uuid4()}.jpg"
                file_path = os.path.join(UPLOAD_DIR, unique_filename)
                final_mimetype = "image/jpeg"

            # 2. 尺寸压缩：thumbnail 保持宽高比
            img.thumbnail((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
            
            # 3. 质量优化：JPEG 85% 质量保存
            if file_extension in [".jpg", ".jpeg"] or final_mimetype == "image/jpeg":
                img.save(file_path, "JPEG", optimize=True, quality=85)
            else:
                # 其他格式保持原格式
                img.save(file_path, optimize=True)
            
        except Exception as e:
            # 万一 Pillow 处理失败，降级为原始保存
            print(f"Image compression failed: {e}")
            with open(file_path, "wb") as f:
                f.write(content)
    else:
        # 非图片格式直接写盘
        with open(file_path, "wb") as f:
            f.write(content)

    # --- D. 结果返回 ---
    final_size_kb = os.path.getsize(file_path) / 1024
    
    # 构建完整的图片URL
    base_url = str(request.base_url)
    image_url = f"{base_url}static/{unique_filename}"
    
    return {
        "status": "success",
        "url": image_url,
        "filename": file.filename,
        "mimetype": final_mimetype,
        "size": f"{final_size_kb:.2f} KB"
    }