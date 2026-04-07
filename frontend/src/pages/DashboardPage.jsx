import { useState, useEffect } from 'react';
import { listProjects, createProject, deleteProject } from '../api/projects';
import ProjectCard from '../components/Projects/ProjectCard';
import CreateProjectModal from '../components/Projects/CreateProjectModal';
import EmptyState from '../components/Shared/EmptyState';
import { Plus, Search, FolderOpen } from 'lucide-react';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const fetchProjects = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (tagFilter) params.tag = tagFilter;
      const { data } = await listProjects(params);
      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [search, tagFilter]);

  const handleCreate = async (data) => {
    await createProject(data);
    setShowModal(false);
    fetchProjects();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project and all its data?')) {
      await deleteProject(id);
      fetchProjects();
    }
  };

  const allTags = [...new Set(projects.flatMap((p) => p.tags || []))];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Research Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input">
          <Search size={16} />
          <input
            type="text" placeholder="Search projects..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {allTags.length > 0 && (
          <div className="tag-filters">
            <button
              className={`tag ${!tagFilter ? 'tag-active' : ''}`}
              onClick={() => setTagFilter('')}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tag ${tagFilter === tag ? 'tag-active' : ''}`}
                onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first research project to get started with AI-powered analysis."
          action={
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={18} /> Create Project
            </button>
          }
        />
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
