import client from './client';

export const uploadFile = (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(`/api/projects/${projectId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listFiles = (projectId) => client.get(`/api/projects/${projectId}/files`);
export const getFilePreview = (fileId) => client.get(`/api/files/${fileId}/preview`);
export const deleteFile = (fileId) => client.delete(`/api/files/${fileId}`);
