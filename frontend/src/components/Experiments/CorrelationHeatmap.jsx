import { formatNumber } from '../../utils/formatters';

function getColor(value) {
  if (value === null || value === undefined) return '#f1f5f9';
  if (value >= 0.7) return '#1e40af';
  if (value >= 0.3) return '#3b82f6';
  if (value >= 0) return '#93c5fd';
  if (value >= -0.3) return '#fca5a5';
  if (value >= -0.7) return '#ef4444';
  return '#991b1b';
}

export default function CorrelationHeatmap({ metrics }) {
  const corrMetric = (metrics || []).find(m => m.metric_name === 'correlation_matrix');
  if (!corrMetric?.metric_value) return <p className="text-muted">No correlation data available</p>;

  const { columns, matrix } = corrMetric.metric_value;
  if (!columns?.length || !matrix?.length) return <p className="text-muted">No correlation data available</p>;

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-scroll">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th></th>
              {columns.map(col => <th key={col} title={col}>{col.length > 12 ? col.slice(0, 10) + '..' : col}</th>)}
            </tr>
          </thead>
          <tbody>
            {columns.map((row, i) => (
              <tr key={row}>
                <td className="heatmap-label" title={row}>{row.length > 12 ? row.slice(0, 10) + '..' : row}</td>
                {(matrix[i] || []).map((val, j) => (
                  <td
                    key={j}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(val), color: Math.abs(val) > 0.5 ? 'white' : '#1e293b' }}
                    title={`${row} vs ${columns[j]}: ${val}`}
                  >
                    {formatNumber(val, 2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="heatmap-legend">
        <span style={{ color: '#991b1b' }}>-1.0</span>
        <div className="heatmap-gradient" />
        <span style={{ color: '#1e40af' }}>+1.0</span>
      </div>
    </div>
  );
}
