import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExperiment, getMetrics, getTrace, getExperimentData } from '../api/experiments';
import { getReport, getCitations } from '../api/reports';
import StatusBadge from '../components/Shared/StatusBadge';
import MetricsPanel from '../components/Experiments/MetricsPanel';
import CorrelationHeatmap from '../components/Experiments/CorrelationHeatmap';
import DistributionChart from '../components/Experiments/DistributionChart';
import TrendLineChart from '../components/Experiments/TrendLineChart';
import HypothesisTestCard from '../components/Experiments/HypothesisTestCard';
import CustomChartBuilder from '../components/Experiments/CustomChartBuilder';
import AgentTraceTimeline from '../components/Experiments/AgentTraceTimeline';
import ChatPanel from '../components/Chat/ChatPanel';
import KnowledgeGraph from '../components/Literature/KnowledgeGraph';
import CitationList from '../components/Literature/CitationList';
import ReportViewer from '../components/Reports/ReportViewer';
import { createBookmark } from '../api/bookmarks';
import { ArrowLeft, BarChart3, GitBranch, MessageSquare, BookOpen, FileText, PieChart } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export default function ExperimentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [trace, setTrace] = useState([]);
  const [report, setReport] = useState(null);
  const [citations, setCitations] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    let interval;
    const fetchData = async () => {
      try {
        const { data: exp } = await getExperiment(id);
        setExperiment(exp);

        if (exp.status === 'completed') {
          const [metricsRes, traceRes, reportRes, citationsRes, dataRes] = await Promise.all([
            getMetrics(id),
            getTrace(id),
            getReport(id).catch(() => ({ data: null })),
            getCitations(id).catch(() => ({ data: [] })),
            getExperimentData(id).catch(() => ({ data: null })),
          ]);
          setMetrics(metricsRes.data);
          setTrace(traceRes.data.agent_trace || []);
          setReport(reportRes.data);
          setCitations(Array.isArray(citationsRes.data) ? citationsRes.data : []);
          setRawData(dataRes.data);
          if (interval) clearInterval(interval);
        } else if (exp.status === 'failed') {
          if (interval) clearInterval(interval);
        }
      } catch {
        navigate('/');
      }
    };

    fetchData();
    interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleBookmark = async (col, metric) => {
    try {
      await createBookmark({ experiment_id: id, metric_name: `${col}.${metric}`, note: '' });
      alert('Bookmarked!');
    } catch { alert('Failed to bookmark'); }
  };

  if (!experiment) return <div className="loading-screen"><div className="spinner" /></div>;

  const tabs = [
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'charts', label: 'Charts', icon: PieChart },
    { id: 'trace', label: 'Agent Trace', icon: GitBranch },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'literature', label: 'Literature', icon: BookOpen },
    { id: 'report', label: 'Report', icon: FileText },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost"><ArrowLeft size={18} /></button>
          <div>
            <h1>{experiment.name || 'Experiment'}</h1>
            <p className="page-subtitle">
              {experiment.query}
              {' '}<StatusBadge status={experiment.status} />
              {experiment.created_at && ` · ${formatDate(experiment.created_at)}`}
            </p>
          </div>
        </div>
      </div>

      {experiment.status === 'running' && (
        <div className="running-banner">
          <div className="spinner" style={{ width: 20, height: 20 }} />
          <span>Analysis in progress... Agents are working on your data.</span>
        </div>
      )}

      {experiment.status === 'failed' && (
        <div className="error-message">{experiment.error_message || 'Experiment failed'}</div>
      )}

      {experiment.status === 'completed' && (
        <>
          <div className="tab-bar">
            {tabs.map(tab => (
              <button key={tab.id} className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'metrics' && (
              <div className="metrics-sections">
                <section className="section-card">
                  <h2>Descriptive Statistics</h2>
                  <MetricsPanel metrics={metrics} onBookmark={handleBookmark} />
                </section>
                <section className="section-card">
                  <h2>Correlation Matrix</h2>
                  <CorrelationHeatmap metrics={metrics} />
                </section>
                <section className="section-card">
                  <h2>Distributions</h2>
                  <DistributionChart metrics={metrics} />
                </section>
                <section className="section-card">
                  <h2>Trends</h2>
                  <TrendLineChart rawData={rawData} metrics={metrics} />
                </section>
                <section className="section-card">
                  <h2>Hypothesis Tests</h2>
                  <HypothesisTestCard metrics={metrics} />
                </section>
              </div>
            )}
            {activeTab === 'charts' && (
              <section className="section-card">
                <h2>Custom Chart Builder</h2>
                <CustomChartBuilder rawData={rawData} />
              </section>
            )}
            {activeTab === 'trace' && (
              <section className="section-card">
                <h2>Agent Execution Timeline</h2>
                <AgentTraceTimeline trace={trace} />
              </section>
            )}
            {activeTab === 'chat' && (
              <section className="section-card">
                <h2>Chat with Your Data</h2>
                <ChatPanel experimentId={id} />
              </section>
            )}
            {activeTab === 'literature' && (
              <div className="metrics-sections">
                <section className="section-card">
                  <h2>Knowledge Graph</h2>
                  <KnowledgeGraph experimentId={id} />
                </section>
                <section className="section-card">
                  <h2>Citations</h2>
                  <CitationList citations={citations} />
                </section>
              </div>
            )}
            {activeTab === 'report' && (
              <section className="section-card">
                <h2>Generated Report</h2>
                <ReportViewer report={report} />
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
