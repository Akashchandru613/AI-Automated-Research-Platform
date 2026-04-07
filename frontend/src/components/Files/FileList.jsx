import { FileText, FileSpreadsheet, Trash2, Eye } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function FileList({ files, onPreview, onDelete }) {
  if (!files?.length) return null;

  return (
    <div className="file-list">
      {files.map((file) => (
        <div key={file.id} className="file-item">
          <div className="file-item-icon">
            {file.file_type === 'csv' ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
          </div>
          <div className="file-item-info">
            <span className="file-item-name">{file.filename}</span>
            <span className="file-item-meta">
              {formatBytes(file.file_size_bytes)}
              {file.row_count && ` \u00b7 ${file.row_count} rows`}
              {file.column_names && ` \u00b7 ${file.column_names.length} columns`}
            </span>
          </div>
          <div className="file-item-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => onPreview(file)} title="Preview">
              <Eye size={16} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(file.id)} title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
