import { formatDuration } from '../../utils/formatters';
import { Bot, CheckCircle, XCircle, Clock } from 'lucide-react';

const AGENT_COLORS = {
  orchestrator: '#6366f1',
  data_cleaning: '#10b981',
  analysis: '#f59e0b',
  summary: '#8b5cf6',
  literature: '#06b6d4',
  report_generator: '#ec4899',
};

export default function AgentTraceTimeline({ trace }) {
  if (!trace || trace.length === 0) return <p className="text-muted">No trace data available</p>;

  return (
    <div className="trace-timeline">
      {trace.map((step, i) => (
        <div key={i} className="trace-step">
          <div className="trace-dot" style={{ backgroundColor: AGENT_COLORS[step.agent] || '#94a3b8' }} />
          <div className="trace-content">
            <div className="trace-header">
              <Bot size={14} />
              <span className="trace-agent">{step.agent?.replace(/_/g, ' ')}</span>
              {step.error ? <XCircle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#10b981" />}
            </div>
            <div className="trace-details">
              {step.duration !== undefined && (
                <span className="trace-meta"><Clock size={12} /> {formatDuration(step.duration)}</span>
              )}
              {step.tasks && <span className="trace-meta">Tasks: {step.tasks.join(', ')}</span>}
              {step.quality_score !== undefined && <span className="trace-meta">Quality: {step.quality_score}/100</span>}
              {step.metrics_computed !== undefined && <span className="trace-meta">Metrics: {step.metrics_computed} columns</span>}
              {step.papers_found !== undefined && <span className="trace-meta">Papers: {step.papers_found}</span>}
              {step.findings_count !== undefined && <span className="trace-meta">Findings: {step.findings_count}</span>}
              {step.skipped && <span className="trace-meta">Skipped: {step.reason}</span>}
              {step.error && <span className="trace-error">{step.error}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
