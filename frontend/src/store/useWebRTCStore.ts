import { create } from 'zustand';
import { useChatStore } from './useChatStore';
import { useAuthStore } from './useAuthStore';
import { WebRTCManager, generateSessionId, serializeIceCandidate, deserializeIceCandidate } from '@/utils/webrtc';
import type { WebRTCState, CallSession, WebRTCMessage } from '@/types/webrtc';

interface WebRTCStore extends WebRTCState {
  webrtcManager: WebRTCManager | null;
  startCall: (receiverId: number, callType: 'audio' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => void;
  handleIncomingCall: (message: WebRTCMessage) => void;
  handleCallAnswer: (message: WebRTCMessage) => void;
  handleIceCandidate: (message: WebRTCMessage) => void;
  toggleMute: () => boolean;
  toggleVideo: () => boolean;
  setRemoteStream: (stream: MediaStream) => void;
  clearError: () => void;
}

export const useWebRTCStore = create<WebRTCStore>((set, get) => ({
  isCalling: false,
  isReceivingCall: false,
  isInCall: false,
  localStream: null,
  remoteStream: null,
  currentCall: null,
  peerConnection: null,
  error: null,
  webrtcManager: null,

  setRemoteStream: (stream) => {
    set({ remoteStream: stream });
  },

  clearError: () => {
    set({ error: null });
  },

  startCall: async (receiverId, callType) => {
    const { user } = useAuthStore.getState();
    const { socket } = useChatStore.getState();

    if (!user || !socket) {
      throw new Error('用户未登录或连接未建立');
    }

    set({ error: null });

    const sessionId = generateSessionId();
    console.log('[A] Starting call to', receiverId, 'session:', sessionId);
    
    const webrtcManager = new WebRTCManager(
      (stream) => set({ remoteStream: stream }),
      () => {
        set({ isInCall: false, isCalling: false, localStream: null, remoteStream: null, currentCall: null });
        get().endCall();
      },
      (error) => {
        console.error('Call error:', error);
        set({ error });
      },
      (candidate) => {
        const signalMessage: WebRTCMessage = {
          type: 'ice_candidate',
          sender_id: user.id,
          receiver_id: receiverId,
          ice_candidate: serializeIceCandidate(candidate),
          session_id: sessionId
        };
        socket.send(JSON.stringify(signalMessage));
      }
    );

    set({ webrtcManager });

    try {
      console.log('[A] Getting local media stream...');
      const localStream = await webrtcManager.startCall(callType);
      set({ localStream, isCalling: true });

      console.log('[A] Creating offer...');
      const offer = await webrtcManager.createOffer();
      console.log('[A] Offer created:', offer);
      
      const callRequest: WebRTCMessage = {
        type: 'call_request',
        sender_id: user.id,
        receiver_id: receiverId,
        call_type: callType,
        session_id: sessionId
      };
      socket.send(JSON.stringify(callRequest));

      const offerMessage: WebRTCMessage = {
        type: 'offer',
        sender_id: user.id,
        receiver_id: receiverId,
        sdp: offer.sdp,
        call_type: callType,
        session_id: sessionId
      };
      console.log('[A] Sending offer to B:', offerMessage);
      socket.send(JSON.stringify(offerMessage));

      const currentCall: CallSession = {
        session_id: sessionId,
        caller_id: user.id,
        callee_id: receiverId,
        call_type: callType,
        status: 'pending'
      };
      
      webrtcManager.setCurrentSession(currentCall);
      set({ currentCall });
      console.log('[A] Call started, waiting for answer from B');
    } catch (error) {
      console.error('Failed to start call:', error);
      set({ isCalling: false });
      throw error;
    }
  },

  acceptCall: async () => {
    const { currentCall, webrtcManager } = get();
    const { user } = useAuthStore.getState();
    const { socket } = useChatStore.getState();

    if (!currentCall || !webrtcManager || !user || !socket) {
      throw new Error('无法接受呼叫');
    }

    set({ error: null });

    try {
      console.log('[B] Accepting call, starting media stream...');
      const localStream = await webrtcManager.startCall(currentCall.call_type);
      set({ localStream, isReceivingCall: false, isInCall: true });

      const acceptMessage: WebRTCMessage = {
        type: 'call_accept',
        sender_id: user.id,
        receiver_id: currentCall.caller_id,
        session_id: currentCall.session_id
      };
      socket.send(JSON.stringify(acceptMessage));

      // 创建并发送 answer
      console.log('[B] Creating answer...');
      const answer = await webrtcManager.createAnswer({ type: 'offer', sdp: '' }); // sdp参数不会被使用，因为远程描述已设置
      console.log('[B] Answer created:', answer);
      
      const answerMessage: WebRTCMessage = {
        type: 'answer',
        sender_id: user.id,
        receiver_id: currentCall.caller_id,
        sdp: answer.sdp,
        session_id: currentCall.session_id
      };
      console.log('[B] Sending answer to A:', answerMessage);
      socket.send(JSON.stringify(answerMessage));

      currentCall.status = 'active';
      set({ currentCall });
    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  },

  rejectCall: async () => {
    const { currentCall } = get();
    const { user } = useAuthStore.getState();
    const { socket } = useChatStore.getState();

    if (!currentCall || !user || !socket) {
      return;
    }

    const rejectMessage: WebRTCMessage = {
      type: 'call_reject',
      sender_id: user.id,
      receiver_id: currentCall.caller_id,
      session_id: currentCall.session_id
    };
    socket.send(JSON.stringify(rejectMessage));

    set({ 
      isReceivingCall: false, 
      isInCall: false, 
      currentCall: null,
      localStream: null,
      remoteStream: null,
      error: null
    });
  },

  endCall: () => {
    const { currentCall, webrtcManager } = get();
    const { user } = useAuthStore.getState();
    const { socket } = useChatStore.getState();

    if (webrtcManager) {
      webrtcManager.endCall();
    }

    if (currentCall && user && socket) {
      const endMessage: WebRTCMessage = {
        type: 'call_end',
        sender_id: user.id,
        receiver_id: currentCall.caller_id === user.id ? currentCall.callee_id : currentCall.caller_id,
        session_id: currentCall.session_id
      };
      socket.send(JSON.stringify(endMessage));
    }

    set({ 
      isCalling: false, 
      isReceivingCall: false, 
      isInCall: false,
      localStream: null,
      remoteStream: null,
      currentCall: null,
      peerConnection: null,
      error: null
    });
  },

  handleIncomingCall: (message) => {
    const { user } = useAuthStore.getState();
    
    if (message.receiver_id !== user?.id) return;

    const currentCall: CallSession = {
      session_id: message.session_id!,
      caller_id: message.sender_id,
      callee_id: user.id,
      call_type: message.call_type!,
      status: 'pending'
    };

    const webrtcManager = new WebRTCManager(
      (stream) => set({ remoteStream: stream }),
      () => {
        set({ isInCall: false, isReceivingCall: false, localStream: null, remoteStream: null, currentCall: null });
        get().endCall();
      },
      (error) => {
        console.error('Call error:', error);
        set({ error });
      },
      (candidate) => {
        const signalMessage: WebRTCMessage = {
          type: 'ice_candidate',
          sender_id: user.id,
          receiver_id: message.sender_id,
          ice_candidate: serializeIceCandidate(candidate),
          session_id: message.session_id
        };
        const { socket } = useChatStore.getState();
        socket?.send(JSON.stringify(signalMessage));
      }
    );

    set({ 
      isReceivingCall: true, 
      currentCall, 
      webrtcManager 
    });
  },

  handleCallAnswer: async (message) => {
    const { webrtcManager, currentCall } = get();
    const { user } = useAuthStore.getState();
    const { socket } = useChatStore.getState();

    if (!user || !socket) return;
    if (message.sender_id !== user.id && message.receiver_id !== user.id) return;

    try {
      if (message.type === 'offer' && message.sdp) {
        console.log('[B] Received offer from A, message:', message);
        // 如果还没有 webrtcManager，先创建（处理 offer 先于 call_request 到达的情况）
        let manager = webrtcManager;
        if (!manager) {
          console.log('[B] Creating new WebRTC manager for incoming call');
          const callType = message.call_type || 'video'; // 默认为视频通话
          const sessionId = message.session_id || generateSessionId();
          
          const newManager = new WebRTCManager(
            (stream) => set({ remoteStream: stream }),
            () => {
              set({ isInCall: false, isReceivingCall: false, localStream: null, remoteStream: null, currentCall: null });
              get().endCall();
            },
            (error) => {
              console.error('Call error:', error);
              set({ error });
            },
            (candidate) => {
              const signalMessage: WebRTCMessage = {
                type: 'ice_candidate',
                sender_id: user.id,
                receiver_id: message.sender_id,
                ice_candidate: serializeIceCandidate(candidate),
                session_id: sessionId
              };
              socket.send(JSON.stringify(signalMessage));
            }
          );

          const newCurrentCall: CallSession = {
            session_id: sessionId,
            caller_id: message.sender_id,
            callee_id: user.id,
            call_type: callType,
            status: 'pending'
          };

          newManager.setCurrentSession(newCurrentCall);
          set({ 
            webrtcManager: newManager, 
            currentCall: newCurrentCall,
            isReceivingCall: true 
          });
          manager = newManager;
        }

        // 设置远程描述（offer），但不创建answer
        console.log('[B] Setting remote description (offer)...');
        await manager.setRemoteDescription({ type: 'offer', sdp: message.sdp });
        console.log('[B] Remote description set');
        
        set({ isReceivingCall: true }); // 显示来电通知
        console.log('[B] Call notification shown, waiting for user to accept');
        
      } else if (message.type === 'answer' && message.sdp) {
        console.log('[A] Received answer from B, message:', message);
        // 处理收到的 answer（需要 webrtcManager 存在）
        if (!webrtcManager) {
          console.error('[A] No WebRTC manager for answer');
          return;
        }
        console.log('[A] Setting remote answer...');
        await webrtcManager.setRemoteAnswer({ type: 'answer', sdp: message.sdp });
        console.log('[A] Remote answer set, updating state to inCall');
        set({ isCalling: false, isInCall: true });
        
        if (webrtcManager.getCurrentSession()) {
          const updatedCall = { ...webrtcManager.getCurrentSession()! };
          updatedCall.status = 'active';
          set({ currentCall: updatedCall });
        }
      } else if (message.type === 'call_accept') {
        console.log('[A] Received call_accept from B');
        // 这里可以更新UI状态，但实际连接由answer消息建立
      }
    } catch (error) {
      console.error('Failed to handle call answer:', error);
    }
  },

  handleIceCandidate: async (message) => {
    const { webrtcManager } = get();
    const { user } = useAuthStore.getState();

    if (!webrtcManager || !user || !message.ice_candidate) return;

    if (message.sender_id !== user.id && message.receiver_id !== user.id) return;

    try {
      const candidate = deserializeIceCandidate(message.ice_candidate);
      await webrtcManager.addIceCandidate(candidate);
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  },

  toggleMute: () => {
    const { webrtcManager } = get();
    return webrtcManager?.toggleMute() || false;
  },

  toggleVideo: () => {
    const { webrtcManager } = get();
    return webrtcManager?.toggleVideo() || false;
  }
}));
