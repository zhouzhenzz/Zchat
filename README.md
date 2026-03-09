# Zchat - 现代化实时聊天应用

## 项目简介

Zchat 是一个功能完整的实时聊天应用，支持一对一聊天、群聊、好友管理、动态发布等功能。项目采用前后端分离架构，前端使用 React + TypeScript，后端使用 FastAPI + Python，提供了现代化的用户体验和稳定的后端服务。

## 功能特性

### 核心功能
- 🔐 用户认证：注册、登录、密码重置
- 💬 实时聊天：一对一聊天、群聊
- 👥 好友管理：添加好友、好友请求、好友列表
- 📝 动态发布：发布文字、图片动态
- 📱 响应式设计：适配桌面和移动设备
- 📁 文件传输：支持图片等文件的发送和接收
- 🔒 安全保障：JWT 认证、密码加密

### 技术特性
- 前后端分离架构
- RESTful API 设计
- 实时通信支持
- Docker 容器化部署
- 模块化代码结构
- 类型安全（TypeScript + Python 类型提示）

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router
- Zustand (状态管理)

### 后端
- Python 3.10+
- FastAPI
- SQLAlchemy
- JWT
- Pydantic

### 部署
- Docker
- Docker Compose
- Nginx

## 项目结构

```
Zchat/
├── backend/              # 后端代码
│   ├── app/              # 应用核心
│   │   ├── api/          # API 端点
│   │   ├── core/         # 核心配置
│   │   ├── db/           # 数据库连接
│   │   ├── models/       # 数据模型
│   │   ├── schemas/      # 数据验证
│   │   └── main.py       # 应用入口
│   ├── requirements.txt  # 依赖包
│   └── DockerFile        # Docker 配置
├── frontend/             # 前端代码
│   ├── src/              # 源代码
│   │   ├── api/          # API 调用
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   ├── router/       # 路由
│   │   ├── store/        # 状态管理
│   │   └── types/        # 类型定义
│   ├── package.json      # 依赖配置
│   └── DockerFile        # Docker 配置
└── docker-compose.yml    # 容器编排
```

## 快速开始

### 方法一：使用 Docker Compose（推荐）

1. 克隆项目

```bash
git clone https://github.com/zhouzhenzz/Zchat.git
cd Zchat
```

2. 启动服务

```bash
docker-compose up -d
```

3. 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 方法二：本地开发环境

#### 后端设置

1. 进入后端目录

```bash
cd backend
```

2. 创建虚拟环境并安装依赖

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

3. 启动后端服务

```bash
uvicorn app.main:app --reload
```

#### 前端设置

1. 进入前端目录

```bash
cd frontend
```

2. 安装依赖

```bash
npm install
```

3. 启动前端开发服务器

```bash
npm run dev
```

4. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:8000

## API 文档

后端提供了完整的 RESTful API，可通过以下地址访问交互式 API 文档：

- Swagger UI：http://localhost:8000/docs
- ReDoc：http://localhost:8000/redoc

## 主要 API 端点

### 用户相关
- `POST /api/user/register` - 用户注册
- `POST /api/user/login` - 用户登录
- `GET /api/user/me` - 获取当前用户信息

### 聊天相关
- `GET /api/chat/` - 获取聊天列表
- `GET /api/chat/{chat_id}` - 获取聊天详情
- `POST /api/chat/` - 创建新聊天
- `POST /api/chat/{chat_id}/message` - 发送消息

### 好友相关
- `GET /api/friend/` - 获取好友列表
- `POST /api/friend/request` - 发送好友请求
- `POST /api/friend/request/{request_id}/accept` - 接受好友请求

### 动态相关
- `GET /api/moment/` - 获取动态列表
- `POST /api/moment/` - 发布新动态
- `POST /api/moment/{moment_id}/like` - 点赞动态

## 环境变量

### 后端环境变量

在 `backend/.env` 文件中配置：

```
# 数据库连接信息
DATABASE_URL="postgresql://user:password@localhost:5432/zchat"

# JWT 密钥
SECRET_KEY="your-secret-key"

# 算法
ALGORITHM="HS256"

# 访问令牌过期时间（分钟）
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 前端环境变量

在 `frontend/.env` 文件中配置：

```
# 后端 API 地址
VITE_API_BASE_URL="http://localhost:8000/api"
```

## 开发指南

### 代码风格

- 前端：使用 ESLint 和 Prettier 保持代码风格一致
- 后端：使用 Black 和 Flake8 保持代码风格一致

### 测试

运行后端测试：

```bash
cd backend
python -m pytest
```

### 构建生产版本

前端构建：

```bash
cd frontend
npm run build
```

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目！

### 贡献步骤

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目地址：[https://github.com/zhouzhenzz/Zchat](https://github.com/zhouzhenzz/Zchat)
- 问题反馈：[https://github.com/zhouzhenzz/Zchat/issues](https://github.com/zhouzhenzz/Zchat/issues)

---

感谢使用 Zchat！希望这个聊天应用能为您带来愉快的沟通体验 🎉