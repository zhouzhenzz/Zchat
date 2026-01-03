import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';
import type { ChatSession, MessageRecord } from '@/types/chat';

interface ChatState {
  sessions: ChatSession[];
  messages: MessageRecord[];
  loading: boolean;
  historyLoading: boolean; // 新增历史记录加载状态
  activePeerId: number | null;
  socket: WebSocket | null;
  retryCount: number;

  initWebSocket: (token: string) => void;
  sendMessage: (receiverId: number, content: string, msgType?: string) => void;
  fetchSessions: () => Promise<void>;
  fetchHistory: (peerId: number) => Promise<void>;
  setActivePeer: (peerId: number | null) => void;
  markAsRead: (peerId: number) => void;
}

// 优先使用环境变量，否则回退到本地
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  messages: [],
  loading: false,
  historyLoading: false,
  activePeerId: null,
  socket: null,
  retryCount: 0,

  setActivePeer: (peerId) => set({ activePeerId: peerId }),

  initWebSocket: (token) => {
    // 防止重复连接
    if (get().socket?.readyState === WebSocket.OPEN) return;
    if (!token) return;

    const wsUrl = `${WS_BASE_URL}/api/chat/ws/${token}`;
    console.log(`正在连接 WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ WebSocket 连接成功");
      set({ socket: ws, retryCount: 0 });
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        // 1. 处理错误回执 (如：非好友关系)
        if (payload.status === 'error') {
          console.error("发送失败:", payload.message);
          alert(payload.message); // 简单提示用户
          return;
        }

        // 2. 解包消息 (发送者收到 {status: "delivered", data: msg}, 接收者收到 msg)
        const msg = payload.data || payload;

        if (msg.sender_id) {
          const { activePeerId, messages } = get();
          
          // 如果消息属于当前打开的窗口，加入消息列表
          if (msg.sender_id === activePeerId || msg.receiver_id === activePeerId) {
            set({ messages: [...messages, msg] });
          }
          
          // 收到新消息时，刷新侧边栏 (更新最后一条消息和红点)
          get().fetchSessions();
        }
      } catch (e) {
        console.error("WS 消息解析失败", e);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket 发生错误", err);
    };

    ws.onclose = () => {
      set({ socket: null });
      // 自动重连机制 (指数退避)
      const delay = Math.min(1000 * Math.pow(2, get().retryCount), 10000);
      console.warn(`WebSocket 断开，${delay}ms 后尝试重连...`);
      
      setTimeout(() => {
        const currentToken = useAuthStore.getState().token;
        if (currentToken) {
          set({ retryCount: get().retryCount + 1 });
          get().initWebSocket(currentToken);
        }
      }, delay);
    };
  },

  sendMessage: (receiverId, content, msgType = "text") => {
    const ws = get().socket;
    
    // ⚠️ 核心修复：字段名必须严格匹配后端 chat.py 第 65 行
    const payload = {
      receiver_id: receiverId, // 必须是 snake_case
      content: content,
      msg_type: msgType
    };

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      console.error("发送失败：WebSocket 未连接");
      alert("网络连接已断开，请刷新页面");
    }
  },

  fetchSessions: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ loading: true });
    try {
      const res = await axios.get(`${API_BASE_URL}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ sessions: res.data, loading: false });
    } catch (err) {
      console.error("获取会话列表失败", err);
      set({ loading: false });
    }
  },

  fetchHistory: async (peerId: number) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ historyLoading: true });
    try {
      const res = await axios.get(`${API_BASE_URL}/api/chat/history`, {
        params: { target_id: peerId },
        headers: { Authorization: `Bearer ${token}` }
      });
      // 后端返回的是按时间倒序 (最新在前)，前端通常需要正序渲染或保持原样取决于 UI
      // 这里保持后端返回的顺序，ChatWindow 负责处理
      set({ messages: res.data, historyLoading: false });
    } catch (err) {
      console.error("获取历史记录失败", err);
      set({ historyLoading: false });
    }
  },

  markAsRead: async (peerId: number) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      await axios.post(`${API_BASE_URL}/api/chat/read/${peerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // 标记已读后，本地更新一下 session 状态，让红点消失
      const { sessions } = get();
      const updatedSessions = sessions.map(s => 
        s.peer_id === peerId ? { ...s, unread_count: 0 } : s
      );
      set({ sessions: updatedSessions });
    } catch (err) {
      console.error("标记已读失败", err);
    }
  }
}));