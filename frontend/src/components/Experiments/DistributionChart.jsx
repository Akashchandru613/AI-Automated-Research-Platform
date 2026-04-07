import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DistributionChart({ metrics }) {
  const distMetrics = (metrics || []).filter(m => m.metric_name === 'distribution' && m.column_name);
  const columns = distMetrics.map(m => m.column_name);
  const [selected, setSelected] = useState(columns[0] || '');

  if (columns.length === 0) return <p className="text-muted">No distribution data available</p>;

  const metric = distMetrics.find(m => m.column_name === selected);
  if (!metric?.metric_value?.counts || !metric?.metric_value?.bin_edges) return null;

  const { counts, bin_edges } = metric.metric_value;
  const data = counts.map((count, i) => ({
    range: `${Number(bin_edges[i]).toFixed(1)}`,
    count,
    fullRange: `${Number(bin_edges[i]).toFixed(2)} – ${Number(bin_edges[i + 1]).toFixed(2)}`,
  }));

  return (
    <div>
      <div className="chart-controls">
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <span className="text-muted">{counts.reduce((a, b) => a + b, 0)} total values</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="range" angle={-30} textAnchor="end" fontSize={11} />
          <YAxis fontSize={12} label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: -5 }} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div style={{ background: 'white', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>Range: {d.fullRange}</div>
                <div>Count: {d.count}</div>
              </div>
            );
          }} />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
