import { useState, useMemo } from 'react';
import { ComposedChart, Scatter, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TrendLineChart({ rawData, metrics }) {
  const trendMetrics = metrics?.filter(m => m.metric_name === 'trend' && m.column_name) || [];
  const columns = trendMetrics.map(m => m.column_name);
  const [selected, setSelected] = useState(columns[0] || '');

  const metric = trendMetrics.find(m => m.column_name === selected);

  const chartData = useMemo(() => {
    if (!rawData?.rows?.length || !selected) return [];
    const colIdx = rawData.columns.indexOf(selected);
    if (colIdx === -1) return [];

    return rawData.rows.map((row, i) => {
      const val = Number(row[colIdx]);
      if (isNaN(val)) return null;
      return { index: i, actual: val };
    }).filter(Boolean);
  }, [rawData, selected]);

  // Add trend line values
  const dataWithTrend = useMemo(() => {
    if (!metric?.metric_value || !chartData.length) return chartData;
    const { slope, intercept } = metric.metric_value;
    return chartData.map(d => ({
      ...d,
      trend: +(intercept + slope * d.index).toFixed(2),
    }));
  }, [chartData, metric]);

  if (columns.length === 0) return <p className="text-muted">No trend data available</p>;

  const { r_squared, direction, slope } = metric?.metric_value || {};

  return (
    <div>
      <div className="chart-controls">
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        {direction && (
          <span className="trend-badge" data-direction={direction}>
            {direction} {r_squared !== undefined && `(R\u00b2 = ${r_squared})`}
          </span>
        )}
      </div>
      {dataWithTrend.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={dataWithTrend} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="index" fontSize={12} label={{ value: 'Row index', position: 'bottom', offset: 0 }} />
            <YAxis fontSize={12} label={{ value: selected, angle: -90, position: 'insideLeft', offset: -5 }} />
            <Tooltip formatter={(val) => val?.toFixed(2)} />
            <Scatter dataKey="actual" fill="#6366f1" fillOpacity={0.5} r={3} name="Actual" />
            <Line dataKey="trend" stroke="#ef4444" strokeWidth={2} dot={false} name="Trend line" />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-muted">Select a column to view trend</p>
      )}
    </div>
  );
}
