import { useEffect, useRef } from 'react';
import { useWebRTCStore } from '@/store/useWebRTCStore';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';

interface CallWindowProps {
  onClose: () => void;
  peerId: number;
  peerName: string;
  peerAvatar: string;
}

export default function CallWindow({ onClose, peerId, peerName, peerAvatar }: CallWindowProps) {
  const { 
    localStream, 
    remoteStream, 
    isInCall, 
    isCalling, 
    endCall, 
    toggleMute, 
    toggleVideo 
  } = useWebRTCStore();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const isMuted = useRef(false);
  const isVideoOff = useRef(false);

  // 处理本地视频流
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 处理远程视频流
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleMuteToggle = () => {
    isMuted.current = !isMuted.current;
    toggleMute();
  };

  const handleVideoToggle = () => {
    isVideoOff.current = !isVideoOff.current;
    toggleVideo();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Call Header */}
      <div className="p-6 flex items-center justify-between bg-black/90 border-b border-gray-800">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
            <img 
              src={peerAvatar || '/default-avatar.png'} 
              alt={peerName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{peerName}</h3>
            <p className="text-gray-400 text-sm">
              {isCalling ? '正在呼叫...' : isInCall ? '通话中' : '等待接听'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            endCall();
            onClose();
          }} 
          className="text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-900">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400">等待对方加入...</p>
            </div>
          </div>
        )}

        {/* Local Video Preview */}
        {localStream && (
          <div className="absolute bottom-8 right-8 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 flex items-center justify-center space-x-8 bg-black/90 border-t border-gray-800">
        <button
          onClick={handleMuteToggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted.current ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}
        >
          {isMuted.current ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 10a7 7 0 017 7m-7-4a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        <button
          onClick={handleVideoToggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isVideoOff.current ? 'bg-gray-800 text-white' : 'bg-gray-800 text-white'}`}
        >
          {isVideoOff.current ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
