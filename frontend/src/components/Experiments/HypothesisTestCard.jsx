import { formatPValue, formatNumber } from '../../utils/formatters';

export default function HypothesisTestCard({ metrics }) {
  const tests = metrics.filter(m => m.category === 'inferential' && m.metric_name !== 'correlation_matrix');

  if (tests.length === 0) return <p className="text-muted">No hypothesis tests performed</p>;

  return (
    <div className="hypothesis-cards">
      {tests.map((test, i) => {
        const val = test.metric_value;
        const isSignificant = val.p_value < 0.05;
        return (
          <div key={i} className={`hypothesis-card ${isSignificant ? 'significant' : 'not-significant'}`}>
            <h4>{val.test_name || test.metric_name}</h4>
            {val.column && <p className="text-muted">Column: {val.column}</p>}
            {val.columns && <p className="text-muted">Columns: {val.columns.join(' vs ')}</p>}
            <div className="hypothesis-stats">
              <div>
                <span className="label">Statistic</span>
                <span className="value">{formatNumber(val.statistic, 4)}</span>
              </div>
              <div>
                <span className="label">p-value</span>
                <span className="value">{formatPValue(val.p_value)}</span>
              </div>
            </div>
            <p className="hypothesis-conclusion">{val.conclusion}</p>
          </div>
        );
      })}
    </div>
  );
}
