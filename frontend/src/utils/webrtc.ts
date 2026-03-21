import type { WebRTCMessage, CallSession } from '@/types/webrtc';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentSession: CallSession | null = null;
  private onRemoteStreamCallback: (stream: MediaStream) => void = () => {};
  private onCallEndCallback: () => void = () => {};
  private onCallErrorCallback: (error: string) => void = () => {};
  private onIceCandidateCallback: (candidate: RTCIceCandidate) => void = () => {};

  constructor(
    onRemoteStream: (stream: MediaStream) => void,
    onCallEnd: () => void,
    onCallError: (error: string) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onCallEndCallback = onCallEnd;
    this.onCallErrorCallback = onCallError;
    this.onIceCandidateCallback = onIceCandidate;
  }

  async startCall(callType: 'audio' | 'video'): Promise<MediaStream> {
    try {
      console.log('Starting WebRTC call with type:', callType);
      console.log('navigator.mediaDevices available:', !!navigator.mediaDevices);
      console.log('window.location:', window.location.href);
      console.log('window.location.protocol:', window.location.protocol);
      console.log('Is secure context:', window.isSecureContext);
      
      // 首先尝试基本约束
      const constraints = {
        audio: true,
        video: callType === 'video' ? true : false
      };
      
      console.log('Media constraints:', constraints);

      try {
        console.log('Requesting user media...');
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Media stream obtained successfully');
        console.log('Audio tracks:', this.localStream.getAudioTracks().length);
        console.log('Video tracks:', this.localStream.getVideoTracks().length);
      } catch (error: any) {
        console.error('getUserMedia failed with error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.name === 'NotAllowedError') {
          this.onCallErrorCallback('权限被拒绝。请点击地址栏左侧的锁图标，选择"网站设置"，将摄像头和麦克风权限改为"允许"。或者检查系统设置中的摄像头和麦克风权限。');
          throw new Error('权限被拒绝：请手动启用摄像头和麦克风权限');
        } else if (error.name === 'NotFoundError') {
          this.onCallErrorCallback('未找到摄像头或麦克风设备。请检查设备是否已连接，或尝试其他设备。');
          throw new Error('设备未找到');
        } else if (error.name === 'NotReadableError') {
          this.onCallErrorCallback('设备正被其他应用占用。请关闭其他使用摄像头或麦克风的程序后重试。');
          throw new Error('设备被占用');
        } else if (error.name === 'OverconstrainedError') {
          this.onCallErrorCallback('设备不支持请求的参数。请尝试降低视频质量设置。');
          throw new Error('约束条件无法满足');
        } else {
          this.onCallErrorCallback('无法获取音视频设备。错误：' + error.message);
          throw error;
        }
      }
      
      // 如果还没有peer connection，创建一个
      if (!this.peerConnection) {
        this.createPeerConnection();
      }
      
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      return this.localStream;
    } catch (error) {
      console.error('Failed to start call:', error);
      throw error;
    }
  }

  createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = (event) => {
      if (this.peerConnection) {
        console.log('Connection state:', this.peerConnection.connectionState);
        if (this.peerConnection.connectionState === 'disconnected' || 
            this.peerConnection.connectionState === 'failed') {
          this.endCall();
        }
      }
    };
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    await this.peerConnection!.setRemoteDescription(description);
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    // 只有远程描述还没有设置时才设置
    if (this.peerConnection.remoteDescription === null) {
      await this.peerConnection!.setRemoteDescription(offer);
    }
    
    const answer = await this.peerConnection!.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await this.peerConnection!.setLocalDescription(answer);
    return answer;
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(answer);
  }

  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      await this.peerConnection!.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.currentSession = null;
    this.onCallEndCallback();
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  setCurrentSession(session: CallSession): void {
    this.currentSession = session;
  }

  getCurrentSession(): CallSession | null {
    return this.currentSession;
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  toggleVideo(): boolean {
    if (!this.localStream) return false;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function serializeIceCandidate(candidate: RTCIceCandidate): any {
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex
  };
}

export function deserializeIceCandidate(data: any): RTCIceCandidate {
  return new RTCIceCandidate({
    candidate: data.candidate,
    sdpMid: data.sdpMid,
    sdpMLineIndex: data.sdpMLineIndex
  });
}
