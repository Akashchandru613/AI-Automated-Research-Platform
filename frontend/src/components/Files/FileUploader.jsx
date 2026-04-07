import { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { uploadFile } from '../../api/files';

export default function FileUploader({ projectId, onUpload }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'pdf'].includes(ext)) {
        alert('Only CSV and PDF files are supported');
        continue;
      }
      setUploading(true);
      try {
        await uploadFile(projectId, file);
        onUpload?.();
      } catch (err) {
        alert('Upload failed: ' + (err.response?.data?.detail || err.message));
      }
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`file-uploader ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.pdf"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
      <Upload size={32} strokeWidth={1.5} />
      <p>{uploading ? 'Uploading...' : 'Drop CSV or PDF files here, or click to browse'}</p>
      <span className="text-muted">Supports .csv and .pdf files</span>
    </div>
  );
}
