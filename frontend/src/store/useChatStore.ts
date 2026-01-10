// @/store/useChatStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';
import type { ChatSession, MessageRecord } from '@/types/chat';

interface ChatState {
  sessions: ChatSession[];
  messages: MessageRecord[];
  loading: boolean;
  historyLoading: boolean;
  activePeerId: number | null;
  socket: WebSocket | null;
  retryCount: number;
  setActivePeer: (peerId: number | null) => void;
  initWebSocket: (token: string) => void;
  sendMessage: (receiverId: number, content: string, msgType?: string) => void;
  fetchSessions: () => Promise<void>;
  fetchHistory: (peerId: number) => Promise<void>;
  markAsRead: (peerId: number) => void;
  reset: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';

export const useChatStore = create<ChatState>((set, get) => ({


  reset: () => {
    const socket = get().socket;
    if (socket) {
      socket.close(); // 断开当前 WS 连接
    }
    set({
      sessions: [],
      messages: [],
      activePeerId: null,
      socket: null,
      retryCount: 0,
      loading: false,
      historyLoading: false
    });
  },
  
  sessions: [],
  messages: [],
  loading: false,
  historyLoading: false,
  activePeerId: null,
  socket: null,
  retryCount: 0,

  // 增强版：设置当前聊天对象并自动触发数据获取
  setActivePeer: (peerId) => {
    set({ activePeerId: peerId });
    if (peerId) {
      // 这里的 get() 可以确保在设置 ID 后立即触发动作
      get().fetchHistory(peerId);
      get().markAsRead(peerId);
      get().fetchSessions(); // 刷新侧边栏红点
    }
  },

  initWebSocket: (token) => {
    if (get().socket?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_BASE_URL}/api/chat/ws/${token}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const msg = payload.data || payload;
        if (msg.sender_id) {
          const { activePeerId, messages } = get();
          // 如果是当前正在对话的用户，推入消息流
          if (msg.sender_id === activePeerId || msg.receiver_id === activePeerId) {
            set({ messages: [...messages, msg] });
          }
          // 只要有新消息，就刷新侧边栏（更新最后一条消息内容和未读数）
          get().fetchSessions();
        }
      } catch (e) { console.error("WS解析失败", e); }
    };
    
    ws.onopen = () => set({ socket: ws, retryCount: 0 });
    ws.onclose = () => {
        set({ socket: null });
        setTimeout(() => {
            const currentToken = useAuthStore.getState().token;
            if (currentToken) get().initWebSocket(currentToken);
        }, 3000);
    };
  },

  sendMessage: (receiverId, content, msgType = "text") => {
    const ws = get().socket;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ receiver_id: receiverId, content, msg_type: msgType }));
    }
  },

  fetchSessions: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const res = await axios.get(`${API_BASE_URL}/api/chat/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    set({ sessions: res.data });
  },

  fetchHistory: async (peerId: number) => {
    const token = useAuthStore.getState().token;
    set({ historyLoading: true });
    try {
      const res = await axios.get(`${API_BASE_URL}/api/chat/history`, {
        params: { target_id: peerId },
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ messages: res.data, historyLoading: false });
    } catch { set({ historyLoading: false }); }
  },

  markAsRead: async (peerId: number) => {
    const token = useAuthStore.getState().token;
    await axios.post(`${API_BASE_URL}/api/chat/read/${peerId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}));