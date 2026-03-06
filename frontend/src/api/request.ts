import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 5000,
});

// 请求拦截器
request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：合并处理
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 核心：这里直接返回后端数据 data
    // 这样你在调用 loginApi 时得到的直接是 { access_token: "..." }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 认证已失效，请重新登录
      useAuthStore.getState().logout();
      // 这里的跳转交给路由守卫自动触发，或者在此处 window.location.href = '/login'
    }
    return Promise.reject(error);
  }
);

export default request;