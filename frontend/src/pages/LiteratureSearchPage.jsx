import { useState } from 'react';
import { searchPapers } from '../api/literature';
import PaperCard from '../components/Literature/PaperCard';
import { Search } from 'lucide-react';

export default function LiteratureSearchPage() {
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await searchPapers(query);
      setPapers(data.papers);
    } catch {
      alert('Search failed');
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Literature Search</h1>
      </div>
      <p className="page-subtitle" style={{ marginBottom: 20 }}>Search academic papers via Semantic Scholar</p>

      <div className="search-bar-large">
        <Search size={20} />
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search for papers, topics, or authors..."
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <div className="loading-screen"><div className="spinner" /></div>}

      {!loading && papers.length > 0 && (
        <div className="papers-list">
          {papers.map((paper, i) => <PaperCard key={i} paper={paper} />)}
        </div>
      )}

      {!loading && searched && papers.length === 0 && (
        <p className="text-muted" style={{ textAlign: 'center', marginTop: 40 }}>No papers found. Try different keywords.</p>
      )}
    </div>
  );
}
