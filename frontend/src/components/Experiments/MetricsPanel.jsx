import { formatNumber } from '../../utils/formatters';

const DISPLAY_METRICS = ['mean', 'median', 'std_dev', 'min', 'max', 'q1', 'q3', 'skewness', 'kurtosis', 'missing_count', 'unique_count', 'count'];

export default function MetricsPanel({ metrics, onBookmark }) {
  // Group descriptive metrics by column
  const byColumn = {};
  metrics.filter(m => m.category === 'descriptive' && DISPLAY_METRICS.includes(m.metric_name)).forEach(m => {
    if (!m.column_name) return;
    if (!byColumn[m.column_name]) byColumn[m.column_name] = {};
    byColumn[m.column_name][m.metric_name] = m.metric_value?.value;
  });

  const columns = Object.keys(byColumn);
  if (columns.length === 0) return <p className="text-muted">No descriptive metrics available</p>;

  return (
    <div className="metrics-panel">
      {columns.map(col => (
        <div key={col} className="metric-column-card">
          <h4>{col}</h4>
          <div className="metric-grid">
            {DISPLAY_METRICS.map(name => {
              const val = byColumn[col][name];
              if (val === undefined) return null;
              return (
                <div key={name} className="metric-item" onClick={() => onBookmark?.(col, name)}>
                  <span className="metric-label">{name.replace(/_/g, ' ')}</span>
                  <span className="metric-value">{formatNumber(val)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
