/**
 * 对应后端 ChatSessionOut Schema
 */
export interface ChatSession {
  peer_id: number;
  username: string;
  avatar_url: string | null;
  last_message: string;
  last_time: string;
  msg_type: 'text' | 'image' | 'file'; // 根据后端支持的类型扩展
  unread_count: number;
}

/**
 * 对应后端 WebSocket 推送的消息格式
 */
export interface WsMessagePayload {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  msg_type: string;
  is_recalled: boolean;
  is_read: boolean;
  created_at: string;
}

/**
 * 前端使用的消息对象（用于历史记录展示）
 */
export interface MessageRecord {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  msg_type: string;
  is_recalled: boolean;
  is_read: boolean;
  created_at: string;
}