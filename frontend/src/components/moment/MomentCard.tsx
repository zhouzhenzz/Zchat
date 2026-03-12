import { useState } from 'react';

import { useMomentStore } from '@/store/useMomentStore';
import { useAuthStore } from '@/store/useAuthStore';

import type { MomentResponse } from '@/types/moment';

interface MomentCardProps {
  moment: MomentResponse;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function MomentCard({ moment }: MomentCardProps) {
  const { user } = useAuthStore();
  const { toggleLike, addComment, deleteMoment } = useMomentStore();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  // 处理点赞
  const handleLike = async () => {
    await toggleLike(moment.id);
  };

  // 处理评论
  const handleComment = async () => {
    if (commentText.trim()) {
      await addComment(moment.id, commentText.trim());
      setCommentText('');
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (window.confirm('确定要删除这条动态吗？')) {
      await deleteMoment(moment.id);
    }
  };

  // 检查是否已点赞
  const isLiked = moment.likes.some((like) => like.user_id === user?.id);

  // 处理图片路径
  const getFullImageUrl = (imageUrl: string | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  };

  return (
    <article className="flex space-x-6 mb-16">
      <div className="shrink-0">
        {moment.avatar ? (
          <img 
            src={getFullImageUrl(moment.avatar)}
            alt={moment.username} 
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
            {moment.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-black font-bold text-base">{moment.username}</h4>
          {moment.user_id === user?.id && (
            <button 
              onClick={handleDelete}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              删除
            </button>
          )}
        </div>
        
        {moment.content && (
          <p className="text-base text-gray-800 leading-relaxed mb-4 max-w-3xl">
            {moment.content}
          </p>
        )}

        {/* 图片网格 */}
        {moment.images && moment.images.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            moment.images.length === 1 ? 'grid-cols-1' :
            moment.images.length === 2 ? 'grid-cols-2' :
            moment.images.length <= 4 ? 'grid-cols-2 lg:grid-cols-2' :
            'grid-cols-3'
          }`}>
            {moment.images.map((image: string, index: number) => (
              <div key={index} className="aspect-square overflow-hidden rounded-lg group cursor-zoom-in">
                <img 
                  src={getFullImageUrl(image)}
                  alt={`Image ${index + 1}`} 
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
              </div>
            ))}
          </div>
        )}

        {/* 底部交互 */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-xs text-gray-400">
            {new Date(moment.created_at).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <div className="flex space-x-6">
            <button 
              onClick={handleLike}
              className={`flex items-center transition-colors ${
                isLiked ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs">{moment.likes.length}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs">{moment.comments.length}</span>
            </button>
          </div>
        </div>

        {/* 评论区 */}
        {showComments && (
          <div className="mt-4 space-y-4">
            {/* 评论列表 */}
            {moment.comments.length > 0 ? (
              moment.comments.map((comment, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                    {comment.avatar ? (
                      <img 
                        src={getFullImageUrl(comment.avatar)}
                        alt={comment.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black">{comment.username}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(comment.created_at).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">暂无评论</p>
            )}

            {/* 评论输入 */}
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE_URL}${user.avatar_url}`}
                    alt={user.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="写下你的评论..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                    commentText.trim() 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
