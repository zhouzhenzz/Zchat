import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  onMenuClick: () => void;
}

export default function ChatWindow({ onMenuClick }: ChatWindowProps) {
  const { activePeerId, sessions, messages, historyLoading } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // 匹配当前聊天对象的信息
  const activePeer = sessions.find(s => s.peer_id === activePeerId);

  // 拼接头像地址辅助函数
  const getFullAvatarUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  };

  // 消息更新后自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, historyLoading]);

  if (!activePeerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.827-1.233L3 21l1.608-4.531C3.458 14.99 3 13.056 3 11c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm font-medium">选择一个对话开始聊天</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <header className="h-20 px-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center">
          <button onClick={onMenuClick} className="md:hidden mr-4 text-gray-500 hover:text-black">☰</button>
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-50 border border-gray-100 shrink-0">
            {activePeer?.avatar_url ? (
              <img src={getFullAvatarUrl(activePeer.avatar_url)!} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500 font-bold text-xs">
                {activePeer?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">{activePeer?.username}</h3>
            
          </div>
        </div>
      </header>

      {/* Message Stream */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#fdfdfd]"
      >
        {historyLoading ? (
          <div className="flex justify-center items-center h-full text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Loading History...
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                {!isMe && (
                   <div className="w-7 h-7 rounded-full bg-gray-50 shrink-0 overflow-hidden border border-gray-100 mb-1">
                      {activePeer?.avatar_url ? (
                        <img src={getFullAvatarUrl(activePeer.avatar_url)!} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] bg-gray-100 text-gray-400 uppercase font-bold">
                          {activePeer?.username?.charAt(0)}
                        </div>
                      )}
                   </div>
                )}
                
                <div className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 text-sm shadow-sm transition-all ${
                  isMe 
                    ? 'bg-black text-white rounded-2xl rounded-br-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-none'
                }`}>
                  {msg.is_recalled ? (
                    <span className="italic opacity-50 text-xs">此消息已撤回</span>
                  ) : (
                    <>
                      {/* 根据消息类型渲染内容 */}
                      {msg.content && (
                        msg.msg_type === 'image' || (msg.content.startsWith('http') && (msg.content.endsWith('.jpg') || msg.content.endsWith('.jpeg') || msg.content.endsWith('.png') || msg.content.endsWith('.gif') || msg.content.endsWith('.webp'))) ? (
                          <div className="w-full">
                            <img 
                              src={msg.content} 
                              alt="Image" 
                              className="w-full h-auto rounded-lg object-cover max-h-64"
                            />
                          </div>
                        ) : (
                          <span className="leading-relaxed">{msg.content}</span>
                        )
                      )}
                    </>
                  )}
                  <div className={`text-[8px] mt-1.5 font-medium opacity-40 uppercase ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-50">
        <MessageInput />
      </div>
    </div>
  );
}