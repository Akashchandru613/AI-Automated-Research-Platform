import { FlaskConical, GitCompare, ClipboardList, TrendingUp } from 'lucide-react';

const TEMPLATES = [
  { id: 'eda', label: 'Exploratory Data Analysis', icon: FlaskConical, desc: 'Full statistical overview of your dataset' },
  { id: 'ab_test', label: 'A/B Test Analysis', icon: GitCompare, desc: 'Compare groups and test significance' },
  { id: 'survey', label: 'Survey Analysis', icon: ClipboardList, desc: 'Analyze response distributions and demographics' },
  { id: 'correlation', label: 'Correlation Study', icon: TrendingUp, desc: 'Find variable relationships and significance' },
];

export default function TemplateSelector({ onSelect }) {
  return (
    <div className="template-grid">
      {TEMPLATES.map(t => (
        <button key={t.id} className="template-card" onClick={() => onSelect(t.id)}>
          <t.icon size={24} />
          <h4>{t.label}</h4>
          <p>{t.desc}</p>
        </button>
      ))}
    </div>
  );
}
