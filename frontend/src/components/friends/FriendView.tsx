import { useState, useEffect } from 'react';
import { useFriendStore } from '@/store/useFriendStore';
import ContactGrid from './ContactGrid';
import RequestList from './RequestList';
import AddFriend from './AddFriend';

type TabType = 'all' | 'pending' | 'add';

export default function FriendView() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  // 1. 确保 Store 中这些函数名完全匹配（fetchFriends, fetchPending）
  const { fetchFriends, fetchPending, pendingRequests } = useFriendStore();

  // 2. 使用 useCallback 保证引用稳定（可选，但在大型应用中推荐）
  // 或者确保在 useEffect 的依赖数组中包含它们
  useEffect(() => {
    const initData = async () => {
      try {
        // 并发请求，提高加载速度
        await Promise.all([
          fetchFriends(),
          fetchPending()
        ]);
      } catch (err) {
        console.error("初始化联系人数据失败", err);
      }
    };
    
    initData();
  }, [fetchFriends, fetchPending]); // 包含依赖项，避免 Linter 警告

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      {/* Header & Tabs */}
      <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">联系人</h1>
          <p className="text-gray-400 text-[11px] mt-1 uppercase tracking-wider font-medium">管理你的社交圈</p>
        </div>
        
        <div className="flex bg-gray-100/50 p-1.5 rounded-2xl self-start md:self-auto">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'all' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            全部好友
          </button>
          
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'pending' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            新申请
            {pendingRequests.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] flex items-center justify-center animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('add')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'add' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            + 添加好友
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {/* 使用简单的过渡效果或条件渲染 */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'all' && <ContactGrid />}
          {activeTab === 'pending' && <RequestList />}
          {activeTab === 'add' && <AddFriend />}
        </div>
      </div>
    </div>
  );
}