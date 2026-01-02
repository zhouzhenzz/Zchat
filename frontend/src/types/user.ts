// 对应后端的 UserOut 模型
export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
}

// 对应后端的 Token 模型
export interface AuthResponse {
  access_token: string;
  token_type: string;
}