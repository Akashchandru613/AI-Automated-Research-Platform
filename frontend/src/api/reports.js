import client from './client';

export const getReport = (experimentId) => client.get(`/api/experiments/${experimentId}/report`);
export const regenerateReport = (experimentId) =>
  client.post(`/api/experiments/${experimentId}/report/regenerate`);
export const getCitations = (experimentId) =>
  client.get(`/api/experiments/${experimentId}/citations`);
