import client from './client';

export const searchPapers = (query) =>
  client.get('/api/literature/search', { params: { query } });

export const getKnowledgeGraph = (experimentId) =>
  client.get(`/api/experiments/${experimentId}/knowledge-graph`);
