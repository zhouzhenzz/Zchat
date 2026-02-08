import request from './request';

/**
 * 上传图片
 */
export const uploadImageApi = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request.post('/api/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.url;
};
