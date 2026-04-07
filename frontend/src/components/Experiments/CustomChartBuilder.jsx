import { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import html2canvas from 'html2canvas';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function CustomChartBuilder({ rawData }) {
  const [chartType, setChartType] = useState('scatter');
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [groupCol, setGroupCol] = useState('');
  const [pubMode, setPubMode] = useState(false);
  const chartRef = useRef();

  const columns = rawData?.columns || [];
  const numericCols = useMemo(() => {
    if (!rawData?.rows?.length || !rawData?.dtypes) return columns;
    return columns.filter(c => {
      const dtype = rawData.dtypes[c] || '';
      return dtype.includes('int') || dtype.includes('float');
    });
  }, [rawData, columns]);

  const categoricalCols = useMemo(() => {
    return columns.filter(c => !numericCols.includes(c));
  }, [columns, numericCols]);

  // Build row objects from rawData
  const rowObjects = useMemo(() => {
    if (!rawData?.rows?.length) return [];
    return rawData.rows.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }, [rawData, columns]);

  // For bar/pie: aggregate by group column
  const aggregatedData = useMemo(() => {
    if (!groupCol || !yCol || !rowObjects.length) return [];
    const groups = {};
    rowObjects.forEach(row => {
      const key = String(row[groupCol] ?? 'Unknown');
      if (!groups[key]) groups[key] = { name: key, values: [] };
      const val = Number(row[yCol]);
      if (!isNaN(val)) groups[key].values.push(val);
    });
    return Object.values(groups).map(g => ({
      name: g.name,
      [yCol]: g.values.length ? +(g.values.reduce((a, b) => a + b, 0) / g.values.length).toFixed(2) : 0,
      count: g.values.length,
    }));
  }, [groupCol, yCol, rowObjects]);

  const exportPNG = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = `atlas-chart-${chartType}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!rawData?.rows?.length) return <p className="text-muted">No dataset available for charting</p>;

  const chartStyle = pubMode ? { fontFamily: 'Georgia, serif', background: 'white', padding: 16 } : { padding: 8 };
  const showScatterLine = chartType === 'scatter' || chartType === 'line';
  const showGrouped = chartType === 'bar' || chartType === 'pie';

  return (
    <div className="chart-builder">
      <div className="chart-controls">
        <select value={chartType} onChange={e => setChartType(e.target.value)}>
          <option value="scatter">Scatter Plot</option>
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart (grouped avg)</option>
          <option value="pie">Pie Chart (grouped count)</option>
        </select>

        {showScatterLine && (
          <>
            <select value={xCol} onChange={e => setXCol(e.target.value)}>
              <option value="">X axis</option>
              {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={yCol} onChange={e => setYCol(e.target.value)}>
              <option value="">Y axis</option>
              {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}

        {showGrouped && (
          <>
            <select value={groupCol} onChange={e => setGroupCol(e.target.value)}>
              <option value="">Group by</option>
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={yCol} onChange={e => setYCol(e.target.value)}>
              <option value="">Value column</option>
              {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}

        <label className="toggle-label">
          <input type="checkbox" checked={pubMode} onChange={e => setPubMode(e.target.checked)} />
          Publication mode
        </label>
        <button className="btn btn-secondary btn-sm" onClick={exportPNG}>Export PNG</button>
      </div>

      <div ref={chartRef} style={chartStyle} className="chart-area">
        {chartType === 'scatter' && xCol && yCol && (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
              {!pubMode && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey="x" name={xCol} type="number" fontSize={12} label={{ value: xCol, position: 'bottom', offset: 20 }} />
              <YAxis dataKey="y" name={yCol} type="number" fontSize={12} label={{ value: yCol, angle: -90, position: 'insideLeft', offset: -5 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val) => val?.toFixed(2)} />
              <Scatter
                data={rowObjects.map(r => ({ x: Number(r[xCol]), y: Number(r[yCol]) })).filter(d => !isNaN(d.x) && !isNaN(d.y))}
                fill="#6366f1"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}

        {chartType === 'line' && xCol && yCol && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={rowObjects.map(r => ({ [xCol]: Number(r[xCol]), [yCol]: Number(r[yCol]) })).filter(d => !isNaN(d[xCol]) && !isNaN(d[yCol])).sort((a, b) => a[xCol] - b[xCol])}
              margin={{ top: 10, right: 20, bottom: 40, left: 20 }}
            >
              {!pubMode && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey={xCol} fontSize={12} label={{ value: xCol, position: 'bottom', offset: 20 }} />
              <YAxis fontSize={12} label={{ value: yCol, angle: -90, position: 'insideLeft', offset: -5 }} />
              <Tooltip formatter={(val) => val?.toFixed(2)} />
              <Line dataKey={yCol} stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === 'bar' && groupCol && yCol && aggregatedData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={aggregatedData} margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
              {!pubMode && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey="name" fontSize={12} angle={-30} textAnchor="end" />
              <YAxis fontSize={12} label={{ value: `avg ${yCol}`, angle: -90, position: 'insideLeft', offset: -5 }} />
              <Tooltip />
              <Bar dataKey={yCol} radius={[4, 4, 0, 0]}>
                {aggregatedData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'pie' && groupCol && aggregatedData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={aggregatedData}
                dataKey="count"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={140}
                label={({ name, count }) => `${name} (${count})`}
              >
                {aggregatedData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {!((chartType === 'scatter' && xCol && yCol) ||
            (chartType === 'line' && xCol && yCol) ||
            (chartType === 'bar' && groupCol && yCol) ||
            (chartType === 'pie' && groupCol)) && (
          <p className="text-muted" style={{ textAlign: 'center', padding: 40 }}>Select columns above to build your chart</p>
        )}
      </div>
    </div>
  );
}
