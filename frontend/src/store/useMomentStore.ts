import { create } from 'zustand';
import * as momentApi from '@/api/moment';
import type { MomentResponse, MomentCreateData } from '@/types/moment';

interface MomentState {
  // 状态
  moments: MomentResponse[];
  loading: boolean;
  posting: boolean;
  error: string | null;
  hasMore: boolean;
  
  // 操作
  fetchMoments: (page?: number, size?: number) => Promise<void>;
  createMoment: (data: MomentCreateData) => Promise<void>;
  deleteMoment: (momentId: number) => Promise<void>;
  toggleLike: (momentId: number) => Promise<void>;
  addComment: (momentId: number, content: string) => Promise<void>;
  resetError: () => void;
}

export const useMomentStore = create<MomentState>((set, get) => ({
  // 初始状态
  moments: [],
  loading: false,
  posting: false,
  error: null,
  hasMore: true,

  // 获取朋友圈Feed
  fetchMoments: async (page = 1, size = 10) => {
    const currentState = get();
    if (currentState.loading || (!currentState.hasMore && page > 1)) {
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const data = await momentApi.getMomentsFeedApi(page, size);
      
      if (page === 1) {
        // 第一页，替换数据
        set({ 
          moments: data, 
          loading: false, 
          hasMore: data.length === size
        });
      } else {
        // 分页加载，追加数据
        set({ 
          moments: [...currentState.moments, ...data], 
          loading: false, 
          hasMore: data.length === size
        });
      }
    } catch (err) {
      set({ error: '获取朋友圈失败', loading: false });
      console.error('Failed to fetch moments:', err);
    }
  },

  // 创建动态
  createMoment: async (data: MomentCreateData) => {
    set({ posting: true, error: null });
    try {
      await momentApi.createMomentApi(data);
      set({ posting: false, hasMore: true });
      // 重新获取列表
      get().fetchMoments();
    } catch (err) {
      set({ error: '发布动态失败', posting: false });
      console.error('Failed to create moment:', err);
    }
  },

  // 删除动态
  deleteMoment: async (momentId: number) => {
    set({ loading: true, error: null });
    try {
      await momentApi.deleteMomentApi(momentId);
      // 从列表中移除
      set((state) => ({
        moments: state.moments.filter(m => m.id !== momentId),
        loading: false
      }));
    } catch (err) {
      set({ error: '删除动态失败', loading: false });
      console.error('Failed to delete moment:', err);
    }
  },

  // 点赞/取消点赞
  toggleLike: async (momentId: number) => {
    try {
      const result = await momentApi.toggleLikeApi(momentId);
      // 更新本地状态
      set((state) => ({
        moments: state.moments.map(m => {
          if (m.id === momentId) {
            return {
              ...m,
              likes: result.latest_likes
            };
          }
          return m;
        })
      }));
    } catch (err) {
      set({ error: '操作失败' });
      console.error('Failed to toggle like:', err);
    }
  },

  // 添加评论
  addComment: async (momentId: number, content: string) => {
    try {
      const result = await momentApi.addCommentApi(momentId, content);
      // 更新本地状态
      set((state) => ({
        moments: state.moments.map(m => {
          if (m.id === momentId) {
            return {
              ...m,
              comments: [...(m.comments || []), result.comment]
            };
          }
          return m;
        })
      }));
    } catch (err) {
      set({ error: '评论失败' });
      console.error('Failed to add comment:', err);
    }
  },

  // 重置错误
  resetError: () => set({ error: null }),
}));
