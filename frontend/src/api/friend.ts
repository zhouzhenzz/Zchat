import request from './request';
import type { Friendship } from '@/types/friend';

/**
 * 1. 发送好友申请
 * POST /api/friends/request/{friend_id}
 */
export const sendFriendRequestApi = (friendId: number) => {
  return request.post<Friendship>(`/api/friends/request/${friendId}`);
};

/**
 * 2. 通过好友申请
 * POST /api/friends/accept/{requester_id}
 */
export const acceptFriendRequestApi = (requesterId: number) => {
  return request.post<Friendship>(`/api/friends/accept/${requesterId}`);
};

/**
 * 3. 拒绝申请或删除好友
 * DELETE /api/friends/remove/{target_id}
 */
export const removeFriendshipApi = (targetId: number) => {
  return request.delete<{ status: string; message: string }>(`/api/friends/remove/${targetId}`);
};

/**
 * 4. 获取已通过的好友列表
 * GET /api/friends/list
 */
export const getFriendsListApi = () => {
  return request.get<Friendship[]>('/api/friends/list');
};

/**
 * 5. 获取收到的待处理申请
 * GET /api/friends/pending
 */
export const getPendingRequestsApi = () => {
  return request.get<Friendship[]>('/api/friends/pending');
};