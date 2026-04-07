import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { compareExperiments } from '../api/experiments';
import { formatNumber } from '../utils/formatters';
import StatusBadge from '../components/Shared/StatusBadge';
import { ArrowLeft } from 'lucide-react';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const ids = searchParams.get('ids')?.split(',') || [];

  useEffect(() => {
    if (ids.length < 2) { navigate('/'); return; }
    compareExperiments(ids).then(res => { setData(res.data); setLoading(false); }).catch(() => navigate('/'));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!data) return null;

  // Group metrics by name+column for comparison
  const metricMap = {};
  Object.entries(data.metrics).forEach(([expId, metrics]) => {
    metrics.forEach(m => {
      const key = `${m.metric_name}|${m.column_name || 'global'}`;
      if (!metricMap[key]) metricMap[key] = { metric_name: m.metric_name, column_name: m.column_name, category: m.category, values: {} };
      metricMap[key].values[expId] = m.metric_value?.value;
    });
  });

  const comparableMetrics = Object.values(metricMap).filter(m => m.values && Object.keys(m.values).length > 1 && m.category === 'descriptive');

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost"><ArrowLeft size={18} /></button>
          <h1>Compare Experiments</h1>
        </div>
      </div>

      <div className="compare-header">
        {data.experiments.map(exp => (
          <div key={exp.id} className="compare-exp-card">
            <h3>{exp.name || 'Experiment'}</h3>
            <p className="text-muted">{exp.query?.slice(0, 60)}</p>
            <StatusBadge status={exp.status} />
          </div>
        ))}
      </div>

      {comparableMetrics.length > 0 ? (
        <div className="table-wrapper" style={{ marginTop: 20 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Column</th>
                {data.experiments.map(exp => <th key={exp.id}>{exp.name?.slice(0, 20) || 'Exp'}</th>)}
              </tr>
            </thead>
            <tbody>
              {comparableMetrics.map((m, i) => (
                <tr key={i}>
                  <td>{m.metric_name.replace(/_/g, ' ')}</td>
                  <td>{m.column_name || '-'}</td>
                  {data.experiments.map(exp => (
                    <td key={exp.id}>{formatNumber(m.values[exp.id])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted" style={{ marginTop: 20 }}>No comparable metrics found between experiments.</p>
      )}
    </div>
  );
}
