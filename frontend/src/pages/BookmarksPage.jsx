import { useState, useEffect } from 'react';
import { listBookmarks, deleteBookmark } from '../api/bookmarks';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, FlaskConical } from 'lucide-react';
import EmptyState from '../components/Shared/EmptyState';
import { formatDate } from '../utils/formatters';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = () => listBookmarks().then(r => { setBookmarks(r.data); setLoading(false); });
  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id) => {
    await deleteBookmark(id);
    fetch();
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header"><h1>Bookmarks</h1></div>

      {bookmarks.length === 0 ? (
        <EmptyState icon={Bookmark} title="No bookmarks yet" description="Click on any metric in an experiment to bookmark it." />
      ) : (
        <div className="bookmark-list">
          {bookmarks.map(b => (
            <div key={b.id} className="bookmark-item">
              <div className="bookmark-info" onClick={() => navigate(`/experiments/${b.experiment_id}`)}>
                <FlaskConical size={16} />
                <span className="bookmark-metric">{b.metric_name || 'General'}</span>
                {b.note && <span className="text-muted">{b.note}</span>}
                <span className="text-muted">{formatDate(b.created_at)}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(b.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
