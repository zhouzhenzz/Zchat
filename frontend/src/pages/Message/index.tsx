import React, { useState, useEffect } from 'react';
import SideRail from '@/components/layout/SideRail';
import ContactList from '@/components/chat/ContactList';
import ChatWindow from '@/components/chat/ChatWindow';
import ProfileView from '@/components/profile/ProfileView';
import FriendView from '@/components/friends/FriendView';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useFriendStore } from '@/store/useFriendStore'; // 1. 引入好友 Store

export default function MessagePage({ mode = 'chat' }: { mode?: 'chat' | 'profile' | 'friends' }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const token = useAuthStore((s) => s.token);
  
  // 引入聊天相关方法
  const { 
    initWebSocket, 
    fetchSessions, 
    activePeerId, 
    fetchHistory, 
    markAsRead 
  } = useChatStore();

  // 2. 引入获取好友的方法
  const { fetchFriends } = useFriendStore();

  // 只要 token 存在，就执行基础数据初始化
  useEffect(() => {
    if (token) {
      initWebSocket(token);
      fetchSessions(); // 加载最近会话
      fetchFriends();  // 3. 核心完善：加载好友列表数据，确保 FriendView 有数据可显
    }
  }, [token]); 

  /**
   * 监听模式(mode)和活跃对象(activePeerId)的变化
   * 确保从好友列表跳转回来时数据同步
   */
  useEffect(() => {
    if (mode === 'chat' && activePeerId) {
      fetchHistory(activePeerId);
      markAsRead(activePeerId);
      fetchSessions();
    }
  }, [mode, activePeerId]);

  // 辅助渲染主内容区
  const renderMainContent = () => {
    switch (mode) {
      case 'profile':
        return <ProfileView />;
      case 'friends':
        return <FriendView />;
      case 'chat':
      default:
        return <ChatWindow onMenuClick={() => setIsSidebarOpen(true)} />;
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-white text-gray-900 font-['Inter']">
      {/* 1. 最左侧窄边导航栏 */}
      <SideRail currentMode={mode} />

      {/* 2. 中间/左侧会话列表侧边栏 (仅在聊天模式下显示) */}
      {mode === 'chat' && (
        <aside className={`
            fixed md:relative z-30 w-80 h-full bg-white border-r border-gray-100 flex flex-col shrink-0 transition-transform duration-300
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <ContactList onClose={() => setIsSidebarOpen(false)} />
        </aside>
      )}

      {/* 3. 右侧主内容区 */}
      <main className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
        {renderMainContent()}
      </main>

      {/* 4. 移动端遮罩层 */}
      {isSidebarOpen && mode === 'chat' && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden animate-in fade-in duration-200" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
    </div>
  );
}