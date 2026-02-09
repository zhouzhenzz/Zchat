import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SideRail from '@/components/layout/SideRail';
import { useMomentStore } from '@/store/useMomentStore';
import { useAuthStore } from '@/store/useAuthStore';
import MomentCard from '@/components/moment/MomentCard';
import PostModal from '@/components/moment/PostModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function MomentsPage() {
  const { moments, loading, hasMore, fetchMoments } = useMomentStore();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverImage, setCoverImage] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化获取数据
  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  // 初始化时从localStorage读取背景图片
  useEffect(() => {
    const savedCoverImage = localStorage.getItem('cover_image');
    if (savedCoverImage) {
      setCoverImage(savedCoverImage);
      console.log('Loaded cover image from localStorage:', savedCoverImage);
    }
  }, []);

  // 处理滚动加载更多
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 200 && !loading && hasMore) {
        // 简单实现：每次加载下一页
        const currentPage = Math.ceil(moments.length / 10) + 1;
        fetchMoments(currentPage);
      }
    }
  };

  // 处理发布按钮点击
  const handlePostClick = () => {
    setIsModalOpen(true);
  };

  // 处理图片路径
  const getFullImageUrl = (imageUrl: string | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-white text-gray-900 font-['Inter']">
      {/* 1. 最左侧窄边导航栏 */}
      <SideRail currentMode="moments" />

      {/* 2. 右侧主内容区 */}
      <main className="flex-1 flex flex-col bg-white h-full relative overflow-hidden md:pt-0 pt-16 md:pb-0 pb-16">
        <div 
          className="flex-1 overflow-y-auto" 
          ref={containerRef}
          onScroll={handleScroll}
        >
          {/* 顶部背景和用户信息 */}
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
                <h1 className="text-xl font-bold text-black">动态</h1>
                <button
                  onClick={handlePostClick}
                  className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  发布
                </button>
              </div>
            </header>
          </div>

          {/* 用户信息和统计 */}
          <div className="px-4 sm:px-8 -mt-24 sm:-mt-28">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 items-center sm:mb-10">
              {/* 头像 */}
              <Link to="/timeline" className="cursor-pointer relative z-20">
                {user?.avatar_url ? (
                  <img 
                    src={getFullImageUrl(user.avatar_url)}
                    alt={user.username}
                    className="w-20 sm:w-24 h-20 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-2xl sm:text-3xl border-4 border-white shadow-lg">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </Link>
              
              {/* 用户信息 */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-bold text-black mb-2">{user?.username}</h2>
                <p className="text-gray-500 mb-4">{user?.bio || 'No bio yet'}</p>
              </div>
              
            </div>
          </div>

          {/* 动态列表 */}
          <div className="px-4 sm:px-8 py-6">
            <h3 className="text-lg font-bold text-black mb-6">最近动态</h3>
            
            {loading && moments.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-sm text-gray-600">Loading moments...</span>
              </div>
            ) : moments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <h3 className="text-lg font-bold text-black mb-2">No moments yet</h3>
                <p className="text-gray-400 mb-6 max-w-md">Be the first to share your thoughts and moments with your friends!</p>
                <button
                  onClick={handlePostClick}
                  className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
                >
                  Share Your First Moment
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {moments.map((moment) => (
                  <MomentCard key={moment.id} moment={moment} />
                ))}
              </div>
            )}

            {/* 加载更多 */}
            {loading && moments.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin mr-3"></div>
                <span className="text-sm text-gray-500">Loading more...</span>
              </div>
            )}

            {/* 到底了 */}
            {!loading && moments.length > 0 && (
              <div className="text-center text-xs text-gray-400 py-8">
                — End of moments —
              </div>
            )}
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
