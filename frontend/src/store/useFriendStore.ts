import { create } from 'zustand';
import * as friendApi from '@/api/friend'; // 导入刚才写的 api
import type { Friendship } from '@/types/friend';

interface FriendState {
  friends: Friendship[];
  pendingRequests: Friendship[];
  loading: boolean;
  
  // 统一命名为 fetchFriends 和 fetchPending，方便组件调用
  fetchFriends: () => Promise<void>;
  fetchPending: () => Promise<void>;
  sendRequest: (id: number) => Promise<void>;
  acceptRequest: (id: number) => Promise<void>;
  removeFriend: (id: number) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  loading: false,

  fetchFriends: async () => {
    set({ loading: true });
    try {
      const data = await friendApi.getFriendsListApi();
      set({ friends: data });
    } finally {
      set({ loading: false });
    }
  },

  fetchPending: async () => {
    try {
      const data = await friendApi.getPendingRequestsApi();
      set({ pendingRequests: data });
    } catch (error) {
      console.error("获取申请失败", error);
    }
  },

  sendRequest: async (id) => {
    await friendApi.sendFriendRequestApi(id);
    // 可选：发送后逻辑
  },

  acceptRequest: async (id) => {
    await friendApi.acceptFriendRequestApi(id);
    // 同意后刷新数据
    get().fetchFriends();
    get().fetchPending();
  },

  removeFriend: async (id) => {
    await friendApi.removeFriendshipApi(id);
    get().fetchFriends();
    get().fetchPending();
  }
}));

