// @/store/useChatStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';
import { useWebRTCStore } from './useWebRTCStore';
import type { ChatSession, MessageRecord } from '@/types/chat';
import type { WebRTCMessage } from '@/types/webrtc';

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
  sendMessage: (receiverId: number, content: string, msgType?: string) => Promise<boolean>;
  sendWebRTCSignal: (message: WebRTCMessage) => void;
  fetchSessions: () => Promise<void>;
  sendMessageViaHttp: (receiverId: number, content: string, msgType?: string) => Promise<boolean>;
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
    set({ activePeerId: peerId, messages: [] });
    if (peerId) {
      // 这里的 get() 可以确保在设置 ID 后立即触发动作
      get().fetchHistory(peerId);
      get().markAsRead(peerId);
      get().fetchSessions(); // 刷新侧边栏红点
    }
  },

  initWebSocket: (token) => {
    const currentSocket = get().socket;
    // 检查是否已经存在有效的连接
    if (currentSocket?.readyState === WebSocket.OPEN) return;
    
    // 关闭可能存在的其他连接
    if (currentSocket) {
      currentSocket.close();
    }
    
    const ws = new WebSocket(`${WS_BASE_URL}/api/chat/ws/${token}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        // 检查是否为 WebRTC 信令消息
        if (payload.type) {
          const webrtcMessage = payload as WebRTCMessage;
          
          // 处理 WebRTC 信令
          switch (webrtcMessage.type) {
            case 'call_request':
              useWebRTCStore.getState().handleIncomingCall(webrtcMessage);
              break;
            case 'offer':
              useWebRTCStore.getState().handleCallAnswer(webrtcMessage);
              break;
            case 'answer':
              useWebRTCStore.getState().handleCallAnswer(webrtcMessage);
              break;
            case 'ice_candidate':
              useWebRTCStore.getState().handleIceCandidate(webrtcMessage);
              break;
            case 'call_accept':
              useWebRTCStore.getState().handleCallAnswer(webrtcMessage);
              break;
            case 'call_reject':
              useWebRTCStore.getState().endCall();
              break;
            case 'call_end':
              useWebRTCStore.getState().endCall();
              break;
          }
        } else {
          // 普通聊天消息
          const msg = payload.data || payload;
          if (msg.sender_id) {
            const { activePeerId, messages } = get();
            // 检查消息是否已经存在
            const messageExists = messages.some(m => m.id === msg.id);
            if (!messageExists) {
              // 如果是当前正在对话的用户，推入消息流
              if (msg.sender_id === activePeerId || msg.receiver_id === activePeerId) {
                set({ messages: [...messages, msg] });
              }
              // 只要有新消息，就刷新侧边栏（更新最后一条消息内容和未读数）
              get().fetchSessions().catch(err => console.error('刷新会话失败:', err));
            }
          }
        }
      } catch (e) {
        console.error("WS解析失败", e);
      }
    };
    
    ws.onopen = () => {
      console.log('WebSocket连接已打开');
      set({ socket: ws, retryCount: 0 });
    };
    
    ws.onclose = () => {
      console.log('WebSocket连接已关闭');
      set({ socket: null });
      
      const currentRetryCount = get().retryCount;
      // 限制重连次数
      if (currentRetryCount < 5) {
        setTimeout(() => {
          const currentToken = useAuthStore.getState().token;
          if (currentToken) {
            set({ retryCount: currentRetryCount + 1 });
            get().initWebSocket(currentToken);
          }
        }, 3000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
  },

  sendMessage: async (receiverId, content, msgType = "text") => {
    const ws = get().socket;
    const token = useAuthStore.getState().token;
    
    if (ws?.readyState === WebSocket.OPEN) {
      try {
        const messageData = {
          receiver_id: receiverId,
          content,
          msg_type: msgType
        };
        ws.send(JSON.stringify(messageData));
        return true;
      } catch (error) {
        console.error('WebSocket发送消息失败:', error);
        // 降级到HTTP请求
        if (token) {
          return get().sendMessageViaHttp(receiverId, content, msgType);
        }
        return false;
      }
    } else {
      // WebSocket不可用时，使用HTTP请求
      if (token) {
        return get().sendMessageViaHttp(receiverId, content, msgType);
      }
      return false;
    }
  },
  
  sendWebRTCSignal: (message: WebRTCMessage) => {
    const ws = get().socket;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  },

  // 添加HTTP发送消息的方法作为降级方案
  sendMessageViaHttp: async (receiverId, content, msgType = "text") => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return false;
      
      const response = await axios.post(`${API_BASE_URL}/api/chat/send`, {
        receiver_id: receiverId,
        content,
        msg_type: msgType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 手动添加消息到本地
      const newMessage = response.data;
      const { messages, activePeerId } = get();
      if (newMessage.sender_id === activePeerId || newMessage.receiver_id === activePeerId) {
        set({ messages: [...messages, newMessage] });
      }
      // 刷新会话列表
      get().fetchSessions().catch(err => console.error('刷新会话失败:', err));
      return true;
    } catch (error) {
      console.error('HTTP发送消息失败:', error);
      return false;
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
    } catch (error) {
      console.error('获取会话列表失败:', error);
      set({ loading: false });
    }
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
    if (!token) return;
    
    try {
      await axios.post(`${API_BASE_URL}/api/chat/read/${peerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }
}));
