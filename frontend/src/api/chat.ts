import client, { parseResponse } from './client';
import { ChatMessageSchema, ChatHistorySchema } from '../types/api';

export const sendMessage = (experimentId: string, message: string) =>
  parseResponse(ChatMessageSchema, client.post(`/api/experiments/${experimentId}/chat`, { message }));

export const getChatHistory = (experimentId: string) =>
  parseResponse(ChatHistorySchema, client.get(`/api/experiments/${experimentId}/chat/history`));
