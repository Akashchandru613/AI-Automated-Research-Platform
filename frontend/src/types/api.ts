import { z } from 'zod';

// Single source of truth for the API contract.
//
// These zod schemas mirror the backend's Pydantic schemas (backend/app/schemas)
// and the ad-hoc dict responses returned by the routers (backend/app/routers).
// Every TypeScript type below is *inferred* from its schema via `z.infer`, so the
// compile-time types and the runtime validators can never drift apart. The api
// layer (src/api) validates responses against these schemas at runtime.
//
// IDs and timestamps are serialized as strings over JSON, so they are modeled as
// `z.string()` rather than stricter `.uuid()` / `.datetime()` refinements — this
// keeps validation faithful to what the backend actually sends and avoids noisy
// false negatives.

export const ExperimentStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);
export type ExperimentStatus = z.infer<typeof ExperimentStatusSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  created_at: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  file_count: z.number(),
  experiment_count: z.number(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSchema),
  total: z.number(),
});
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;

export interface ProjectCreateInput {
  name: string;
  description?: string | null;
  tags?: string[] | null;
}

export type ProjectUpdateInput = Partial<ProjectCreateInput>;

export const FileUploadSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  filename: z.string(),
  file_type: z.string(),
  file_size_bytes: z.number().nullable(),
  row_count: z.number().nullable(),
  column_names: z.array(z.string()).nullable(),
  uploaded_at: z.string(),
});
export type FileUpload = z.infer<typeof FileUploadSchema>;

export const FileUploadListSchema = z.array(FileUploadSchema);

export const FilePreviewSchema = z.object({
  file_type: z.string(),
  filename: z.string(),
  columns: z.array(z.string()).nullish(),
  rows: z.array(z.array(z.unknown())).nullish(),
  dtypes: z.record(z.string(), z.string()).nullish(),
  text: z.string().nullish(),
  page_count: z.number().nullish(),
});
export type FilePreview = z.infer<typeof FilePreviewSchema>;

export const ExperimentSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  file_upload_id: z.string().nullable(),
  name: z.string().nullable(),
  query: z.string().nullable(),
  template_type: z.string().nullable(),
  status: ExperimentStatusSchema,
  error_message: z.string().nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
});
export type Experiment = z.infer<typeof ExperimentSchema>;

export const ExperimentListSchema = z.array(ExperimentSchema);

export interface ExperimentCreateInput {
  file_upload_id?: string | null;
  name?: string | null;
  query: string;
}

export interface ExperimentTemplateCreateInput {
  file_upload_id?: string | null;
  template_type: string;
  query?: string | null;
}

export const MetricSchema = z.object({
  id: z.string(),
  experiment_id: z.string(),
  metric_name: z.string(),
  metric_value: z.record(z.string(), z.unknown()),
  column_name: z.string().nullable(),
  category: z.string().nullable(),
});
export type Metric = z.infer<typeof MetricSchema>;

export const MetricListSchema = z.array(MetricSchema);

export const TraceStepSchema = z.object({ agent: z.string() }).catchall(z.unknown());
export type TraceStep = z.infer<typeof TraceStepSchema>;

export const TraceResponseSchema = z.object({
  experiment_id: z.string(),
  agent_trace: z.array(TraceStepSchema).nullable(),
});
export type TraceResponse = z.infer<typeof TraceResponseSchema>;

export const ExperimentRawDataSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.unknown())),
  dtypes: z.record(z.string(), z.string()),
});
export type ExperimentRawData = z.infer<typeof ExperimentRawDataSchema>;

export const CompareResponseSchema = z.object({
  experiments: z.array(ExperimentSchema),
  metrics: z.record(z.string(), z.array(MetricSchema)),
});
export type CompareResponse = z.infer<typeof CompareResponseSchema>;

export const BookmarkSchema = z.object({
  id: z.string(),
  experiment_id: z.string(),
  metric_name: z.string().nullable(),
  note: z.string().nullable(),
  created_at: z.string().optional(),
});
export type Bookmark = z.infer<typeof BookmarkSchema>;

export const BookmarkListSchema = z.array(BookmarkSchema);

export interface BookmarkCreateInput {
  experiment_id: string;
  metric_name?: string | null;
  note?: string | null;
}

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  created_at: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatHistorySchema = z.array(ChatMessageSchema);

export const ReportSchema = z.object({
  id: z.string(),
  experiment_id: z.string(),
  title: z.string().nullable(),
  content_markdown: z.string(),
  summary: z.string().nullable(),
  generated_at: z.string(),
});
export type Report = z.infer<typeof ReportSchema>;

export const CitationSchema = z.object({
  id: z.string(),
  paper_title: z.string(),
  authors: z.array(z.string()).nullable(),
  year: z.number().nullable(),
  doi: z.string().nullable(),
  url: z.string().nullable(),
  relevance_score: z.number().nullable(),
  relationship_type: z.string().nullable(),
});
export type Citation = z.infer<typeof CitationSchema>;

export const CitationListSchema = z.array(CitationSchema);

export const LiteraturePaperSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()),
  year: z.number().nullable(),
  abstract: z.string(),
  url: z.string(),
  doi: z.string().nullable(),
  citation_count: z.number(),
});
export type LiteraturePaper = z.infer<typeof LiteraturePaperSchema>;

export const LiteratureSearchResponseSchema = z.object({
  papers: z.array(LiteraturePaperSchema),
  query: z.string(),
});
export type LiteratureSearchResponse = z.infer<typeof LiteratureSearchResponseSchema>;

export const KnowledgeGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['experiment', 'paper', 'concept']),
  size: z.number(),
  year: z.number().nullish(),
  authors: z.array(z.string()).nullish(),
});
export type KnowledgeGraphNode = z.infer<typeof KnowledgeGraphNodeSchema>;

export const KnowledgeGraphLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string(),
});
export type KnowledgeGraphLink = z.infer<typeof KnowledgeGraphLinkSchema>;

export const KnowledgeGraphResponseSchema = z.object({
  nodes: z.array(KnowledgeGraphNodeSchema),
  links: z.array(KnowledgeGraphLinkSchema),
});
export type KnowledgeGraphResponse = z.infer<typeof KnowledgeGraphResponseSchema>;
