// src/pages/Message/index.tsx
import { useState } from 'react';
import SideRail from '@/components/layout/SideRail';
import ContactList from '@/components/chat/ContactList';
import ChatWindow from '@/components/chat/ChatWindow';
import ProfileView from '@/components/profile/ProfileView'; // 新建这个组件

export default function MessagePage({ mode = 'chat' }: { mode?: 'chat' | 'profile' }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden flex bg-white text-gray-900">
      <SideRail />

      <aside className={`
          fixed md:relative z-30 w-80 h-full bg-white border-r border-gray-100 flex flex-col shrink-0 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <ContactList onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* 动态渲染区域 */}
      <main className="flex-1 flex flex-col bg-white h-full relative overflow-y-auto">
        {mode === 'chat' ? (
          <ChatWindow onMenuClick={() => setIsSidebarOpen(true)} />
        ) : (
          <ProfileView /> 
        )}
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}