import client, { parseResponse } from './client';
import { KnowledgeGraphResponseSchema, LiteratureSearchResponseSchema } from '../types/api';

export const searchPapers = (query: string) =>
  parseResponse(LiteratureSearchResponseSchema, client.get('/api/literature/search', { params: { query } }));

export const getKnowledgeGraph = (experimentId: string) =>
  parseResponse(
    KnowledgeGraphResponseSchema,
    client.get(`/api/experiments/${experimentId}/knowledge-graph`),
  );
