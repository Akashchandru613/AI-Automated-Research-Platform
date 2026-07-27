import client, { parseResponse } from './client';
import { BookmarkSchema, BookmarkListSchema, type BookmarkCreateInput } from '../types/api';

export const createBookmark = (data: BookmarkCreateInput) =>
  parseResponse(BookmarkSchema, client.post('/api/bookmarks', data));

export const listBookmarks = () => parseResponse(BookmarkListSchema, client.get('/api/bookmarks'));

export const deleteBookmark = (id: string) => client.delete(`/api/bookmarks/${id}`);
