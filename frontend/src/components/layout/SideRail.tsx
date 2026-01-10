import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

// 1. 定义组件接收的属性类型
interface SideRailProps {
  currentMode?: 'chat' | 'profile' | 'friends';
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
    <aside className="hidden md:flex w-20 flex-col items-center py-8 bg-[#1a1a1a] text-white shrink-0">
      {/* 顶部 Logo */}
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-10 text-xl font-bold">
        M
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
        
        <button className="text-white/30 hover:text-white/60 transition-colors cursor-pointer text-xl">
          ⚙️
        </button>
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
            <span className="text-xs font-bold text-white">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </Link>
      </div>
    </aside>
  );
}