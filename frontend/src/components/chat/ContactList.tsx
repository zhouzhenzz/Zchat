import { useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
// 必须使用 import type 以符合 verbatimModuleSyntax 规范
import type { ChatSession } from '@/types/chat';

interface ContactListProps {
  onClose?: () => void;
}

export default function ContactList({ onClose }: ContactListProps) {
  // 1. 从 Store 中提取状态和方法
  const { 
    sessions, 
    loading, 
    fetchSessions, 
    activePeerId, 
    setActivePeer, 
    markAsRead, 
    fetchHistory 
  } = useChatStore();
  
  // 优先级：环境变量 > 默认后端地址
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // 2. 组件挂载时获取最新的会话列表
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /**
   * 拼接完整图片地址的辅助函数
   */
  const getFullUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    // 确保路径以 / 开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
  };

  /**
   * 处理联系人点击事件
   */
  const handleContactClick = async (peerId: number) => {
    // A. 设置当前活跃的聊天对象ID
    setActivePeer(peerId); 
    
    // B. 加载该用户的聊天历史记录 (必须先加载，防止界面闪烁)
    await fetchHistory(peerId); 
    
    // C. 立即调用后端接口将该会话标记为已读
    await markAsRead(peerId);   
    
    // D. 标记已读后，刷新会话列表以消除红点
    fetchSessions();
    
    // E. 如果是移动端，点击后关闭侧边栏
    if (onClose) onClose(); 
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* 头部：标题与搜索 */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">消息</h2>
          <button className="md:hidden text-gray-400 hover:text-black transition-colors" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
      </div>

      {/* 列表区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && sessions.length === 0 ? (
          /* 加载状态反馈 */
          <div className="flex flex-col items-center justify-center h-40 space-y-3">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Updating...</span>
          </div>
        ) : (
          sessions.map((session: ChatSession) => {
            const avatarUrl = getFullUrl(session.avatar_url);
            const isActive = activePeerId === session.peer_id;
            
            return (
              <div 
                key={session.peer_id} 
                onClick={() => handleContactClick(session.peer_id)}
                className={`px-6 py-4 flex items-center cursor-pointer transition-all duration-200 group relative ${
                  isActive ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                }`}
              >
                {/* 活跃状态指示条 */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-black rounded-r-full"></div>
                )}

                {/* 头像容器 */}
                <div className="relative w-12 h-12 shrink-0">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      className="rounded-full w-full h-full object-cover shadow-sm group-hover:scale-105 transition-transform duration-300" 
                      alt={session.username} 
                    />
                  ) : (
                    <img 
                      src="/default-avatar.png" 
                      className="rounded-full w-full h-full object-cover shadow-sm group-hover:scale-105 transition-transform duration-300" 
                      alt={session.username} 
                    />
                  )}
                  
                  {/* 未读消息红点（黑色极简风） */}
                  {session.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-1 animate-in zoom-in">
                      {session.unread_count > 99 ? '99+' : session.unread_count}
                    </div>
                  )}
                </div>

                {/* 会话预览文字 */}
                <div className="ml-4 overflow-hidden flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className={`text-sm truncate transition-colors ${
                      isActive ? 'font-bold text-black' : 'font-medium text-gray-700'
                    }`}>
                      {session.username}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-2">
                      {session.last_time}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${
                    session.unread_count > 0 ? 'text-black font-semibold' : 'text-gray-400'
                  }`}>
                    {session.msg_type === 'image' ? '[图片]' : session.last_message}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* 无数据空状态 */}
        {!loading && sessions.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
               <svg className="w-6 h-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
               </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">暂无会话</p>
          </div>
        )}
      </div>
    </div>
  );
}