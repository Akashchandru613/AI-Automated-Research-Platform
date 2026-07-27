import client, { parseResponse } from './client';
import {
  ProjectSchema,
  ProjectListResponseSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from '../types/api';

export const createProject = (data: ProjectCreateInput) =>
  parseResponse(ProjectSchema, client.post('/api/projects', data));

export const listProjects = (params?: Record<string, string>) =>
  parseResponse(ProjectListResponseSchema, client.get('/api/projects', { params }));

export const getProject = (id: string) =>
  parseResponse(ProjectSchema, client.get(`/api/projects/${id}`));

export const updateProject = (id: string, data: ProjectUpdateInput) =>
  parseResponse(ProjectSchema, client.put(`/api/projects/${id}`, data));

export const deleteProject = (id: string) => client.delete(`/api/projects/${id}`);
