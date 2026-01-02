import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, getMeApi } from '@/api/user';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setLoading(true);
    try {
      // 1. 调用登录获取 Token
      const authRes = await loginApi(formData);
      const token = authRes.access_token;

      /**
       * 2. 关键：立即在 Store 中设置临时 Token
       * 这样接下来的 getMeApi 请求拦截器才能正确读取并注入 Authorization 头
       */
      useAuthStore.getState().setAuth(token, null as any);

      // 3. 立即调用获取个人信息接口
      const userProfile = await getMeApi();
      
      // 4. 持久化完整的用户状态并跳转
      setAuth(token, userProfile);
      navigate('/chat');
      
    } catch (err: any) {
      alert(err.response?.data?.detail || '登录验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
      {/* 依照 HTML 模板风格构建的表单 */}
      <form onSubmit={handleLogin} className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold mb-8 text-center tracking-tight">登入 Zchat</h2>
        <div className="space-y-5">
          <input 
            name="username" 
            type="text" 
            placeholder="用户名" 
            required 
            className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all" 
          />
          <input 
            name="password" 
            type="password" 
            placeholder="密码" 
            required 
            className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all" 
          />
          <button 
            disabled={loading}
            className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-lg"
          >
            {loading ? '正在同步资料...' : '进入系统'}
          </button>
        </div>
      </form>
    </div>
  );
}