export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice_candidate' | 'call_request' | 'call_accept' | 'call_reject' | 'call_end';
  sender_id: number;
  receiver_id: number;
  sdp?: string;
  ice_candidate?: RTCIceCandidate;
  call_type?: 'audio' | 'video';
  session_id?: string;
}

export interface CallSession {
  session_id: string;
  caller_id: number;
  callee_id: number;
  call_type: 'audio' | 'video';
  status: 'pending' | 'active' | 'ended' | 'rejected';
  start_time?: Date;
  end_time?: Date;
}

export interface WebRTCState {
  isCalling: boolean;
  isReceivingCall: boolean;
  isInCall: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  currentCall: CallSession | null;
  peerConnection: RTCPeerConnection | null;
  error: string | null;
}

export interface CallNotification {
  session_id: string;
  caller_id: number;
  caller_name: string;
  caller_avatar: string;
  call_type: 'audio' | 'video';
}
