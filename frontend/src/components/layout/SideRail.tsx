import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function SideRail() {
  const navigate = useNavigate();
  // 从 Store 获取当前用户信息和退出方法
  const { user, logout } = useAuthStore();

  // 获取环境变量中的后端基址
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  /**
   * 拼接完整图片地址
   * 逻辑与 ProfileView 和 ContactList 保持一致
   */
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
        <Link 
          to="/chat" 
          className="text-white hover:opacity-80 transition-opacity cursor-pointer text-center text-xl"
          title="聊天"
        >
          💬
        </Link>
        <Link 
          to="/friends" 
          className="text-white/50 hover:text-white transition-colors cursor-pointer text-center text-xl"
          title="联系人"
        >
          👥
        </Link>
        <button className="text-gray-500 hover:text-white transition-colors cursor-pointer text-xl">
          ⚙️
        </button>
      </nav>

      {/* 底部操作区 */}
      <div className="flex flex-col space-y-6 items-center">
        {/* 退出登录按钮 */}
        <button 
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer p-2"
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

        {/* 个人头像：点击跳转至个人页 */}
        <Link 
          to="/profile"
          className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 overflow-hidden border border-white/10 cursor-pointer flex items-center justify-center"
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