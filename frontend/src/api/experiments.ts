import client, { parseResponse } from './client';
import {
  CompareResponseSchema,
  ExperimentSchema,
  ExperimentListSchema,
  ExperimentRawDataSchema,
  MetricListSchema,
  TraceResponseSchema,
  type ExperimentCreateInput,
  type ExperimentTemplateCreateInput,
} from '../types/api';

export const startExperiment = (projectId: string, data: ExperimentCreateInput) =>
  parseResponse(ExperimentSchema, client.post(`/api/projects/${projectId}/experiments`, data));

export const startFromTemplate = (projectId: string, data: ExperimentTemplateCreateInput) =>
  parseResponse(ExperimentSchema, client.post(`/api/projects/${projectId}/experiments/template`, data));

export const listExperiments = (projectId: string) =>
  parseResponse(ExperimentListSchema, client.get(`/api/projects/${projectId}/experiments`));

export const getExperiment = (id: string) =>
  parseResponse(ExperimentSchema, client.get(`/api/experiments/${id}`));

export const getMetrics = (id: string) =>
  parseResponse(MetricListSchema, client.get(`/api/experiments/${id}/metrics`));

export const getExperimentData = (id: string) =>
  parseResponse(ExperimentRawDataSchema, client.get(`/api/experiments/${id}/data`));

export const getTrace = (id: string) =>
  parseResponse(TraceResponseSchema, client.get(`/api/experiments/${id}/trace`));

export const compareExperiments = (ids: string[]) =>
  parseResponse(
    CompareResponseSchema,
    client.get('/api/experiments/compare', { params: { ids: ids.join(',') } }),
  );
