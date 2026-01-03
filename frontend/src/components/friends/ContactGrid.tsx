import React from 'react';
import { useFriendStore } from '@/store/useFriendStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/store/useChatStore';

export default function ContactGrid() {
  const { friends, removeFriend } = useFriendStore();
  const { user: currentUser } = useAuthStore();
  const { setActivePeer } = useChatStore();
  const navigate = useNavigate();

  const handleChat = (friendId: number) => {
    setActivePeer(friendId);
    navigate('/chat');
  };

  if (friends.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-300">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-sm">暂无好友，去添加一个吧</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {friends.map((item) => {
        // 计算对方ID (因为好友关系是双向的，记录里可能是 user_id 或 friend_id)
        const peerId = item.user_id === currentUser?.id ? item.friend_id : item.user_id;
        
        // 注意：如果你后端没有返回 friend_info，这里只能显示 ID
        const displayName = item.friend_info?.username || `用户 ${peerId}`; 
        
        return (
          <div key={item.id} className="group p-5 border border-gray-100 rounded-2xl bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-lg font-bold text-gray-400">
                 {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => removeFriend(peerId)}
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