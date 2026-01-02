import request from './request';

// 定义后端返回的 UploadResponse 结构
export interface UploadResponse {
  status: string;
  url: string;
  filename: string;
  mimetype: string;
  size: string;
}

/**
 * 上传文件接口
 * 对应 http://127.0.0.1:8000/api/media/upload
 */
export const uploadFileApi = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return request.post<UploadResponse>('/api/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }) as Promise<UploadResponse>;
};