import client from './client';

export const startExperiment = (projectId, data) =>
  client.post(`/api/projects/${projectId}/experiments`, data);

export const startFromTemplate = (projectId, data) =>
  client.post(`/api/projects/${projectId}/experiments/template`, data);

export const listExperiments = (projectId) =>
  client.get(`/api/projects/${projectId}/experiments`);

export const getExperiment = (id) => client.get(`/api/experiments/${id}`);
export const getMetrics = (id) => client.get(`/api/experiments/${id}/metrics`);
export const getExperimentData = (id) => client.get(`/api/experiments/${id}/data`);
export const getTrace = (id) => client.get(`/api/experiments/${id}/trace`);
export const compareExperiments = (ids) =>
  client.get('/api/experiments/compare', { params: { ids: ids.join(',') } });
