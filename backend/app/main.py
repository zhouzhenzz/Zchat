from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router

app = FastAPI(title="Zchat API", version="1.0.0")

# 配置跨域 - 企业级开发必备
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应替换为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载路由
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to Zchat API"}