import request from './request';
// 使用仅类型导入
import type { User, AuthResponse } from '@/types/user';

/**
 * 注意：由于拦截器返回了 response.data，
 * 这里的 Promise 类型要直接定义为业务模型
 */
export const registerApi = (data: any) => {
  return request.post<User>('/api/users/register', data);
};

export const loginApi = (data: FormData) => {
  return request.post<AuthResponse>('/api/users/login', data);
};

export const getMeApi = () => {
  return request.get<User>('/api/users/me');
};

export const updateMeApi = (data: Partial<User>) => {
  return request.put<User>('/api/users/me', data) as Promise<User>;
};