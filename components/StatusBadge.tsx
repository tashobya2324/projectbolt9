export type Status = "good" | "warn" | "serious" | "critical" | "neutral";

const statusColor: Record<Status, string> = {
  good: "var(--status-000)",
  warn: "var(--status-100)",
  serious: "var(--status-200)",
  critical: "var(--status-300)",
  neutral: "var(--text-200)"
};

interface StatusBadgeProps {
  status: Status;
  label: string;
}

/**
 * The one place the fixed four step status scale appears: good, warn,
 * serious, critical. Status is always paired with this dot and label,
 * never shown as color alone. No dash character in a badge label, ever.
 */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className="bolt-status-badge">
      <span className="bolt-status-dot" style={{ background: statusColor[status] }} aria-hidden="true" />
      {label}
    </span>
  );
}
