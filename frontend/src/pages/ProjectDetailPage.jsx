import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../api/projects';
import { listFiles, deleteFile, getFilePreview } from '../api/files';
import { listExperiments, startExperiment, startFromTemplate } from '../api/experiments';
import FileUploader from '../components/Files/FileUploader';
import FileList from '../components/Files/FileList';
import TemplateSelector from '../components/Experiments/TemplateSelector';
import StatusBadge from '../components/Shared/StatusBadge';
import { ArrowLeft, X, Play, FlaskConical, GitCompare, Download } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import client from '../api/client';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const fetchAll = () => {
    getProject(id).then(r => setProject(r.data)).catch(() => navigate('/'));
    listFiles(id).then(r => setFiles(r.data));
    listExperiments(id).then(r => setExperiments(r.data));
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handlePreview = async (file) => {
    const { data } = await getFilePreview(file.id);
    setPreview(data);
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Delete this file?')) {
      await deleteFile(fileId);
      fetchAll();
      setPreview(null);
    }
  };

  const handleRunExperiment = async () => {
    if (!query.trim()) return;
    setRunning(true);
    try {
      const { data } = await startExperiment(id, {
        file_upload_id: selectedFile || null,
        query: query.trim(),
        name: query.trim().slice(0, 50),
      });
      setShowRunModal(false);
      setQuery('');
      navigate(`/experiments/${data.id}`);
    } catch (err) {
      alert('Failed to start experiment: ' + (err.response?.data?.detail || err.message));
    }
    setRunning(false);
  };

  const handleTemplate = async (templateType) => {
    if (files.length === 0) { alert('Upload a file first'); return; }
    setRunning(true);
    try {
      const { data } = await startFromTemplate(id, {
        file_upload_id: files.find(f => f.file_type === 'csv')?.id || files[0]?.id || null,
        template_type: templateType,
      });
      navigate(`/experiments/${data.id}`);
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.detail || err.message));
    }
    setRunning(false);
  };

  const toggleCompare = (expId) => {
    setCompareIds(prev =>
      prev.includes(expId) ? prev.filter(x => x !== expId) : [...prev, expId]
    );
  };

  const handleCompare = () => {
    if (compareIds.length >= 2) {
      navigate(`/compare?ids=${compareIds.join(',')}`);
    }
  };

  const handleExport = async () => {
    try {
      const res = await client.get(`/api/projects/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atlas-${project.name.replace(/\s+/g, '_')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  };

  if (!project) return <div className="loading-screen"><div className="spinner" /></div>;

  const completedExps = experiments.filter(e => e.status === 'completed');

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} className="btn btn-ghost"><ArrowLeft size={18} /></button>
          <div>
            <h1>{project.name}</h1>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExport} title="Export as ZIP">
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowRunModal(true)}>
            <Play size={16} /> Run Experiment
          </button>
        </div>
      </div>

      {project.tags?.length > 0 && (
        <div className="tags-list" style={{ marginBottom: 20 }}>
          {project.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
      )}

      <div className="project-sections">
        <section className="section-card">
          <h2>Upload Files</h2>
          <FileUploader projectId={id} onUpload={fetchAll} />
        </section>

        {files.length > 0 && (
          <section className="section-card">
            <h2>Files ({files.length})</h2>
            <FileList files={files} onPreview={handlePreview} onDelete={handleDelete} />
          </section>
        )}

        {preview && (
          <section className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2>Preview: {preview.filename}</h2>
              <button className="btn btn-ghost" onClick={() => setPreview(null)}><X size={18} /></button>
            </div>
            {preview.file_type === 'csv' ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr>{preview.columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
                  <tbody>
                    {preview.rows.slice(0, 30).map((row, i) => (
                      <tr key={i}>{row.map((val, j) => <td key={j}>{val?.toString() ?? ''}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="pdf-preview">
                <p className="text-muted">{preview.page_count} pages</p>
                <pre className="pdf-text">{preview.text}</pre>
              </div>
            )}
          </section>
        )}

        {files.some(f => f.file_type === 'csv') && (
          <section className="section-card">
            <h2>Quick Start Templates</h2>
            <TemplateSelector onSelect={handleTemplate} />
          </section>
        )}

        {experiments.length > 0 && (
          <section className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2>Experiments ({experiments.length})</h2>
              {compareIds.length >= 2 && (
                <button className="btn btn-secondary btn-sm" onClick={handleCompare}>
                  <GitCompare size={14} /> Compare ({compareIds.length})
                </button>
              )}
            </div>
            <div className="experiment-list">
              {experiments.map(exp => (
                <div key={exp.id} className="experiment-item">
                  {completedExps.length >= 2 && (
                    <input
                      type="checkbox"
                      checked={compareIds.includes(exp.id)}
                      onChange={() => toggleCompare(exp.id)}
                      onClick={e => e.stopPropagation()}
                      disabled={exp.status !== 'completed'}
                    />
                  )}
                  <div className="experiment-item-info" onClick={() => navigate(`/experiments/${exp.id}`)} style={{ cursor: 'pointer' }}>
                    <FlaskConical size={16} />
                    <span className="experiment-item-name">{exp.name || 'Experiment'}</span>
                    <span className="text-muted">{exp.query?.slice(0, 80)}</span>
                  </div>
                  <StatusBadge status={exp.status} />
                  <span className="text-muted">{formatDate(exp.created_at)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showRunModal && (
        <div className="modal-overlay" onClick={() => setShowRunModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Run Experiment</h2>
              <button onClick={() => setShowRunModal(false)} className="btn btn-ghost"><X size={20} /></button>
            </div>
            <div className="form-group">
              <label>Select File (optional)</label>
              <select value={selectedFile} onChange={e => setSelectedFile(e.target.value)}>
                <option value="">No file (text query only)</option>
                {files.map(f => <option key={f.id} value={f.id}>{f.filename}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Research Query</label>
              <textarea
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="e.g., Analyze correlations between variables and identify key trends"
                rows={3}
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleRunExperiment} disabled={running || !query.trim()}>
              {running ? 'Starting...' : 'Start Analysis'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
