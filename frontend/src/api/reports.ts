import client, { parseResponse } from './client';
import { CitationListSchema, ReportSchema } from '../types/api';

export const getReport = (experimentId: string) =>
  parseResponse(ReportSchema, client.get(`/api/experiments/${experimentId}/report`));

export const regenerateReport = (experimentId: string) =>
  parseResponse(ReportSchema, client.post(`/api/experiments/${experimentId}/report/regenerate`));

export const getCitations = (experimentId: string) =>
  parseResponse(CitationListSchema, client.get(`/api/experiments/${experimentId}/citations`));
