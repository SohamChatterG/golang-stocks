import React, { useMemo, useState, useCallback } from 'react';

interface PriceChartProps {
  data: number[];
  height?: number; // px
  color?: string;
  showGradient?: boolean;
  className?: string;
  axes?: boolean; // show x/y axes
  tooltip?: boolean; // interactive hover tooltip
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  height = 120,
  color = '#3b82f6',
  showGradient = true,
  className,
  axes = true,
  tooltip = true,
}) => {
  if (!data || data.length < 2) {
    return <div className={className || ''} style={{ height }} />;
  }

  // Layout margins for axes/labels
  const M = axes
    ? { top: 8, right: 12, bottom: 24, left: 44 }
    : { top: 6, right: 6, bottom: 6, left: 6 };

  const width = useMemo(() => {
    // Provide a stable viewBox width so the chart scales nicely to container width
    const step = 16; // logical units per point
    return Math.max(120, (data.length - 1) * step + M.left + M.right);
  }, [data.length, M.left, M.right]);

  const min = useMemo(() => Math.min(...data), [data]);
  const max = useMemo(() => Math.max(...data), [data]);
  const range = Math.max(1e-9, max - min);

  const innerW = width - M.left - M.right;
  const innerH = height - M.top - M.bottom;

  const toX = useCallback((i: number) => M.left + (i / (data.length - 1)) * innerW, [M.left, innerW, data.length]);
  const toY = useCallback((v: number) => M.top + (1 - (v - min) / range) * innerH, [M.top, innerH, min, range]);

  const points = useMemo(() => data.map((v, i) => [toX(i), toY(v)] as const), [data, toX, toY]);
  const path = useMemo(() => points.map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`)).join(' '), [points]);
  const areaPath = `${path} L ${M.left + innerW},${M.top + innerH} L ${M.left},${M.top + innerH} Z`;

  const gradientId = `grad-${Math.random().toString(36).slice(2, 7)}`;

  // Tooltip state
  const [hoverI, setHoverI] = useState<number | null>(null);
  const hoverX = hoverI !== null ? toX(hoverI) : null;
  const hoverY = hoverI !== null ? toY(data[hoverI]) : null;

  // Axes ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => min + (range * i) / yTicks);
  const xTicks = 5;
  const xTickIdx = Array.from({ length: xTicks }, (_, i) => Math.round(((data.length - 1) * i) / (xTicks - 1)));

  const onMove = (evt: React.MouseEvent<SVGSVGElement>) => {
    if (!tooltip) return;
    const { left } = (evt.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = evt.clientX - left; // in CSS pixels scaled to viewBox by preserveAspectRatio=none
    // Convert px to viewBox unit using bounding box width vs viewBox width ratio
    const vbW = width;
    const cssW = (evt.currentTarget as SVGSVGElement).clientWidth;
    const vx = (px / Math.max(1, cssW)) * vbW;
    const rel = (vx - M.left) / Math.max(1, innerW);
    const idx = Math.round(rel * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    setHoverI(clamped);
  };

  const onLeave = () => setHoverI(null);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ display: 'block', width: '100%', height }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={color} floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Axes */}
      {axes && (
        <g fontSize={10} fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial">
          {/* Y axis line */}
          <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + innerH} stroke="#e5e7eb" />
          {/* X axis line */}
          <line x1={M.left} y1={M.top + innerH} x2={M.left + innerW} y2={M.top + innerH} stroke="#e5e7eb" />
          {/* Y ticks */}
          {yTickValues.map((v, i) => {
            const y = toY(v);
            return (
              <g key={`yt-${i}`}>
                <line x1={M.left} x2={M.left + innerW} y1={y} y2={y} stroke="#f3f4f6" />
                <text x={M.left - 6} y={y + 3} textAnchor="end" fill="#6b7280">{v.toFixed(2)}</text>
              </g>
            );
          })}
          {/* X ticks */}
          {xTickIdx.map((i, idx) => (
            <g key={`xt-${idx}`}>
              <line x1={toX(i)} x2={toX(i)} y1={M.top + innerH} y2={M.top + innerH + 3} stroke="#9ca3af" />
              <text x={toX(i)} y={M.top + innerH + 12} textAnchor="middle" fill="#6b7280">
                {i - (data.length - 1)}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Area */}
      {showGradient && <path d={areaPath} fill={`url(#${gradientId})`} />}

      {/* Line */}
      <path d={path} stroke={color} strokeWidth={2} fill="none" filter="url(#shadow)" />

      {/* Tooltip */}
      {tooltip && hoverI !== null && hoverX !== null && hoverY !== null && (
        <g>
          {/* Vertical guide */}
          <line x1={hoverX} x2={hoverX} y1={M.top} y2={M.top + innerH} stroke="#9ca3af" strokeDasharray="3 3" />
          {/* Point */}
          <circle cx={hoverX} cy={hoverY} r={3} fill={color} stroke="#fff" strokeWidth={1} />
          {/* Tooltip box */}
          {(() => {
            const price = data[hoverI].toFixed(2);
            const boxW = 70;
            const boxH = 22;
            const bx = Math.min(M.left + innerW - boxW, Math.max(M.left, hoverX + 8));
            const by = Math.max(M.top, hoverY - boxH - 8);
            return (
              <g>
                <rect x={bx} y={by} width={boxW} height={boxH} rx={4} ry={4} fill="#111827" opacity={0.9} />
                <text x={bx + boxW / 2} y={by + boxH / 2 + 3} textAnchor="middle" fill="#f9fafb" fontSize={11}>
                  ${price}
                </text>
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
};

export default PriceChart;
