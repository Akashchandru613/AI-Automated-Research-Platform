import client from './client';

export const createBookmark = (data) => client.post('/api/bookmarks', data);
export const listBookmarks = () => client.get('/api/bookmarks');
export const deleteBookmark = (id) => client.delete(`/api/bookmarks/${id}`);
