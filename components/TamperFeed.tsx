import type { TamperEvent } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

interface TamperFeedProps {
  events: TamperEvent[];
}

/** Newest first live feed of tamper events (FR-8). */
export function TamperFeed({ events }: TamperFeedProps) {
  if (events.length === 0) {
    return <p className="text-[14px] text-[var(--text-200)]">No tamper events recorded.</p>;
  }

  return (
    <ul className="flex flex-col gap-[var(--space-200)]">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center justify-between gap-[var(--space-200)] border-b border-[var(--border-000)] pb-[var(--space-200)] last:border-0 last:pb-0"
        >
          <div className="flex flex-col gap-[var(--space-000)]">
            <span className="text-[14px] font-medium">{event.event_type}</span>
            <span className="text-[12px] text-[var(--text-200)]">
              {new Date(event.occurred_at).toLocaleString()}
            </span>
          </div>
          <StatusBadge status="critical" label="Tamper" />
        </li>
      ))}
    </ul>
  );
}
