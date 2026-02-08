import { useEffect } from 'react';
import { useFriendStore } from '@/store/useFriendStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/store/useChatStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function ContactGrid() {
  // 从 Store 获取数据和方法
  const { friends, fetchFriends, removeFriend, loading } = useFriendStore();
  const { user: currentUser } = useAuthStore();
  
  const { 
    setActivePeer, 
    fetchHistory, 
    markAsRead, 
    fetchSessions 
  } = useChatStore();
  
  const navigate = useNavigate();

  // 1. 关键修复：组件挂载时从后端获取好友列表
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleChat = async (peerId: number) => {
    setActivePeer(peerId);
    
    try {
      // 执行跳转前的数据同步
      await Promise.all([
        fetchHistory(peerId),
        markAsRead(peerId)
      ]);
      fetchSessions();
    } catch (err) {
      console.error("Failed to sync chat state:", err);
    }

    navigate('/chat');
  };

  // 2. 加载状态处理
  if (loading && friends.length === 0) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 3. 空状态展示
  if (friends.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-sm">暂无好友，去添加一个吧</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {friends.map((item) => {
        // 根据好友记录计算对方 ID
        const peerId = item.user_id === currentUser?.id ? item.friend_id : item.user_id;
        
        // 使用后端返回的 friend_info 渲染，如果没有则降级显示 ID
        const displayName = item.friend_info?.username || `用户 ${peerId}`; 
        
        return (
          <div key={item.id} className="group p-5 border border-gray-100 rounded-2xl bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                {item.friend_info?.avatar_url ? (
                  <img 
                    src={item.friend_info.avatar_url.startsWith('http') ? item.friend_info.avatar_url : `${API_BASE_URL}${item.friend_info.avatar_url}`} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-lg font-bold text-gray-400">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    if (window.confirm(`确定要删除好友 ${displayName} 吗？`)) {
                      removeFriend(peerId); //
                    }
                  }}
                  className="text-gray-300 hover:text-red-400 p-1"
                  title="解除好友"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-gray-900 mb-1">{displayName}</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-6">Online</p>
            
            <button 
              onClick={() => handleChat(peerId)}
              className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-900 font-semibold text-xs group-hover:bg-black group-hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <span>发消息</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}