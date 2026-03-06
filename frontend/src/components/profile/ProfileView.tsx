import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { updateMeApi } from '@/api/user';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ProfileView() {
  // 从 Store 获取状态
  const { user, token, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  
  // 用于操作隐藏的上传 Input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取环境变量中的后端基址
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // 本地表单状态
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    location: '',
    avatar_url: ''
  });

  // 初始化数据同步
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  /**
   * 拼接完整图片地址
   * 将后端返回的 /static/xxx.png 拼接成 http://localhost:8000/static/xxx.png
   */
  const getFullUrl = (path: string) => {
    if (!path) return 'https://i.pravatar.cc/150?u=me';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  /**
   * 1. 头像上传逻辑 (对接 /api/media/upload)
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 前端限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('文件大小不能超过 5MB');
      return;
    }

    setLoading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/media/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        const relativePath = response.data.url; // 后端返回的相对路径
        setFormData(prev => ({ ...prev, avatar_url: relativePath }));
        showToast('照片上传成功，请点击保存');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || '照片上传失败');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * 2. 资料更新保存逻辑 (对接 /api/users/me)
   */
  const handleUpdateProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const updatedUser = await updateMeApi(formData);
      // 更新 Zustand Store 状态
      setAuth(token, updatedUser);
      showToast('资料更新成功');
    } catch (err: any) {
      showToast(err.response?.data?.detail || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full w-full bg-[#fafafa] flex items-center justify-center p-6 font-['Inter'] relative md:pt-0 pt-16 md:pb-0 pb-16">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* 顶部饰条 */}
        <div className="h-32 bg-gray-50 flex items-end px-12 relative">
          {/* 桌面端：返回按钮 */}
          <Link to="/chat" className="hidden md:flex absolute top-8 left-8 w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-black transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          
          {/* 退出按钮：放置在右下侧 */}
          <button 
            onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              setAuth(null, null);
            }}
            className="absolute bottom-4 right-8 text-red-500 hover:text-red-600 transition-colors cursor-pointer p-3"
            title="退出登录"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        <div className="px-12 pb-16">
          {/* 头像展示与点击上传区域 */}
          <div className="relative -mt-16 mb-8 group inline-block">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload} 
            />
            
            <div 
              className="p-1 bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden relative cursor-pointer"
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              <img 
                src={getFullUrl(formData.avatar_url)} 
                className={`w-32 h-32 rounded-[2.2rem] object-cover transition-all duration-500 ${loading ? 'opacity-50 blur-sm' : 'group-hover:scale-110'}`} 
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {loading ? (
                   <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {/* 用户名与位置 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 block mb-1">用户名</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full text-3xl font-black italic tracking-tighter text-gray-900 border-none outline-none focus:text-indigo-600 bg-transparent transition-colors"
                />
              </div>
              <div className="w-full md:w-48">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 block mb-1">位置</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full text-sm font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border-none outline-none focus:bg-indigo-50 transition-colors"
                />
              </div>
            </div>

            {/* 简介 */}
            <div className="border-b border-gray-50 pb-8">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 block mb-3">简介</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full text-lg text-gray-400 font-light leading-relaxed h-20 resize-none border-none outline-none bg-transparent"
                placeholder="写点什么来展示你的独特..."
              />
            </div>

            {/* 只读展示信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 block mb-1">邮箱</label>
                <p className="text-sm font-medium text-gray-400">{user?.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 block mb-1">用户 ID</label>
                <p className="text-sm font-mono text-gray-400">#MNML-{user?.id}</p>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="pt-10">
              <button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="w-full bg-black text-white h-14 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:bg-gray-400"
              >
                {loading ? 'SAVING...' : '保存资料设置'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast 提示 */}
      {toast.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest animate-bounce z-50">
          {toast.msg}
        </div>
      )}
    </div>
  );
}