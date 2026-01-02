

interface ContactListProps {
  onClose?: () => void;
}

// 模拟联系人数据（实际开发中应从后端 API 获取）
const contacts = [
  { id: 1, name: 'Alex Rivera', lastMsg: '那个设计稿我们已经确认了...', time: '12:45 PM', online: true, avatar: '/static/avatar1.png' },
  { id: 2, name: 'Jordan Design', lastMsg: '谢谢，我会查看一下文件。', time: '昨天', online: false, initial: 'JD' },
];

export default function ContactList({ onClose }: ContactListProps) {
  // 获取环境变量中的后端基址
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  /**
   * 拼接完整图片地址的辅助函数
   */
  const getFullUrl = (path: string | undefined) => {
    if (!path) return null;
    // 如果是第三方随机头像地址或已经是完整 http 地址，则直接返回
    if (path.startsWith('http')) return path;
    // 否则拼接后端基址
    return `${API_BASE_URL}${path}`;
  };

  return (
    <>
      {/* 头部搜索区域 */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Messages</h2>
          <button className="md:hidden text-gray-400" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="搜索对话..." 
            className="w-full bg-gray-50 border-none rounded-xl py-2 px-4 text-sm focus:ring-1 focus:ring-gray-200 outline-none"
          />
        </div>
      </div>

      {/* 列表滚动区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {contacts.map((contact) => {
          const avatarUrl = getFullUrl(contact.avatar);
          
          return (
            <div 
              key={contact.id} 
              className={`px-6 py-4 flex items-center cursor-pointer transition-colors hover:bg-gray-50 ${contact.id === 1 ? 'bg-gray-50 border-r-2 border-black' : ''}`}
            >
              <div className="relative w-12 h-12 shrink-0">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    className="rounded-full w-full h-full object-cover" 
                    alt={contact.name} 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center font-medium text-sm text-gray-600">
                    {contact.initial}
                  </div>
                )}
                
                {/* 在线状态标识 */}
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="ml-4 overflow-hidden flex-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-medium text-sm truncate">{contact.name}</h4>
                  <span className="text-[10px] text-gray-400">{contact.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">{contact.lastMsg}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}