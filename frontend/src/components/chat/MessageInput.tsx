import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function MessageInput() {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { activePeerId, sendMessage, socket } = useChatStore();
  const { token } = useAuthStore();
  
  // 修复：使用环境变量，避免硬编码导致上传失败
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  const handleSend = () => {
    if (!text.trim() || !activePeerId || !socket) return;
    sendMessage(activePeerId, text, "text");
    setText('');
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePeerId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/media/upload`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // 图片上传成功后，通过 WS 发送图片消息
      sendMessage(activePeerId, res.data.url, "image");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("图片上传失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 检查连接状态
  const isConnected = socket?.readyState === WebSocket.OPEN;

  return (
    <div className="p-6 bg-white border-t border-gray-50">
      <div className={`bg-gray-50 rounded-2xl p-2 flex items-center border transition-all ${
        !isConnected ? 'opacity-60 cursor-not-allowed border-gray-200' : 'border-gray-100 focus-within:border-gray-200 shadow-sm'
      }`}>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={onFileChange} 
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !isConnected}
          className="p-2 text-gray-400 hover:text-black transition-colors disabled:cursor-not-allowed"
          title="发送图片"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={!isConnected ? "正在连接服务器..." : activePeerId ? "输入消息..." : "请选择一个对话"} 
          disabled={!activePeerId || !isConnected}
          className="flex-1 bg-transparent border-none py-3 px-4 text-sm focus:ring-0 outline-none disabled:cursor-not-allowed"
        />

        <button 
          onClick={handleSend}
          disabled={!text.trim() || !activePeerId || !isConnected}
          className="bg-black text-white p-3 rounded-xl hover:opacity-80 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}