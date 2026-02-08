import request from './request';
import type { MomentResponse } from '@/types/moment.ts';

interface MomentCreateData {
  content: string;
  images: string[];
}

/**
 * 1. 创建动态
 * POST /api/moments/create
 */
export const createMomentApi = (data: MomentCreateData) => {
  return request.post('/api/moments/create', data);
};

/**
 * 2. 删除动态
 * DELETE /api/moment/{moment_id}
 */
export const deleteMomentApi = (momentId: number) => {
  return request.delete(`/api/moments/${momentId}`);
};

/**
 * 3. 获取朋友圈Feed
 * GET /api/moment/feed
 */
export const getMomentsFeedApi = (page: number = 1, size: number = 10) => {
  return request.get<MomentResponse[]>(`/api/moments/feed`, {
    params: { page, size }
  });
};

/**
 * 4. 点赞/取消点赞
 * POST /api/moment/{moment_id}/like
 */
export const toggleLikeApi = (momentId: number) => {
  return request.post(`/api/moments/${momentId}/like`);
};

/**
 * 5. 评论动态
 * POST /api/moment/{moment_id}/comment
 */
export const addCommentApi = (momentId: number, content: string) => {
  return request.post(`/api/moments/${momentId}/comment`, { content });
};
