import  { useState } from 'react';

export default function MessageInput() {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    console.log('Sending:', text);
    setText('');
  };

  return (
    <div className="p-6 bg-white shrink-0">
      <div className="bg-gray-50 rounded-2xl p-2 flex items-center border border-gray-100 focus-within:border-gray-200 transition-all shadow-sm">
        {/* 附件图标 */}
        <button className="p-2 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..." 
          className="flex-1 bg-transparent border-none py-3 px-4 text-sm focus:ring-0 outline-none"
        />

        {/* 表情图标 */}
        <button className="p-2 text-gray-400 hover:text-gray-600 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* 发送按钮 */}
        <button 
          onClick={handleSend}
          className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-colors shadow-md disabled:bg-gray-300"
          disabled={!text.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}