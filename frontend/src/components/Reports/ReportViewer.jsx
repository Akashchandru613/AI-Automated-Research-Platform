import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, FileText } from 'lucide-react';

export default function ReportViewer({ report }) {
  const reportRef = useRef();

  if (!report) return <p className="text-muted">No report generated yet</p>;

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save('atlas-report.pdf');
  };

  const downloadMarkdown = () => {
    const blob = new Blob([report.content_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atlas-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="report-actions">
        <button className="btn btn-primary btn-sm" onClick={downloadPDF}>
          <Download size={14} /> Download PDF
        </button>
        <button className="btn btn-secondary btn-sm" onClick={downloadMarkdown}>
          <FileText size={14} /> Download Markdown
        </button>
      </div>
      <div ref={reportRef} className="report-content">
        <ReactMarkdown>{report.content_markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
