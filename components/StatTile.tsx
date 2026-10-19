interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  helper?: string;
}

export function StatTile({ label, value, unit, helper }: StatTileProps) {
  return (
    <div className="bolt-stat-tile">
      <span className="bolt-label">{label}</span>
      <span className="bolt-stat-figure">
        {value}
        {unit ? <span className="text-[16px] text-[var(--text-200)] ml-[var(--space-000)]">{unit}</span> : null}
      </span>
      {helper ? <span className="text-[12px] text-[var(--text-200)]">{helper}</span> : null}
    </div>
  );
}
