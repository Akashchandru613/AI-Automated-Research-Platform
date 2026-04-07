import { useEffect, useState } from 'react';
import { getKnowledgeGraph } from '../../api/literature';

const NODE_COLORS = {
  experiment: '#6366f1',
  paper: '#10b981',
  concept: '#f59e0b',
};

export default function KnowledgeGraph({ experimentId }) {
  const [graphData, setGraphData] = useState(null);
  const [ForceGraph, setForceGraph] = useState(null);

  useEffect(() => {
    getKnowledgeGraph(experimentId).then(res => setGraphData(res.data)).catch(() => {});
  }, [experimentId]);

  useEffect(() => {
    import('react-force-graph-2d').then(mod => setForceGraph(() => mod.default));
  }, []);

  if (!graphData || !ForceGraph) return <p className="text-muted">Loading knowledge graph...</p>;
  if (graphData.nodes.length === 0) return <p className="text-muted">No graph data available</p>;

  return (
    <div className="knowledge-graph" style={{ height: 400, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <ForceGraph
        graphData={graphData}
        nodeLabel="label"
        nodeColor={node => NODE_COLORS[node.type] || '#94a3b8'}
        nodeVal={node => node.size || 10}
        linkLabel="relationship"
        linkColor={() => '#cbd5e1'}
        linkDirectionalArrowLength={4}
        width={600}
        height={400}
        backgroundColor="white"
      />
    </div>
  );
}
