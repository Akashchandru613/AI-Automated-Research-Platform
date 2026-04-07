import { ExternalLink, Users, Calendar } from 'lucide-react';

export default function PaperCard({ paper }) {
  return (
    <div className="paper-card">
      <h4>
        {paper.url ? (
          <a href={paper.url} target="_blank" rel="noopener noreferrer">
            {paper.title} <ExternalLink size={14} />
          </a>
        ) : paper.title}
      </h4>
      <div className="paper-meta">
        {paper.authors?.length > 0 && (
          <span><Users size={12} /> {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
        )}
        {paper.year && <span><Calendar size={12} /> {paper.year}</span>}
        {paper.citation_count > 0 && <span>{paper.citation_count} citations</span>}
      </div>
      {paper.abstract && <p className="paper-abstract">{paper.abstract}</p>}
      {paper.doi && <span className="paper-doi">DOI: {paper.doi}</span>}
    </div>
  );
}
