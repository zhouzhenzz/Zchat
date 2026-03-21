import { useWebRTCStore } from '@/store/useWebRTCStore';
import { useChatStore } from '@/store/useChatStore';
import CallNotification from './CallNotification';

export default function GlobalCallNotification() {
  const { isReceivingCall, currentCall } = useWebRTCStore();
  const { sessions } = useChatStore();

  if (!isReceivingCall || !currentCall) {
    return null;
  }

  // 查找来电者信息
  const callerSession = sessions.find(s => s.peer_id === currentCall.caller_id);
  
  if (!callerSession) {
    // 如果找不到来电者信息，显示一个简化的通知
    return (
      <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-blue-500 bg-gray-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">未知用户</h3>
            <p className="text-gray-500">
              {currentCall.call_type === 'video' ? '视频通话' : '语音通话'}
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <div className="animate-ping h-3 w-3 rounded-full bg-green-500 opacity-75"></div>
              <div className="animate-ping h-3 w-3 rounded-full bg-green-500 opacity-75 animate-delay-200"></div>
              <div className="animate-ping h-3 w-3 rounded-full bg-green-500 opacity-75 animate-delay-400"></div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => useWebRTCStore.getState().rejectCall()}
              className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-800 font-medium flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span>拒绝</span>
            </button>

            <button
              onClick={() => useWebRTCStore.getState().acceptCall()}
              className="flex-1 py-3 rounded-lg bg-green-600 text-white font-medium flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>接听</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CallNotification
      callerName={callerSession.username}
      callerAvatar={callerSession.avatar_url || ''}
      callType={currentCall.call_type}
    />
  );
}