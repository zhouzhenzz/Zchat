import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

// 1. 定义组件接收的属性类型
interface SideRailProps {
  currentMode?: 'chat' | 'profile' | 'friends' | 'moments' | 'timeline';
}

// 2. 在组件参数中接收 currentMode
export default function SideRail({ currentMode = 'chat' }: SideRailProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const getFullUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex w-20 flex-col items-center py-8 bg-[#1a1a1a] text-white shrink-0">
        {/* 顶部 Logo */}
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-10 text-xl font-bold">
          Z
        </div>

        {/* 中间导航菜单 */}
        <nav className="flex flex-col space-y-8 flex-1">
          {/* 聊天图标：根据 currentMode 判断是否高亮 */}
          <Link 
            to="/chat" 
            className={`transition-all text-center text-xl ${
              currentMode === 'chat' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'
            }`}
            title="聊天"
          >
            💬
          </Link>
          
          {/* 联系人图标：根据 currentMode 判断是否高亮 */}
          <Link 
            to="/friends" 
            className={`transition-all text-center text-xl ${
              currentMode === 'friends' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'
            }`}
            title="联系人"
          >
            👥
          </Link>
          
          {/* 朋友圈图标：根据 currentMode 判断是否高亮 */}
          <Link 
            to="/moments" 
            className={`transition-all text-center text-xl ${
              currentMode === 'moments' ? 'text-white scale-110' : 'text-white/30 hover:text-white/60'
            }`}
            title="朋友圈"
          >
            📷
          </Link>
          
        </nav>

        {/* 底部操作区 */}
        <div className="flex flex-col space-y-6 items-center">
          <button 
            onClick={handleLogout}
            className="text-white/30 hover:text-red-400 transition-colors cursor-pointer p-2"
            title="退出登录"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>

          {/* 个人头像：如果是 profile 模式，加一个白色边框高亮 */}
          <Link 
            to="/profile"
            className={`w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 overflow-hidden border cursor-pointer flex items-center justify-center transition-all ${
              currentMode === 'profile' ? 'border-white scale-110' : 'border-white/10 opacity-70 hover:opacity-100'
            }`}
            title={user?.username || '个人中心'}
          >
            {user?.avatar_url ? (
              <img 
                src={getFullUrl(user.avatar_url)!} 
                alt="avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src="/default-avatar.png" 
                alt="avatar" 
                className="w-full h-full object-cover" 
              />
            )}
          </Link>
        </div>
      </aside>

      {/* 移动端顶部Logo */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#1a1a1a] z-50 flex justify-center items-center h-16">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl font-bold text-white">
          Z
        </div>
      </div>

      {/* 移动端底部导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] text-white z-50">
        <div className="flex justify-around items-center h-16">
          <Link 
            to="/chat" 
            className={`flex flex-col items-center justify-center p-2 ${
              currentMode === 'chat' ? 'text-white scale-110' : 'text-white/30'
            }`}
            title="聊天"
          >
            <span className="text-xl">💬</span>
            <span className="text-xs mt-1">聊天</span>
          </Link>
          <Link 
            to="/friends" 
            className={`flex flex-col items-center justify-center p-2 ${
              currentMode === 'friends' ? 'text-white scale-110' : 'text-white/30'
            }`}
            title="联系人"
          >
            <span className="text-xl">👥</span>
            <span className="text-xs mt-1">联系人</span>
          </Link>
          <Link 
            to="/moments" 
            className={`flex flex-col items-center justify-center p-2 ${
              currentMode === 'moments' ? 'text-white scale-110' : 'text-white/30'
            }`}
            title="朋友圈"
          >
            <span className="text-xl">📷</span>
            <span className="text-xs mt-1">朋友圈</span>
          </Link>
          <Link 
            to="/profile"
            className={`flex flex-col items-center justify-center p-2 ${
              currentMode === 'profile' ? 'text-white scale-110' : 'text-white/30'
            }`}
            title="个人中心"
          >
            {user?.avatar_url ? (
              <img 
                src={getFullUrl(user.avatar_url)!} 
                alt="avatar" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-xl">👤</span>
            )}
            <span className="text-xs mt-1">我的</span>
          </Link>
        </div>
      </div>
    </>
  );
}