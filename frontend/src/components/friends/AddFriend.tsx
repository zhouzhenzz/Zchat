import React, { useState } from 'react';
import { useFriendStore } from '@/store/useFriendStore';
import * as friendApi from '@/api/friend'; // 导入刚才定义的 API
import { useAuthStore } from '@/store/useAuthStore';

export default function AddFriend() {
  const [searchVal, setSearchVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { fetchPending } = useFriendStore();
  const { user: currentUser } = useAuthStore();

  // 处理发送好友请求
  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = Number(searchVal.trim());

    // 前端基础校验
    if (!searchVal.trim() || isNaN(targetId)) {
      setErrorMsg('请输入有效的用户 ID');
      return;
    }

    if (targetId === currentUser?.id) {
      setErrorMsg('不能添加自己为好友');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // 直接调用发送请求接口
      // 逻辑：如果对方存在，后端会创建一条 status=False 的记录
      await friendApi.sendFriendRequestApi(targetId);
      
      alert('好友申请已发送！');
      setSearchVal('');
      // 成功后可以刷新一下申请列表（如果是双向可见的话）
      fetchPending();
    } catch (err: any) {
      // 处理后端返回的错误信息（如：404 用户不存在，400 已经是好友等）
      const detail = err.response?.data?.detail;
      if (err.response?.status === 404) {
        setErrorMsg('未找到该用户，请检查 ID 是否正确');
      } else {
        setErrorMsg(detail || '请求发送失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm border border-gray-100">
          🔍
        </div>
        <h2 className="text-2xl font-bold text-gray-900">寻找新朋友</h2>
        <p className="text-gray-400 text-xs mt-2">
          输入对方的数字 ID。发送申请后，对方同意即可开始聊天。
        </p>
      </div>

      <form onSubmit={handleAddRequest} className="relative group">
        <div className="relative">
          <input 
            type="text" 
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="输入用户 ID (例如: 1002)..." 
            className={`w-full bg-gray-50 border-2 rounded-2xl py-4 pl-12 pr-36 outline-none transition-all text-sm font-bold placeholder:font-normal ${
              errorMsg ? 'border-red-100 focus:border-red-400' : 'border-transparent focus:border-black focus:bg-white'
            }`}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          
          <button 
            type="submit"
            disabled={!searchVal.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 bg-black text-white px-6 rounded-xl text-xs font-bold disabled:opacity-30 hover:scale-[0.98] active:scale-95 transition-all shadow-md flex items-center gap-2"
          >
            {isLoading && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
            {isLoading ? '发送中' : '发送申请'}
          </button>
        </div>

        {/* 错误信息提示 */}
        {errorMsg && (
          <div className="mt-3 px-4 py-2 bg-red-50 text-red-500 text-xs rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errorMsg}
          </div>
        )}
      </form>

      {/* 底部装饰/提示 */}
      <div className="mt-16 grid grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">我的 ID</h4>
          <p className="text-xl font-mono font-bold text-black">{currentUser?.id || '---'}</p>
          <p className="text-[10px] text-gray-400 mt-1">分享给好友来添加你</p>
        </div>
        <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">安全提示</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            请确认 ID 来源可靠，系统不会主动公开您的个人隐私。
          </p>
        </div>
      </div>
    </div>
  );
}