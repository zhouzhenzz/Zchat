# Zchat 全栈架构详细文档

> **版本**：v1.0.0 | **最后更新**：2025-07-17

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [系统架构](#3-系统架构)
4. [数据库设计](#4-数据库设计)
5. [后端设计](#5-后端设计)
6. [安全体系](#6-安全体系)
7. [Redis 缓存架构与 SQL 数据联动](#7-redis-缓存架构与-sql-数据联动)
8. [前端架构](#8-前端架构)
9. [WebRTC 音视频通话](#9-webrtc-音视频通话)
10. [API 接口文档](#10-api-接口文档)
11. [部署运维](#11-部署运维)
12. [目录结构](#12-目录结构)

---

## 1. 项目概述

### 1.1 项目简介

Zchat 是一个**现代化实时聊天应用**，支持文本消息、音视频通话、朋友圈动态、好友管理等核心社交功能。采用前后端分离架构，支持 Web 浏览器和 Electron 桌面端双端运行。

### 1.2 核心功能

| 功能模块 | 说明 |
|----------|------|
| 用户系统 | 注册、登录、JWT认证、个人资料管理 |
| 实时聊天 | 一对一私聊、消息已读/撤回、文件/图片发送 |
| 音视频通话 | 一对一 WebRTC 实时音视频通话 |
| 好友管理 | 添加好友、通过/拒绝申请、好友列表 |
| 朋友圈 | 发布动态、点赞、评论、Feed流 |
| 文件上传 | 图片/文件上传、自动压缩、每日限额 |

### 1.3 支持平台

- **Web 浏览器**：Chrome / Firefox / Edge（现代浏览器）
- **桌面客户端**：Electron（Windows / macOS / Linux）

---

## 2. 技术栈

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2 | UI 框架 |
| TypeScript | 5.9 | 类型安全 |
| Vite (rolldown) | 7.2.5 | 构建工具 |
| React Router | 7.11 | 前端路由 |
| Zustand | 5.0 | 全局状态管理 |
| Axios | 1.13 | HTTP 客户端 |
| Tailwind CSS | 4.1 | 原子化CSS样式 |
| Electron | 41 | 桌面端容器 |
| WebRTC API | 原生 | 音视频通话 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| FastAPI | 0.128 | Web 框架 |
| Python | 3.11+ | 运行环境 |
| SQLAlchemy | 2.0 | 异步 ORM |
| PostgreSQL | 15+ | 关系型数据库 |
| Redis | 7+ | 缓存层 |
| Uvicorn | 0.40 | ASGI 服务器 |
| JWT (python-jose) | - | Token 认证 |
| bcrypt | 5.0 | 密码哈希 |
| Pillow | - | 图片处理压缩 |
| aioredis | 5.2 | Redis 异步客户端 |

### 2.3 基础设施

| 组件 | 说明 |
|------|------|
| Nginx | 反向代理、SSL终止、静态文件服务 |
| Let's Encrypt | 免费SSL证书 |
| STUN 服务器 | Google 公共 STUN（NAT穿透） |

---

## 3. 系统架构

### 3.1 整体架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                        用户端 (Client)                               │
│                                                                      │
│  ┌──────────────────────┐    ┌──────────────────────────┐            │
│  │   Web 浏览器          │    │  Electron 桌面客户端      │            │
│  │   Chrome/Firefox/Edge │    │  Windows/macOS/Linux     │            │
│  └──────────┬───────────┘    └────────────┬─────────────┘            │
│             │                             │                          │
│             └────────────┬────────────────┘                          │
│                          │ HTTPS (TLS 1.3)                           │
│                          │ WSS (WebSocket Secure)                    │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────────┐
│                    Nginx (反向代理层)                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  SSL 终止 | 静态文件服务 | WebSocket 升级 | Gzip 压缩         │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
    ┌─────────▼──────────┐   ┌─────────▼──────────┐
    │  FastAPI (API服务)  │   │  静态资源 (/static) │
    │                    │   │  uploads/ 目录     │
    │  HTTP REST 接口     │   │  图片、头像、文件   │
    │  WebSocket 接口     │   └───────────────────┘
    └────────┬───────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼──────┐   ┌──────▼──────┐
│ PostgreSQL│   │    Redis    │
│ (真理来源)│   │  (缓存层)   │
│           │   │             │
│ 用户数据   │   │ 用户信息     │
│ 消息记录   │   │ 好友检查     │
│ 好友关系   │   │ 会话列表     │
│ 朋友圈动态  │   │ 聊天历史     │
│           │   │ 朋友圈Feed   │
└───────────┘   └─────────────┘
```

### 3.2 请求生命周期

```
1. 用户请求 → Nginx (SSL解密)
2. Nginx → FastAPI (反向代理)
3. FastAPI 中间件：CORS 校验 → JWT 认证 → 路由匹配
4. 路由处理：
   - 查 Redis 缓存 → 命中则返回（快路径）
   - 未命中 → 查 PostgreSQL → 回写 Redis → 返回（慢路径）
5. 如果涉及写操作：写 PostgreSQL → 失效相关 Redis 缓存
6. FastAPI → Nginx → 用户（响应）
```

### 3.3 通信协议

| 协议 | 用途 | 端点 |
|------|------|------|
| **HTTPS (REST)** | 用户注册登录、好友管理、朋友圈、文件上传、获取会话/历史 | `/api/*` |
| **WSS (WebSocket)** | 实时消息推送、WebRTC信令转发 | `/api/chat/ws/{token}` |
| **P2P (UDP/TCP)** | WebRTC 音视频媒体流传输（浏览器直连） | 动态端口 |

---

## 4. 数据库设计

### 4.1 ER 图

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│    users    │         │   friendships    │         │   moments   │
├─────────────┤         ├──────────────────┤         ├─────────────┤
│ id (PK)     │◄────────│ user_id (FK)     │         │ id (PK)     │
│ username    │  ┌──────│ friend_id (FK)   │         │ user_id(FK) │──────┐
│ email       │  │      │ status (Boolean) │         │ content     │      │
│ hashed_pwd  │  │      │ created_at       │         │ images(JSON)│      │
│ avatar_url  │  │      │ UNIQUE(u,f)      │         │ likes(JSON) │      │
│ bio         │  │      └──────────────────┘         │ comments(JSON)│    │
│ location    │  │                                   │ created_at  │      │
│ is_active   │  │                                   └─────────────┘      │
│ created_at  │  │                                                        │
│ updated_at  │  │                                                        │
└─────────────┘  │                                                        │
      │          │                                                        │
      │          │         ┌──────────────────┐                           │
      ├────────────────────│    messages      │                           │
      │        ┌───────────├──────────────────┤                           │
      │        │           │ id (PK)          │                           │
      └────────┼───────────│ sender_id (FK)   │                           │
               │           │ receiver_id (FK) │                           │
               └───────────│ group_id (NULL)  │                           │
                           │ content          │                           │
                           │ msg_type         │                           │
                           │ is_read          │                           │
                           │ is_recalled      │                           │
                           │ created_at       │                           │
                           └──────────────────┘                           │
                                                                          │
                      ┌───────────────────────┐                           │
                      │       关系说明         │                           │
                      ├───────────────────────┤                           │
                      │ users 1:N messages    │                           │
                      │ users M:N friendships │                           │
                      │ users 1:N moments     │                           │
                      └───────────────────────┘                           │
```

### 4.2 建表语句（DDL）

```sql
-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    avatar_url    VARCHAR(500),
    bio           VARCHAR(500),
    location      VARCHAR(200),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email    ON users(email);

-- ============================================================
-- 2. 消息表
-- ============================================================
CREATE TABLE messages (
    id           SERIAL PRIMARY KEY,
    sender_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id     INTEGER,
    content      TEXT    NOT NULL,
    msg_type     VARCHAR(20)  DEFAULT 'text',      -- text | image | file
    is_read      BOOLEAN      DEFAULT FALSE,
    is_recalled  BOOLEAN      DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_sender_id    ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id  ON messages(receiver_id);
CREATE INDEX idx_messages_is_read      ON messages(is_read);
CREATE INDEX idx_messages_created_at   ON messages(created_at);

-- ============================================================
-- 3. 好友关系表
-- ============================================================
CREATE TABLE friendships (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     BOOLEAN NOT NULL DEFAULT FALSE,    -- false=申请中, true=已通过
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT _user_friend_uc UNIQUE (user_id, friend_id)
);

-- ============================================================
-- 4. 朋友圈动态表
-- ============================================================
CREATE TABLE moments (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT,
    images     JSONB NOT NULL DEFAULT '[]'::jsonb,   -- ["/static/1.jpg", ...]
    likes      JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{"user_id":1,"username":"张三"},...]
    comments   JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{"user_id":2,"username":"李四","content":"顶"},...]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_moments_user_id ON moments(user_id);
```

### 4.3 数据库配置

**连接信息**（定义在 `backend/app/db/session.py`）：

```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,              # 连接池保持10个连接
    max_overflow=20,           # 高峰期额外20个连接（最多30并发）
    pool_recycle=1800,         # 30分钟自动回收连接
    pool_pre_ping=True,        # 每次使用前检查连接有效性
    connect_args={"command_timeout": 60}
)
```

**自动建表**：应用启动时，`lifespan` 函数会检测数据库是否存在，不存在则自动创建，然后调用 `Base.metadata.create_all` 建表。

---

## 5. 后端设计

### 5.1 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI 应用入口、lifespan、CORS、路由挂载
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── api.py               # 路由聚合器（include_router）
│   │   └── endpoints/
│   │       ├── user.py          # 用户认证、注册、登录、个人信息
│   │       ├── chat.py          # WebSocket 通信、消息收发、会话/历史管理
│   │       ├── friendship.py    # 好友申请、通过、拒绝、列表
│   │       ├── file.py          # 文件上传、图片压缩、每日限额
│   │       └── moment.py        # 朋友圈发布、删除、Feed、点赞、评论
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # 环境变量配置（Pydantic Settings）
│   │   ├── security.py          # JWT 签发验证、bcrypt 密码处理
│   │   ├── redis_client.py      # Redis 异步连接池（懒加载单例）
│   │   └── cache.py             # 6组缓存策略（用户/好友检查/好友列表/会话/历史/Feed）
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   └── session.py           # SQLAlchemy 异步引擎、会话工厂、Base 基类
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # User 模型
│   │   ├── chat.py              # Message 模型
│   │   ├── friendship.py        # Friendship 模型
│   │   └── moment.py            # Moment 模型
│   │
│   └── schemas/
│       ├── __init__.py
│       ├── user.py              # UserCreate / UserOut / Token / UserUpdate
│       ├── chat.py              # ChatSessionOut
│       ├── friendship.py        # FriendshipOut / FriendshipDetailOut
│       └── moment.py            # MomentResponse
│
├── .env.development             # 开发环境变量
├── requirements.txt             # Python 依赖
└── pyrightconfig.json           # Pyright 类型检查配置
```

### 5.2 路由注册

所有路由在 `app/api/api.py` 中统一注册：

```python
api_router = APIRouter()

api_router.include_router(user.router,       prefix="/users",    tags=["用户"])
api_router.include_router(chat.router,       prefix="/chat",     tags=["消息"])
api_router.include_router(friendship.router, prefix="/friends",  tags=["社交"])
api_router.include_router(file.router,       prefix="/media",    tags=["媒体服务"])
api_router.include_router(moment.router,     prefix="/moments",  tags=["朋友圈"])
```

在 `main.py` 中挂载：

```python
app.include_router(api_router, prefix="/api")
app.mount("/static", StaticFiles(directory="uploads"), name="static")
```

### 5.3 路由总览表

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/users/register` | ❌ | 用户注册 |
| `POST` | `/api/users/login` | ❌ | 用户登录（OAuth2表单） |
| `GET` | `/api/users/me` | ✅ | 获取当前用户信息 |
| `PUT` | `/api/users/me` | ✅ | 修改个人信息 |
| `WS` | `/api/chat/ws/{token}` | ✅(URL Token) | WebSocket 长连接 |
| `GET` | `/api/chat/sessions` | ✅ | 获取会话列表 |
| `POST` | `/api/chat/read/{peer_id}` | ✅ | 标记消息已读 |
| `GET` | `/api/chat/history?target_id=` | ✅ | 获取历史消息 |
| `POST` | `/api/chat/recall/{message_id}` | ✅ | 撤回消息（2分钟内） |
| `POST` | `/api/friends/request/{friend_id}` | ✅ | 发送好友申请 |
| `POST` | `/api/friends/accept/{requester_id}` | ✅ | 通过好友申请 |
| `DELETE` | `/api/friends/remove/{target_id}` | ✅ | 删除好友/拒绝申请 |
| `GET` | `/api/friends/list` | ✅ | 获取好友列表 |
| `GET` | `/api/friends/pending` | ✅ | 获取待处理申请 |
| `POST` | `/api/media/upload` | ✅ | 文件上传（≤5MB，日限50张） |
| `POST` | `/api/moments/create` | ✅ | 发布朋友圈动态 |
| `DELETE` | `/api/moments/{moment_id}` | ✅ | 删除动态 |
| `GET` | `/api/moments/feed` | ✅ | 朋友圈Feed流（分页） |
| `POST` | `/api/moments/{moment_id}/like` | ✅ | 点赞/取消点赞 |
| `POST` | `/api/moments/{moment_id}/comment` | ✅ | 评论动态 |

---

## 6. 安全体系

### 6.1 认证流程

```
注册:
  明文密码 → bcrypt.hashpw(截断71字节, gensalt) → hashed_password
  → INSERT INTO users (..., hashed_password, ...)

登录:
  用户名+密码 → select User → bcrypt.checkpw(输入, 存储)
  → create_access_token(user.id) → JWT{sub:user_id, exp:+7天, alg:HS256}
  → 返回 {access_token, token_type:"bearer"}

请求验证（HTTP）:
  Authorization: Bearer {token}
  → jwt.decode(token, SECRET_KEY) → 提取 sub (user_id)
  → Redis 查缓存 → 未命中则查 DB
  → 返回 User 对象

请求验证（WebSocket）:
  ws://host/api/chat/ws/{token}
  → verify_token(token) → jwt.decode → 查 DB → 返回 User
```

### 6.2 密码安全

| 措施 | 说明 |
|------|------|
| bcrypt 哈希 | 自动加盐，不可逆 |
| 截断71字节 | 兼容 bcrypt 的 72 字节上限 |
| 密码最小6位 | Pydantic `min_length=6` 校验 |
| 不返回密码 | `UserOut` 模型不含 `hashed_password` |

### 6.3 JWT 令牌

| 参数 | 值 |
|------|-----|
| 算法 | HS256 |
| 密钥 | 环境变量 `SECRET_KEY` |
| 有效载荷 | `{"sub": user_id, "exp": 过期时间}` |
| 过期时间 | 7天（10080分钟） |
| 刷新策略 | 无（过期需重新登录） |

### 6.4 CORS 配置

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # 生产环境应改为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.5 业务安全

| 措施 | 说明 |
|------|------|
| 好友关系校验 | 发消息/信令前必须确认双方是好友 |
| 动态删除权限 | 只能删除自己的动态 |
| 撤回时间限制 | 超过2分钟的消息不可撤回 |
| 上传限额 | 每日最多50张图片上传 |
| 文件大小限制 | 单文件最大5MB |
| 图片格式白名单 | 仅允许 jpg/jpeg/png/gif/webp |
| 文件类型白名单 | 仅允许 pdf/docx/txt |

---

## 7. Redis 缓存架构与 SQL 数据联动

### 7.1 架构原则

> **PostgreSQL 是真理来源，Redis 是只读快照。**

- **Cache-Aside 模式**：读操作先查 Redis，未命中则查 PG 并回写；写操作先写 PG，然后删除 Redis 缓存。
- **短 TTL 兜底**：所有缓存都有过期时间，即使删除操作失败，旧数据也会在 TTL 内自动过期。

### 7.2 六大缓存维度

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Redis 6组缓存全景                               │
│                                                                        │
│  1. user:{id}                    用户信息    TTL=30分钟   GET用户资料   │
│                                   命中: get_current_user (每次请求)    │
│                                   失效: PUT /users/me                  │
│                                                                        │
│  2. friends:check:{lo}:{hi}      好友检查    TTL=5分钟    WS每条消息    │
│                                   命中: check_is_friend (每条WS消息)  │
│                                   失效: accept / remove                │
│                                                                        │
│  3. friends:list:{id}            好友列表    TTL=5分钟    GET好友列表   │
│     friends:pending:{id}         待处理申请  TTL=5分钟    GET申请列表   │
│                                   失效: accept / remove / request      │
│                                                                        │
│  4. chat:sessions:{id}           会话列表    TTL=60秒     GET会话列表   │
│                                   命中: 侧边栏刷新、新消息拉取          │
│                                   失效: 新消息 / 已读 / 撤回            │
│                                                                        │
│  5. chat:history:{lo}:{hi}       聊天历史    TTL=30秒     GET历史记录   │
│                                   命中: 点击用户进入聊天               │
│                                   失效: 新消息 / 撤回                   │
│                                                                        │
│  6. moments:feed:{id}:p{page}:s{size}  朋友圈  TTL=24小时  GET朋友圈   │
│                                   命中: 刷新朋友圈                     │
│                                   失效: create/delete/like/comment     │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.3 缓存读流程（以朋友圈为例）

```
GET /api/moments/feed?page=1&size=10
        │
        ▼
  ┌──────────────┐
  │ Redis GET     │  key = moments:feed:{user_id}:p1:s10
  └──────┬───────┘
         │
    ┌────┴────┐
    │ 命中？   │
    └────┬────┘
         │
  ┌──────┴──────┐
  │             │
 YES            NO
  │             │
  ▼             ▼
直接返回    ┌──────────────────────┐
(～1ms)    │ PostgreSQL 三步骤查询 │
           │ 1. 查 friendships     │
           │ 2. JOIN moments+users │
           │ 3. 组装 dict 列表     │
           └──────────┬───────────┘
                      │
                      ▼
               ┌──────────────┐
               │ Redis SETEX  │  key + TTL=86400
               │ 回写缓存     │
               └──────────────┘
                      │
                      ▼
                   返回数据
                   (～50ms+)
```

### 7.4 缓存失效流程

```
任何写操作（创建/删除/点赞/评论/修改好友关系/发送消息等）
        │
        ▼
  ┌──────────────┐
  │ PostgreSQL   │  先写数据库（真理来源永久保存）
  │ INSERT/UPDATE│
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Redis SCAN   │  扫描匹配的 key
  │ DELETE       │  批量清除
  └──────────────┘
         │
         ▼
  下次读操作 → 缓存 MISS → 从 PostgreSQL 重建缓存

示例 — 点赞操作：
  toggle_like API
    → UPDATE moments SET likes = [{新列表}] WHERE id = ?
    → await invalidate_all_feeds()  # SCAN moments:feed:* → DELETE
    → 所有用户下次刷新朋友圈都从 DB 重建
```

### 7.5 缓存一致性保证

| 场景 | 处理方式 |
|------|----------|
| 正常写入 | 先写 DB → 删缓存 → 下次读重建 |
| Redis 宕机 | `_cache_get` catch 异常返回 None → 降级走 DB |
| DB 写成功但 Redis 删失败 | TTL 兜底，最多等 TTL 秒后自动过期 |
| 并发读 | 多个请求同时 miss → 各自查 DB 并同时写缓存（短暂重复但最终一致） |

### 7.6 缓存键设计规范

| 缓存类型 | Key 格式 | 示例 |
|----------|----------|------|
| 用户信息 | `user:{id}` | `user:42` |
| 好友检查 | `friends:check:{min}:{max}` | `friends:check:3:15` |
| 好友列表 | `friends:list:{id}` | `friends:list:42` |
| 待处理申请 | `friends:pending:{id}` | `friends:pending:42` |
| 聊天会话 | `chat:sessions:{id}` | `chat:sessions:42` |
| 聊天历史 | `chat:history:{min}:{max}` | `chat:history:3:15` |
| 朋友圈Feed | `moments:feed:{id}:p{page}:s{size}` | `moments:feed:42:p1:s10` |

### 7.7 各缓存的写入失效触发表

| 操作 | 失效的缓存 |
|------|-----------|
| 用户修改资料 | `user:{id}` |
| 发送/接收好友申请 | `friends:pending:{目标ID}` |
| 通过好友申请 | `friends:list:{双方}` `friends:check:{双方}` `friends:pending:{双方}` `moments:feed:*` |
| 删除好友 | 同上 |
| 发送聊天消息 | `chat:sessions:{双方}` `chat:history:{双方}` |
| 标记消息已读 | `chat:sessions:{当前用户}` |
| 撤回消息 | `chat:sessions:{双方}` `chat:history:{双方}` |
| 发布/删除/点赞/评论动态 | `moments:feed:*`（全部） |

---

## 8. 前端架构

### 8.1 目录结构

```
frontend/
├── electron/
│   ├── main.ts            # Electron 主进程
│   └── preload.ts         # 预加载脚本
├── public/
│   └── default-avatar.png # 默认头像
├── src/
│   ├── main.tsx            # React 入口
│   ├── AppRoot.tsx         # 根组件（Router + GlobalCallNotification）
│   ├── App.tsx             # 应用壳组件
│   ├── index.css           # 全局样式（Tailwind）
│   │
│   ├── api/                # API 层
│   │   ├── request.ts      # Axios 实例（拦截器、baseURL、401处理）
│   │   ├── user.ts         # 用户认证 API
│   │   ├── friend.ts       # 好友 API
│   │   ├── moment.ts       # 朋友圈 API
│   │   └── media.ts        # 文件上传 API
│   │
│   ├── store/              # Zustand 状态管理
│   │   ├── useAuthStore.ts    # 认证状态（persist到localStorage）
│   │   ├── useChatStore.ts    # 聊天状态 + WebSocket连接
│   │   ├── useFriendStore.ts  # 好友状态
│   │   ├── useMomentStore.ts  # 朋友圈状态
│   │   └── useWebRTCStore.ts  # WebRTC通话状态
│   │
│   ├── types/              # TypeScript 类型定义
│   │   ├── user.ts         # User / AuthResponse
│   │   ├── chat.ts         # ChatSession / MessageRecord
│   │   ├── friend.ts       # Friendship
│   │   ├── moment.ts       # MomentResponse
│   │   ├── webrtc.ts       # WebRTCMessage / CallSession
│   │   └── electron.d.ts   # Electron 类型声明
│   │
│   ├── utils/
│   │   └── webrtc.ts       # WebRTCManager 核心类
│   │
│   ├── components/
│   │   ├── chat/           # 聊天相关组件
│   │   ├── friends/        # 好友相关组件
│   │   ├── layout/         # 布局组件（SideRail）
│   │   ├── moment/         # 朋友圈组件
│   │   ├── profile/        # 用户资料组件
│   │   ├── webrtc/         # WebRTC通话组件
│   │   └── icons/          # 图标组件
│   │
│   ├── pages/
│   │   ├── Auth/           # 登录/注册页面
│   │   ├── Message/        # 消息主页
│   │   ├── Moments/        # 朋友圈页面
│   │   └── Profile/        # 用户时光轴页面
│   │
│   └── router/
│       └── index.tsx       # 路由配置（PrivateRoute/PublicRoute守卫）
│
├── .env.production         # 生产环境变量
├── vite.config.ts          # Vite + Electron 插件配置
├── package.json            # NPM 依赖和脚本
├── tsconfig.json           # TypeScript 配置
└── tailwind.config.js      # Tailwind CSS 配置
```

### 8.2 路由设计

| 路径 | 组件 | 守卫 | 说明 |
|------|------|------|------|
| `/` | `Navigate` | - | 重定向到 `/chat` |
| `/login` | `LoginPage` | PublicRoute | 已登录重定向到 `/chat` |
| `/register` | `RegisterPage` | PublicRoute | 已登录重定向到 `/chat` |
| `/chat` | `MessagePage` | PrivateRoute | 主聊天界面 |
| `/profile` | `MessagePage mode="profile"` | PrivateRoute | 个人资料 |
| `/friends` | `MessagePage mode="friends"` | PrivateRoute | 好友管理 |
| `/moments` | `MomentsPage` | PrivateRoute | 朋友圈 |
| `/timeline` | `TimelinePage` | PrivateRoute | 个人时光轴 |
| `*` | 404页面 | - | 未匹配路由 |

### 8.3 状态管理依赖图

```
useAuthStore (认证, 持久化)
    │ 提供 token, user
    │
    ├──→ useChatStore (聊天核心)
    │       │ 持有 WebSocket 连接
    │       │ 消息收发、会话管理
    │       │
    │       └──→ useWebRTCStore (音视频通话)
    │              媒体流管理、信令转发
    │              通过 useChatStore.socket 发送信令
    │
    ├──→ useFriendStore (好友管理)
    │       好友列表、申请列表、添加/接受/删除
    │
    └──→ useMomentStore (朋友圈)
            动态列表、发布/删除/点赞/评论
```

### 8.4 Axios 请求拦截器

```
请求:
  baseURL = VITE_API_URL (环境变量)
  timeout = 5000ms
  拦截器: 自动注入 Authorization: Bearer {token}

响应:
  成功: 直接返回 response.data（跳过 axios 包装层）
  401:  自动调用 useAuthStore.getState().logout()
```

### 8.5 全局组件

**`GlobalCallNotification`**：渲染在 `AppRoot` 中，不依赖任何页面路由。当 `useWebRTCStore.isReceivingCall` 为 `true` 时，在任何页面都会弹出来电通知。

---

## 9. WebRTC 音视频通话

### 9.1 系统架构

```
                      信令通道（WebSocket）
         ┌──────────────────────────────────────────┐
         │  offer / answer / ICE candidates / 挂断   │
         │                                          │
    ┌────▼─────┐                            ┌────▼─────┐
    │  用户 A   │                            │  用户 B   │
    │ (发起方)  │                            │ (接收方)  │
    └────┬─────┘                            └────┬─────┘
         │                                       │
         │       媒体通道（P2P 直连 UDP/TCP）       │
         └───────────────────────────────────────┘
               音视频流直接传输（不经服务器）
```

**STUN 配置**（定义在 `frontend/src/utils/webrtc.ts`）：

```typescript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};
```

### 9.2 信令消息类型

| 类型 | 方向 | 说明 |
|------|------|------|
| `call_request` | A→B | 发起通话请求（含 call_type、session_id） |
| `offer` | A→B | SDP offer（媒体能力描述） |
| `call_accept` | B→A | 接受通话 |
| `answer` | B→A | SDP answer（响应媒体能力） |
| `ice_candidate` | A↔B | ICE 候选地址交换 |
| `call_reject` | B→A | 拒绝通话 |
| `call_end` | A→B / B→A | 挂断通话 |

### 9.3 完整通话时序

```
用户A (发起方)                                         用户B (接收方)
    │                                                      │
    │  1. getUserMedia({audio:true, video:true})           │
    │     ── 获取本地摄像头/麦克风                          │
    │                                                      │
    │  2. new RTCPeerConnection(ICE_SERVERS)               │
    │     addTrack(localStream)                            │
    │                                                      │
    │  3. createOffer() → setLocalDescription              │
    │                                                      │
    │  4. WS → {type:"call_request", session_id,          │
    │            call_type, sender_id, receiver_id}         │
    │  ──────────────────────────────────────────────→     │
    │                                                      │ → handleIncomingCall()
    │                                                      │ → 创建 WebRTCManager
    │  5. WS → {type:"offer", sdp:"v=0\r\n...",           │ → 显示来电通知
    │            call_type, session_id}                    │   (isReceivingCall=true)
    │  ──────────────────────────────────────────────→     │
    │                                                      │ → handleCallAnswer(offer)
    │                                                      │ → setRemoteDescription(offer)
    │                                                      │
    │                                                  用户B 点击"接听"
    │                                                      │
    │                                                      │ → getUserMedia()
    │                                                      │ → new RTCPeerConnection()
    │                                                      │ → addTrack()
    │  ←──────── {type:"call_accept"} ──────────────────── │
    │                                                      │ → createAnswer()
    │                                                      │ → setLocalDescription()
    │  ←──────── {type:"answer", sdp:"v=0\r\n..."} ───────│
    │                                                      │
    │  → setRemoteDescription(answer)                      │
    │                                                      │
    │  7. ICE 候选交换（双向，持续）                         │
    │  ←──────→ {type:"ice_candidate", candidate} ←───→   │
    │     → addIceCandidate()                              │
    │                                                      │
    │  8. P2P 连接建立                                     │
    │     ontrack 事件触发                                  │
    │     remoteStream 可用 → 渲染视频                      │
    │                                                      │
    │  ════════════ 双方实时音视频通话中 ══════════════════  │
    │                                                      │
    │  9. 任一方挂断                                       │
    │     → WS {type:"call_end", session_id}               │
    │     → endCall()                                      │
    │        ├─ localStream.getTracks().forEach(stop)      │
    │        ├─ remoteStream.getTracks().forEach(stop)     │
    │        └─ peerConnection.close()                     │
    │                                                      │
```

### 9.4 WebRTCManager 核心类

定义在 `frontend/src/utils/webrtc.ts`，封装了完整的 WebRTC 生命周期：

| 方法 | 说明 |
|------|------|
| `startCall(callType)` | 调用 `getUserMedia`，管理媒体权限错误 |
| `createPeerConnection()` | 创建 `RTCPeerConnection`，绑定事件回调 |
| `createOffer()` | 创建 SDP offer |
| `createAnswer(offer)` | 创建 SDP answer |
| `setRemoteDescription(desc)` | 设置远端 SDP 描述 |
| `setRemoteAnswer(answer)` | 设置远端 answer |
| `addIceCandidate(candidate)` | 添加 ICE 候选 |
| `endCall()` | 关闭所有媒体轨道和连接 |
| `toggleMute()` | 切换麦克风静音 |
| `toggleVideo()` | 切换摄像头开关 |

### 9.5 媒体权限错误处理

| 错误类型 | 用户提示 |
|----------|----------|
| `NotAllowedError` | "权限被拒绝。请点击地址栏锁图标设置权限" |
| `NotFoundError` | "未找到摄像头或麦克风设备" |
| `NotReadableError` | "设备正被其他应用占用" |
| `OverconstrainedError` | "设备不支持请求的参数" |

---

## 10. API 接口文档

### 10.1 用户模块 `/api/users`

#### POST /register — 用户注册

```
请求:
{
  "username": "zhangsan",       // 3-50字符
  "email": "zhangsan@test.com", // 有效邮箱
  "password": "123456",         // 6-72字符
  "avatar_url": null,           // 可选
  "bio": null,                  // 可选
  "location": null              // 可选
}

响应 201:
{
  "id": 1, "username": "zhangsan", "email": "zhangsan@test.com",
  "avatar_url": null, "bio": null, "location": null,
  "is_active": true, "created_at": "2025-07-17T10:00:00Z"
}

错误:
400 - 该邮箱已被注册
400 - 用户名已被占用
```

#### POST /login — 用户登录

```
请求 (application/x-www-form-urlencoded):
username=zhangsan&password=123456

响应 200:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}

错误:
401 - 用户名或密码错误
```

#### GET /me — 获取当前用户信息

```
请求头: Authorization: Bearer {token}

响应 200:
{
  "id": 1, "username": "zhangsan", "email": "zhangsan@test.com",
  "avatar_url": null, "bio": null, "location": null,
  "is_active": true, "created_at": "2025-07-17T10:00:00Z"
}
```

#### PUT /me — 修改个人信息

```
请求: { "username": "新名称", "bio": "新签名", "location": "北京" }
响应: 更新后的 UserOut 对象

副作用: 失效 Redis user:{id} 缓存
```

### 10.2 聊天模块 `/api/chat`

#### WebSocket — 实时通信

```
连接: wss://host/api/chat/ws/{token}

发送消息格式:
{
  "receiver_id": 2,
  "content": "你好！",
  "msg_type": "text"           // text | image | file
}

接收消息格式:
{
  "id": 100, "sender_id": 2, "receiver_id": 1,
  "content": "你好！", "msg_type": "text",
  "is_recalled": false, "is_read": false,
  "created_at": "2025-07-17 12:00:00"
}

信令消息格式（WebRTC）:
{
  "type": "offer",              // offer | answer | ice_candidate |
  "sender_id": 1,               //   call_request | call_accept |
  "receiver_id": 2,             //   call_reject | call_end
  "sdp": "v=0\r\n...",         // offer/answer类型时存在
  "call_type": "video",        // call_request类型时存在
  "session_id": "abc123xyz"     // 通话唯一标识
}

副作用（发送聊天消息时）:
  失效 chat:sessions:{双方} 和 chat:history:{双方} 缓存
```

#### GET /sessions — 获取会话列表

```
请求: GET /api/chat/sessions
响应:
[
  {
    "peer_id": 2,
    "username": "lisi",
    "avatar_url": null,
    "last_message": "你好！",
    "last_time": "2025-07-17 12:00:00",
    "msg_type": "text",
    "unread_count": 3
  }
]

缓存: chat:sessions:{user_id}, TTL=60秒
```

#### POST /read/{peer_id} — 标记已读

```
POST /api/chat/read/2 → { "status": "success" }
副作用: 失效 chat:sessions:{当前用户} 缓存
```

#### GET /history — 获取历史消息

```
GET /api/chat/history?target_id=2
响应:
[
  {
    "id": 95, "sender_id": 1, "receiver_id": 2,
    "content": "你好！", "msg_type": "text",
    "is_recalled": false, "is_read": true,
    "created_at": "2025-07-17 11:55:00"
  }
  // ...最多50条，按时间正序
]

缓存: chat:history:{min}:{max}, TTL=30秒
```

#### POST /recall/{message_id} — 撤回消息

```
POST /api/chat/recall/100
限制: 仅发送者，2分钟内

副作用: 失效 chat:sessions:{双方} 和 chat:history:{双方} 缓存
```

### 10.3 好友模块 `/api/friends`

#### POST /request/{friend_id} — 发送好友申请

```
POST /api/friends/request/2
约束: 不能加自己，不能重复申请
副作用: 失效 friends:pending:{对方} 缓存
```

#### POST /accept/{requester_id} — 通过好友申请

```
POST /api/friends/accept/2
约束: 必须对方先发申请(status=false)
副作用: 失效 friends:list:{双方}, friends:check:{双方}, friends:pending:{双方}, moments:feed:*
```

#### DELETE /remove/{target_id} — 删除好友/拒绝申请

```
DELETE /api/friends/remove/2
副作用: 同 accept
```

#### GET /list — 获取好友列表

```
GET /api/friends/list
响应:
[
  {
    "id": 10, "user_id": 1, "friend_id": 2,
    "status": true, "created_at": "2025-07-17T10:00:00Z",
    "friend_info": {
      "id": 2, "username": "lisi", "avatar_url": null
    }
  }
]

缓存: friends:list:{id}, TTL=5分钟
优化: 批量查询好友信息（一次 IN 查询替代 N 次循环查询）
```

#### GET /pending — 获取待处理申请

```
GET /api/friends/pending
响应格式同 /list，但只返回 status=false 的申请
缓存: friends:pending:{id}, TTL=5分钟
```

### 10.4 媒体模块 `/api/media`

#### POST /upload — 文件上传

```
请求: multipart/form-data, 字段名 "file"
限制: ≤5MB, 每日≤50张, 仅限 jpg/jpeg/png/gif/webp/pdf/docx/txt
处理: 图片自动压缩为 800×600, PNG→JPEG 优化

响应:
{
  "status": "success",
  "url": "http://host/static/a1b2c3d4.jpg",
  "filename": "a1b2c3d4.jpg",
  "mimetype": "image/jpeg",
  "size": "45.2KB"
}
```

### 10.5 朋友圈模块 `/api/moments`

#### POST /create — 发布动态

```
请求: { "content": "今天天气不错", "images": ["/static/a.jpg"] }
限制: images 最多9张
副作用: 失效 moments:feed:* 全部缓存
```

#### DELETE /{moment_id} — 删除动态

```
DELETE /api/moments/55
限制: 只能删除自己的
副作用: 失效 moments:feed:* 全部缓存
```

#### GET /feed — 获取朋友圈 Feed

```
GET /api/moments/feed?page=1&size=10
响应:
[
  {
    "id": 55, "user_id": 3, "username": "张三",
    "avatar": null, "content": "今天天气不错",
    "images": ["/static/a.jpg"],
    "likes": [{"user_id":1, "username":"zhangsan", "avatar":null}],
    "comments": [{"user_id":2, "username":"lisi", "content":"顶！", "created_at":"..."}],
    "created_at": "2025-07-17T10:00:00Z"
  }
]

逻辑: 只展示好友+自己的动态，按时间倒序
缓存: moments:feed:{user_id}:p{page}:s{size}, TTL=24小时
```

#### POST /{moment_id}/like — 点赞/取消点赞

```
POST /api/moments/55/like
逻辑: 已点赞则取消，未点赞则添加（Toggle模式）
副作用: 失效 moments:feed:* 全部缓存

响应:
{
  "status": "success",
  "is_liked": true,
  "latest_likes": [{"user_id":1,"username":"zhangsan"}, ...]
}
```

#### POST /{moment_id}/comment — 评论

```
请求: { "content": "说得太好了！" }
逻辑: 追加到 comments JSONB 数组（使用 PostgreSQL concat 原子操作）
副作用: 失效 moments:feed:* 全部缓存

响应:
{
  "status": "success",
  "comment": {
    "cid": "a1b2c3d4",
    "user_id": 2, "username": "lisi", "avatar": null,
    "content": "说得太好了！", "created_at": "2025-07-17 12:00:00"
  }
}
```

---

## 11. 部署运维

### 11.1 环境要求

| 组件 | 最低版本 | 说明 |
|------|----------|------|
| Python | 3.11+ | 后端运行环境 |
| Node.js | 18+ | 前端构建 |
| PostgreSQL | 15+ | 主数据库 |
| Redis | 7+ | 缓存服务 |
| Nginx | 1.24+ | 反向代理 |
| 域名 | - | SSL证书必需 |

### 11.2 环境变量

**后端** (`backend/.env.development`)：

```
DATABASE_URL=postgresql+asyncpg://postgres:root@localhost:5432/zchat
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

**前端** (`frontend/.env.production`)：

```
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
```

### 11.3 Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 前端静态文件
    location / {
        root /var/www/zchat;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理（关键！需要升级连接）
    location /api/chat/ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件
    location /static/ {
        alias /path/to/uploads/;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

### 11.4 部署流程

```bash
# 1. 后端部署
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. 前端构建
cd frontend
npm install
npm run build     # 输出到 dist/

# 3. 上传到服务器
scp -r dist/* user@server:/var/www/zchat/

# 4. 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 5. 启动服务（使用 systemd 或 supervisor）
```

### 11.5 构建脚本

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "electron:build": "tsc -b && vite build && electron-builder",
  "build:win": "npm run build && electron-builder --win",
  "build:mac": "npm run build && electron-builder --mac",
  "build:linux": "npm run build && electron-builder --linux"
}
```

### 11.6 HTTPS 要求

WebRTC 的 `getUserMedia()` API **强制要求 HTTPS**（localhost 除外）。部署时必须：

1. 使用 Let's Encrypt 或商业 SSL 证书
2. Nginx 使用 `wss://` 协议代理 WebSocket
3. 前端 `.env.production` 中 `VITE_WS_URL` 使用 `wss://` 前缀

---

## 12. 目录结构

```
Zchat/
├── backend/                          # Python FastAPI 后端
│   ├── app/
│   │   ├── api/
│   │   │   ├── api.py                # 路由聚合器
│   │   │   └── endpoints/
│   │   │       ├── user.py           # 用户认证与资料管理
│   │   │       ├── chat.py           # WebSocket + 聊天消息
│   │   │       ├── friendship.py     # 好友关系管理
│   │   │       ├── file.py           # 文件上传与图片压缩
│   │   │       └── moment.py         # 朋友圈动态
│   │   ├── core/
│   │   │   ├── config.py             # 环境变量配置
│   │   │   ├── security.py           # JWT + bcrypt
│   │   │   ├── redis_client.py       # Redis 连接池
│   │   │   └── cache.py              # 6组缓存策略
│   │   ├── db/
│   │   │   └── session.py            # SQLAlchemy 异步引擎配置
│   │   ├── models/
│   │   │   ├── user.py               # User ORM 模型
│   │   │   ├── chat.py               # Message ORM 模型
│   │   │   ├── friendship.py         # Friendship ORM 模型
│   │   │   └── moment.py             # Moment ORM 模型
│   │   ├── schemas/
│   │   │   ├── user.py               # Pydantic 请求/响应模型
│   │   │   ├── chat.py               # ChatSessionOut
│   │   │   ├── friendship.py         # FriendshipDetailOut
│   │   │   └── moment.py             # MomentResponse
│   │   └── main.py                   # FastAPI 应用入口
│   ├── .env.development              # 开发环境变量
│   ├── requirements.txt              # Python 依赖
│   └── pyrightconfig.json            # 类型检查配置
│
├── frontend/                         # React + TypeScript 前端
│   ├── electron/
│   │   ├── main.ts                   # Electron 主进程
│   │   └── preload.ts                # 预加载脚本
│   ├── src/
│   │   ├── api/                      # HTTP API 调用层
│   │   ├── store/                    # Zustand 状态管理
│   │   ├── types/                    # TypeScript 类型定义
│   │   ├── utils/                    # 工具函数（WebRTC Manager）
│   │   ├── components/               # UI 组件
│   │   ├── pages/                    # 页面组件
│   │   ├── router/                   # 路由配置
│   │   ├── AppRoot.tsx               # 根组件
│   │   └── main.tsx                  # 入口文件
│   ├── vite.config.ts                # Vite + Electron 插件配置
│   ├── package.json                  # NPM 依赖与脚本
│   ├── tsconfig.json                 # TypeScript 配置
│   └── tailwind.config.js            # Tailwind CSS 配置
│
└── detailed_documention.md           # 本文档
```
