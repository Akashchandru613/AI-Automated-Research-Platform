const STATUS_STYLES = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  running: { bg: '#dbeafe', color: '#1e40af', label: 'Running' },
  completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  failed: { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
      {style.label}
    </span>
  );
}
