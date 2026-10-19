interface StatTileDelta {
  direction: "up" | "down";
  /** States the amount and the window together, for example "3% in 10 minutes." */
  text: string;
}

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  delta?: StatTileDelta;
  /** The value's scope: which device, which window of time. */
  subtitle?: string;
}

/** The headline figure component: project/components/StatTile/README.md. */
export function StatTile({ label, value, unit, delta, subtitle }: StatTileProps) {
  return (
    <div className="bolt-stat-tile">
      <span className="bolt-label">{label}</span>
      <span className="bolt-stat-figure">
        {value}
        {unit ? <span className="text-[16px] text-[var(--text-200)] ml-[var(--space-000)]">{unit}</span> : null}
      </span>
      {delta ? (
        <span className="bolt-stat-delta" data-direction={delta.direction}>
          {delta.direction === "up" ? "▲" : "▼"} {delta.text}
        </span>
      ) : null}
      {subtitle ? <span className="text-[12px] text-[var(--text-200)]">{subtitle}</span> : null}
    </div>
  );
}
