import React from 'react';
import { useFriendStore } from '@/store/useFriendStore';

export default function RequestList() {
  const { pendingRequests, acceptRequest, removeFriend } = useFriendStore();

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        暂无新的好友申请
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {pendingRequests.map((req) => (
        <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              ?
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">用户 ID: {req.user_id}</h4>
              <p className="text-xs text-gray-500 mt-0.5">请求添加你为好友</p>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => acceptRequest(req.user_id)}
              className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              接受
            </button>
            <button 
              onClick={() => removeFriend(req.user_id)} // 拒绝其实也是删除这行记录
              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              忽略
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}