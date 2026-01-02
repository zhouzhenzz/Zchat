import MessageInput from './MessageInput';

interface ChatWindowProps {
  onMenuClick: () => void;
}

export default function ChatWindow({ onMenuClick }: ChatWindowProps) {
  return (
    <>
      {/* Header */}
      <header className="h-20 px-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center">
          <button onClick={onMenuClick} className="md:hidden mr-4 text-gray-500">☰</button>
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
            <img src="https://i.pravatar.cc/150?u=1" alt="avatar" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Alex Rivera</h3>
            <p className="text-[10px] text-green-500 flex items-center">
              <span className="w-1 h-1 bg-green-500 rounded-full mr-1"></span> 正在线上
            </p>
          </div>
        </div>
      </header>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#fdfdfd]">
        {/* 对方的消息 */}
        <div className="flex items-end space-x-3 max-w-[85%] md:max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
          <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-gray-800 shadow-sm">
            嗨！这是解耦后的 React 组件版本。
          </div>
        </div>
      </div>

      {/* Input */}
      <MessageInput />
    </>
  );
}