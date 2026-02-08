import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SideRail from '@/components/layout/SideRail';
import { useAuthStore } from '@/store/useAuthStore';
import { useMomentStore } from '@/store/useMomentStore';
import MomentCard from '@/components/moment/MomentCard';
import PostModal from '@/components/moment/PostModal';
import type { MomentResponse } from '@/types/moment';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function TimelinePage() {
  const { user } = useAuthStore();
  const { moments, loading, fetchMoments } = useMomentStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personalMoments, setPersonalMoments] = useState<MomentResponse[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化获取数据
  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  // 处理发布按钮点击
  const handlePostClick = () => {
    setIsModalOpen(true);
  };

  // 处理图片路径
  const getFullImageUrl = useCallback((imageUrl: string | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  }, []);

  // 初始化时从localStorage读取背景图片
  useEffect(() => {
    const savedCoverImage = localStorage.getItem('cover_image');
    if (savedCoverImage) {
      setCoverImage(savedCoverImage);
      console.log('Loaded cover image from localStorage:', savedCoverImage);
    }
  }, []);

  // 过滤个人动态
  useEffect(() => {
    if (user) {
      const filteredMoments = moments.filter((moment) => moment.user_id === user.id);
      setPersonalMoments(filteredMoments);
    }
  }, [moments, user]);

  // 处理背景图片上传
  const handleCoverUpload = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择并上传到后端
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // 显示预览
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            setCoverImage(result);
          }
        };
        reader.readAsDataURL(file);

        // 上传到后端
        const formData = new FormData();
        formData.append('file', file);

        const token = useAuthStore.getState().token;
        if (!token) {
          console.error('No token found');
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Background image uploaded successfully:', data);
          
          // 保存背景图片URL到localStorage
          const fullImageUrl = getFullImageUrl(data.url) || '';
          localStorage.setItem('cover_image', fullImageUrl);
          console.log('Background image saved to localStorage:', fullImageUrl);
        } else {
          console.error('Failed to upload background image:', response.statusText);
        }
      } catch (error) {
        console.error('Error uploading background image:', error);
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-white text-gray-900 font-['Inter']">
      {/* 1. 最左侧窄边导航栏 */}
      <SideRail currentMode="timeline" />

      {/* 2. 右侧主内容区 */}
      <main className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* 顶部背景 */}
          <div className="h-48 bg-gray-50 relative">
            {/* 背景图片 */}
            {coverImage && (
              <img 
                src={coverImage} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            )}
            
            {/* 顶部导航 */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-5">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-black">My Timeline</h1>
                <button
                  onClick={handlePostClick}
                  className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Post
                </button>
              </div>
            </header>
          </div>

          {/* 用户信息 */}
          <div className="px-8 -mt-28">
            <div className="flex space-x-6 items-center mb-10">
              {/* 头像 */}
              <div className="relative">
                <Link to="/timeline" className="cursor-pointer z-20">
                  {user?.avatar_url ? (
                    <img 
                      src={getFullImageUrl(user.avatar_url)}
                      alt={user.username} 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-3xl border-4 border-white shadow-lg">
                      {user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </Link>
                
                {/* 设置背景按钮 */}
                <button
                  onClick={handleCoverUpload}
                  className="absolute -right-2 -bottom-2 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md"
                  title="设置朋友圈背景"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              
              {/* 隐藏的文件输入 */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-black mb-2">{user?.username}</h2>
                <p className="text-gray-500 mb-4">{user?.bio || 'No bio yet'}</p>
                <div className="flex space-x-4">
                  <button className="flex items-center text-sm font-bold text-gray-600 hover:text-black transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Edit Profile
                  </button>
                  <button className="flex items-center text-sm font-bold text-gray-600 hover:text-black transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Settings
                  </button>
                </div>
              </div>
            </div>



            {/* 个人动态 */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-black mb-6">My Moments</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-sm text-gray-600">Loading moments...</span>
                </div>
              ) : personalMoments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <h3 className="text-lg font-bold text-black mb-2">No moments yet</h3>
                  <p className="text-gray-400 mb-6 max-w-md">Share your first moment and start building your timeline!</p>
                  <button
                    onClick={handlePostClick}
                    className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
                  >
                    Share Your First Moment
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {personalMoments.map((moment) => (
                    <MomentCard key={moment.id} moment={moment} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 发布动态弹窗 */}
        <PostModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </main>
    </div>
  );
}
