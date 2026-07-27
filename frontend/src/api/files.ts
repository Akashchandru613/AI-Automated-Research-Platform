import client, { parseResponse } from './client';
import { FilePreviewSchema, FileUploadSchema, FileUploadListSchema } from '../types/api';

export const uploadFile = (projectId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return parseResponse(
    FileUploadSchema,
    client.post(`/api/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
};

export const listFiles = (projectId: string) =>
  parseResponse(FileUploadListSchema, client.get(`/api/projects/${projectId}/files`));

export const getFilePreview = (fileId: string) =>
  parseResponse(FilePreviewSchema, client.get(`/api/files/${fileId}/preview`));

export const deleteFile = (fileId: string) => client.delete(`/api/files/${fileId}`);
