import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user'; // 使用仅类型导入
import { useChatStore } from './useChatStore';

interface AuthState {
  token: string | null;
  user: User | null; // 这里使用你定义的 User 类型，而不是 {name, id}
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        set({ token: null, user: null });
        // 清空聊天数据
        useChatStore.getState().reset();
      },
    }),
    { name: 'auth-storage' }
  )
);