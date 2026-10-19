export type Status = "good" | "warn" | "serious" | "critical" | "neutral";

const statusColor: Record<Status, string> = {
  good: "var(--status-good)",
  warn: "var(--status-warn)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
  neutral: "var(--text-200)"
};

interface StatusBadgeProps {
  status: Status;
  label: string;
}

/** Status is always paired with a label here, never color alone. */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className="bolt-status-badge" style={{ background: "var(--bg-300)", color: "var(--text-000)" }}>
      <span className="bolt-status-dot" style={{ background: statusColor[status] }} aria-hidden="true" />
      {label}
    </span>
  );
}
