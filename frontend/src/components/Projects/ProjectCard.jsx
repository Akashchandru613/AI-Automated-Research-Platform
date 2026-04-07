import { useNavigate } from 'react-router-dom';
import { Folder, FileText, FlaskConical, Trash2 } from 'lucide-react';

export default function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
      <div className="project-card-header">
        <Folder size={20} />
        <h3>{project.name}</h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
          title="Delete project"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {project.description && <p className="project-card-desc">{project.description}</p>}
      <div className="project-card-stats">
        <span><FileText size={14} /> {project.file_count} files</span>
        <span><FlaskConical size={14} /> {project.experiment_count} experiments</span>
      </div>
      {project.tags?.length > 0 && (
        <div className="tags-list">
          {project.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
