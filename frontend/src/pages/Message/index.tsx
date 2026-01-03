import { useEffect, useState } from 'react';
import SideRail from '@/components/layout/SideRail';
import ContactList from '@/components/chat/ContactList';
import ChatWindow from '@/components/chat/ChatWindow';
import ProfileView from '@/components/profile/ProfileView';
import FriendView from '@/components/friends/FriendView'; // 假设你已根据 HTML 实现此组件
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * mode 定义说明：
 * - chat: 标准聊天模式（会话列表 + 聊天窗口）
 * - profile: 个人中心
 * - friends: 联系人管理（好友列表、申请、搜索）
 */
export default function MessagePage({ mode = 'chat' }: { mode?: 'chat' | 'profile' | 'friends' }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const token = useAuthStore((s) => s.token);
  const { initWebSocket, fetchSessions } = useChatStore();

  // 只要 token 存在，就建立长连接并更新会话列表
  useEffect(() => {
    if (token) {
      initWebSocket(token);
      fetchSessions(); 
    }
  }, [token, initWebSocket, fetchSessions]);

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
      {/* 1. 最左侧窄边导航栏 (SideRail) */}
      <SideRail />

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