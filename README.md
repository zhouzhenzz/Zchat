# 💬 Zchat - 现代化实时聊天应用

一个功能较为完整的实时聊天应用，支持一对一聊天、群聊、好友管理、动态发布等功能。

## ✨ 功能特性

### 🎯 核心功能
- 🔐 用户认证：注册、登录、密码重置
- 💬 实时聊天：一对一聊天、群聊
- 👥 好友管理：添加好友、好友请求、好友列表
- 📝 动态发布：发布文字、图片动态
- 📱 响应式设计：适配桌面和移动设备
- 📁 文件传输：支持图片等文件的发送和接收
- 🔒 安全保障：JWT 认证、密码加密

### 🚀 技术特性
- ⚡ 前后端分离架构
- 🌐 RESTful API 设计
- 🔄 实时通信支持
- 🐳 Docker 容器化部署
- 🧩 模块化代码结构

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **🎨 前端** | React 19、TypeScript、Vite、Tailwind CSS、Zustand |
| **⚙️ 后端** | Python 3.11+、FastAPI、SQLAlchemy、Pydantic |
| **💾 数据库** | PostgreSQL、Redis |
| **🚢 部署** | Docker、Docker Compose、Nginx |

## 📂 项目结构

```
Zchat/
├── backend/                    # 📦 后端代码
│   ├── app/                    # 🧠 应用核心
│   │   ├── api/                # 🌐 API 端点
│   │   ├── core/               # ⚙️ 核心配置
│   │   ├── db/                 # 🔌 数据库连接
│   │   ├── models/             # 📊 数据模型
│   │   └── schemas/            # ✅ 数据验证
│   ├── Dockerfile              # 🐳 后端容器配置
│   └── requirements.txt        # 📋 Python 依赖
├── frontend/                   # 🎨 前端代码
│   ├── src/                    # 📝 源代码
│   │   ├── api/                # 🔗 API 调用
│   │   ├── components/         # 🧱 组件
│   │   ├── pages/              # 📄 页面
│   │   ├── store/              # 🗃️ 状态管理
│   │   └── types/              # 📐 类型定义
│   ├── Dockerfile              # 🐳 前端容器配置
│   └── package.json            # 📦 Node.js 依赖
├── docker-compose.yml          # 🎼 Docker 编排配置
└── LICENSE                     # 📜 MIT 许可证
```

## 🚀 快速开始

### 🐳 方式一：Docker 部署（推荐）

```bash
# 克隆项目
git clone https://github.com/your-username/zchat.git
cd zchat

# 启动所有服务
docker-compose up -d

# 🎉 访问应用
# 🌐 前端：http://localhost
# 🔌 后端 API：http://localhost:8000
# 📖 API 文档：http://localhost:8000/docs
```

### 💻 方式二：本地开发

#### ⚙️ 后端设置

```bash
cd backend

# 🐍 创建虚拟环境
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/activate

# 📦 安装依赖
pip install -r requirements.txt

# ⚙️ 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 🚀 启动服务
uvicorn app.main:app --reload
```

#### 🎨 前端设置

```bash
cd frontend

# 📦 安装依赖
npm install

# ⚙️ 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置后端 API 地址

# 🚀 启动开发服务器
npm run dev
```

#### 🌐 访问应用

- 🎨 前端：http://localhost:5173
- 🔌 后端 API：http://localhost:8000
- 📖 API 文档：http://localhost:8000/docs

## ⚙️ 环境变量

### 📄 后端环境变量 (`backend/.env`)

```env
# 💾 数据库连接
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/zchat

# 🔴 Redis 缓存
REDIS_URL=redis://localhost:6379/0

# 🔐 JWT 配置
SECRET_KEY=your-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 🐛 调试模式
DEBUG=True
```

### 📄 前端环境变量 (`frontend/.env`)

```env
# 🔌 后端 API 地址
VITE_API_URL=http://localhost:8000
```

## 📖 API 文档

启动后端服务后，访问以下地址查看 API 文档：

- 📚 Swagger UI：http://localhost:8000/docs
- 📕 ReDoc：http://localhost:8000/redoc

## 🧑‍💻 开发指南

### 📏 代码风格

- **🎨 前端**：使用 ESLint 保持代码风格一致
- **⚙️ 后端**：使用 Black 和 Flake8 保持代码风格一致

### 🏗️ 构建生产版本

```bash
# 🎨 前端构建
cd frontend
npm run build

# 🐳 Docker 构建
docker-compose build
docker-compose up -d
```

## 📜 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

⭐ 如果这个项目对你有帮助，请给它一个 Star！
