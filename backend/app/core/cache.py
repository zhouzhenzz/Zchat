import json
from typing import Any, Optional
from app.core.redis_client import get_redis

# ============================================================
# TTL 常量
# ============================================================
FEED_CACHE_TTL = 86400
USER_CACHE_TTL = 1800
CHAT_SESSIONS_TTL = 60
CHAT_HISTORY_TTL = 30
FRIEND_LIST_TTL = 300
FRIEND_CHECK_TTL = 300

# ============================================================
# 通用序列化
# ============================================================
def _serialize(value: Any) -> str:
    return json.dumps(value, default=str, ensure_ascii=False)


def _deserialize(raw: str) -> Any:
    return json.loads(raw)


async def _cache_get(key: str) -> Optional[Any]:
    redis = await get_redis()
    try:
        data = await redis.get(key)
        if data is not None:
            return _deserialize(data)
    except Exception:
        pass
    return None


async def _cache_set(key: str, value: Any, ttl: int) -> None:
    redis = await get_redis()
    try:
        await redis.setex(key, ttl, _serialize(value))
    except Exception:
        pass


async def _cache_delete(*keys: str) -> None:
    redis = await get_redis()
    try:
        await redis.delete(*keys)
    except Exception:
        pass


async def _cache_delete_pattern(pattern: str) -> int:
    redis = await get_redis()
    deleted = 0
    try:
        cursor = 0
        while True:
            cursor, keys = await redis.scan(cursor, match=pattern, count=500)
            if keys:
                deleted += len(keys)
                await redis.delete(*keys)
            if cursor == 0:
                break
    except Exception:
        pass
    return deleted


# ============================================================
# 朋友圈 Feed 缓存（存量）
# ============================================================
FEED_CACHE_PREFIX = "moments:feed"

async def get_feed_cache(user_id: int, page: int, size: int) -> Optional[list]:
    return await _cache_get(_feed_key(user_id, page, size))

async def set_feed_cache(user_id: int, page: int, size: int, data: list) -> None:
    await _cache_set(_feed_key(user_id, page, size), data, FEED_CACHE_TTL)

async def invalidate_all_feeds() -> int:
    return await _cache_delete_pattern(f"{FEED_CACHE_PREFIX}:*")

def _feed_key(user_id: int, page: int, size: int) -> str:
    return f"{FEED_CACHE_PREFIX}:{user_id}:p{page}:s{size}"


# ============================================================
# 用户信息缓存 — user:{user_id}
# 命中: get_current_user（每次请求）, /friends/list 循环查询
# 失效: PUT /users/me
# TTL:  30分钟
# ============================================================
USER_CACHE_PREFIX = "user"

async def get_user_cache(user_id: int) -> Optional[dict]:
    return await _cache_get(f"{USER_CACHE_PREFIX}:{user_id}")

async def set_user_cache(user_id: int, data: dict) -> None:
    await _cache_set(f"{USER_CACHE_PREFIX}:{user_id}", data, USER_CACHE_TTL)

async def invalidate_user_cache(user_id: int) -> None:
    await _cache_delete(f"{USER_CACHE_PREFIX}:{user_id}")


# ============================================================
# 好友关系检查缓存 — friends:check:{min_id}:{max_id}
# 命中: WebSocket 每条消息/信令都调 check_is_friend
# 失效: /friends/accept, /friends/remove
# TTL:  5分钟
# ============================================================
FRIEND_CHECK_PREFIX = "friends:check"

def _friend_check_key(user_a: int, user_b: int) -> str:
    lo, hi = (user_a, user_b) if user_a < user_b else (user_b, user_a)
    return f"{FRIEND_CHECK_PREFIX}:{lo}:{hi}"

async def get_friend_check_cache(user_a: int, user_b: int) -> Optional[bool]:
    val = await _cache_get(_friend_check_key(user_a, user_b))
    if val is not None:
        return bool(val)
    return None

async def set_friend_check_cache(user_a: int, user_b: int, is_friend: bool) -> None:
    await _cache_set(_friend_check_key(user_a, user_b), 1 if is_friend else 0, FRIEND_CHECK_TTL)

async def invalidate_friend_check_cache(user_a: int, user_b: int) -> None:
    await _cache_delete(_friend_check_key(user_a, user_b))


# ============================================================
# 好友列表缓存 — friends:list:{user_id}
# 命中: /friends/list, /friends/pending
# 失效: /friends/accept, /friends/remove, /friends/request
# TTL:  5分钟
# ============================================================
FRIEND_LIST_PREFIX = "friends:list"
FRIEND_PENDING_PREFIX = "friends:pending"

async def get_friend_list_cache(user_id: int) -> Optional[list]:
    return await _cache_get(f"{FRIEND_LIST_PREFIX}:{user_id}")

async def set_friend_list_cache(user_id: int, data: list) -> None:
    await _cache_set(f"{FRIEND_LIST_PREFIX}:{user_id}", data, FRIEND_LIST_TTL)

async def invalidate_friend_list_cache(user_id: int) -> None:
    await _cache_delete(f"{FRIEND_LIST_PREFIX}:{user_id}")
    await _cache_delete(f"{FRIEND_PENDING_PREFIX}:{user_id}")

async def get_friend_pending_cache(user_id: int) -> Optional[list]:
    return await _cache_get(f"{FRIEND_PENDING_PREFIX}:{user_id}")

async def set_friend_pending_cache(user_id: int, data: list) -> None:
    await _cache_set(f"{FRIEND_PENDING_PREFIX}:{user_id}", data, FRIEND_LIST_TTL)


# ============================================================
# 聊天会话列表缓存 — chat:sessions:{user_id}
# 命中: GET /chat/sessions（每次打开侧边栏、每收到新消息都刷新）
# 失效: 新消息送达, /chat/read/{peer_id}
# TTL:  60秒（短TTL，因为未读数变化频繁）
# ============================================================
CHAT_SESSIONS_PREFIX = "chat:sessions"

async def get_chat_sessions_cache(user_id: int) -> Optional[list]:
    return await _cache_get(f"{CHAT_SESSIONS_PREFIX}:{user_id}")

async def set_chat_sessions_cache(user_id: int, data: list) -> None:
    await _cache_set(f"{CHAT_SESSIONS_PREFIX}:{user_id}", data, CHAT_SESSIONS_TTL)

async def invalidate_chat_sessions_cache(user_id: int) -> None:
    await _cache_delete(f"{CHAT_SESSIONS_PREFIX}:{user_id}")


# ============================================================
# 聊天历史缓存 — chat:history:{min_id}:{max_id}
# 命中: GET /chat/history?target_id=X
# 失效: 新消息发送, /chat/recall/{id}
# TTL:  30秒（短TTL，实时聊天场景）
# ============================================================
CHAT_HISTORY_PREFIX = "chat:history"

def _chat_history_key(user_a: int, user_b: int) -> str:
    lo, hi = (user_a, user_b) if user_a < user_b else (user_b, user_a)
    return f"{CHAT_HISTORY_PREFIX}:{lo}:{hi}"

async def get_chat_history_cache(user_a: int, user_b: int) -> Optional[list]:
    return await _cache_get(_chat_history_key(user_a, user_b))

async def set_chat_history_cache(user_a: int, user_b: int, data: list) -> None:
    await _cache_set(_chat_history_key(user_a, user_b), data, CHAT_HISTORY_TTL)

async def invalidate_chat_history_cache(user_a: int, user_b: int) -> None:
    await _cache_delete(_chat_history_key(user_a, user_b))
