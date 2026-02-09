import React, { useState } from 'react';
import { useMomentStore } from '@/store/useMomentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { uploadImageApi } from '@/api/media';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModal({ isOpen, onClose }: PostModalProps) {
  const { user } = useAuthStore();
  const { createMoment, posting } = useMomentStore();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || images.length >= 9) return;

    setUploading(true);
    try {
      const newImages: string[] = [...images];
      
      for (let i = 0; i < files.length && newImages.length < 9; i++) {
        const file = files[i];
        const url = await uploadImageApi(file);
        newImages.push(url);
      }

      setImages(newImages);
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 处理发布
  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      alert('请输入内容或上传图片');
      return;
    }

    await createMoment({
      content: content.trim(),
      images
    });

    // 重置表单
    setContent('');
    setImages([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-xl sm:rounded-[3.5rem] rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-500 flex flex-col">
        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black italic tracking-tighter">New Moment</h3>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 用户信息和发布按钮 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url.startsWith('http') ? user.avatar_url : `http://127.0.0.1:8000${user.avatar_url}`}
                  alt={user.username} 
                  className="w-10 h-10 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-4">
                  {user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h4 className="font-bold text-black">{user?.username}</h4>
                <p className="text-xs text-gray-400">分享你的想法...</p>
              </div>
            </div>
            <button 
              onClick={handlePost}
              disabled={posting || uploading}
              className={`bg-black text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors ${
                (posting || uploading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {posting ? '发布中...' : 'Publish'}
            </button>
          </div>

          {/* 内容输入 */}
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="这一刻的想法..."
            className="w-full h-32 bg-transparent border-none focus:ring-0 text-lg font-light placeholder:text-gray-300 resize-none p-0 leading-relaxed mb-6"
            autoFocus
          />

          {/* 图片预览 */}
          {images.length > 0 && (
            <div className="mb-6">
              <div className="max-h-48 overflow-y-auto pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                      <img 
                        src={image.startsWith('http') ? image : `http://127.0.0.1:8000${image}`}
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 图片上传 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <label 
              htmlFor="image-upload"
              className="aspect-square bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 transition-all border-2 border-dashed border-gray-200 hover:border-gray-300 cursor-pointer"
            >
              <input 
                type="file" 
                id="image-upload" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading || images.length >= 9}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest">
                {uploading ? '上传中...' : `${images.length}/9`}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
