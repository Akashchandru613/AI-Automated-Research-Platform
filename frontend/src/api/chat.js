import client from './client';

export const sendMessage = (experimentId, message) =>
  client.post(`/api/experiments/${experimentId}/chat`, { message });

export const getChatHistory = (experimentId) =>
  client.get(`/api/experiments/${experimentId}/chat/history`);
