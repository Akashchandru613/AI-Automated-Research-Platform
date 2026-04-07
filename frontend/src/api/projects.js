import client from './client';

export const createProject = (data) => client.post('/api/projects', data);
export const listProjects = (params) => client.get('/api/projects', { params });
export const getProject = (id) => client.get(`/api/projects/${id}`);
export const updateProject = (id, data) => client.put(`/api/projects/${id}`, data);
export const deleteProject = (id) => client.delete(`/api/projects/${id}`);
