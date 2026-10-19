interface FuelChartProps {
  points: { recorded_at: string; fuel_level_pct: number | null }[];
}

/**
 * A small hand built line chart, not a charting library: the dataset is one
 * series per device and the dashboard never needs more than that, so a
 * dependency would only add weight. Uses chart slot 1 per the design system's
 * fixed categorical order.
 */
export function FuelChart({ points }: FuelChartProps) {
  const values = points.map((p) => p.fuel_level_pct).filter((v): v is number => v != null);

  if (values.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[14px] text-[var(--text-200)]">
        No fuel readings yet.
      </div>
    );
  }

  const width = 480;
  const height = 160;
  const padding = 12;
  const max = Math.max(100, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;

  const step = (width - padding * 2) / Math.max(values.length - 1, 1);
  const coords = values.map((v, i) => {
    const x = padding + i * step;
    const y = height - padding - ((v - min) / span) * (height - padding * 2);
    return [x, y];
  });

  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const latest = values[values.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Fuel level over time">
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="var(--border-100)"
        strokeWidth={1}
      />
      <path d={path} fill="none" stroke="var(--chart-0)" strokeWidth={2} />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r={3} fill="var(--chart-0)" />
      <text x={width - padding} y={padding + 8} textAnchor="end" fill="var(--text-200)" fontSize={12}>
        {latest.toFixed(0)}%
      </text>
    </svg>
  );
}
