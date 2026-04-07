import { useState } from 'react';
import { Copy, Download } from 'lucide-react';

function toBibtex(citation) {
  const key = citation.paper_title?.replace(/\s+/g, '_').slice(0, 20) || 'unknown';
  const authors = citation.authors?.join(' and ') || 'Unknown';
  return `@article{${key}_${citation.year || ''},
  title={${citation.paper_title}},
  author={${authors}},
  year={${citation.year || ''}},
  doi={${citation.doi || ''}}
}`;
}

export default function CitationList({ citations }) {
  const [copied, setCopied] = useState(false);

  if (!citations?.length) return <p className="text-muted">No citations available</p>;

  const allBibtex = citations.map(toBibtex).join('\n\n');

  const copyAll = () => {
    navigator.clipboard.writeText(allBibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBibtex = () => {
    const blob = new Blob([allBibtex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atlas-citations.bib';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="citation-actions">
        <button className="btn btn-secondary btn-sm" onClick={copyAll}>
          <Copy size={14} /> {copied ? 'Copied!' : 'Copy BibTeX'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={downloadBibtex}>
          <Download size={14} /> Download .bib
        </button>
      </div>
      <div className="citation-list">
        {citations.map((c, i) => (
          <div key={i} className="citation-item">
            <span className="citation-number">[{i + 1}]</span>
            <div>
              <span className="citation-title">{c.paper_title}</span>
              {c.authors?.length > 0 && <span className="citation-authors"> - {c.authors.slice(0, 3).join(', ')}</span>}
              {c.year && <span className="citation-year"> ({c.year})</span>}
              {c.relationship_type && <span className={`citation-rel rel-${c.relationship_type}`}>{c.relationship_type}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
