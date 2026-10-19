import Link from "next/link";
import type { DeviceWithLatestTelemetry } from "@/lib/types";
import { StatusBadge, type Status } from "./StatusBadge";

interface DeviceListProps {
  devices: DeviceWithLatestTelemetry[];
}

function statusFor(device: DeviceWithLatestTelemetry): { status: Status; label: string } {
  if (!device.latest) return { status: "neutral", label: "No reports yet" };
  if (device.latest.lock_status === "unlocked") return { status: "warn", label: "Unlocked" };
  return { status: "good", label: "Locked" };
}

/** FR-16: lists every registered device with its current status. */
export function DeviceList({ devices }: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <p className="text-[14px] text-[var(--text-200)]">
        No devices registered yet. Add a row to the devices table in Supabase once it exists.
      </p>
    );
  }

  return (
    <table className="w-full text-left text-[14px]">
      <thead>
        <tr className="bolt-label border-b border-[var(--border-000)]">
          <th className="pb-[var(--space-200)] font-medium">Device</th>
          <th className="pb-[var(--space-200)] font-medium">Status</th>
          <th className="pb-[var(--space-200)] font-medium">Fuel</th>
          <th className="pb-[var(--space-200)] font-medium">Last report</th>
        </tr>
      </thead>
      <tbody>
        {devices.map((device) => {
          const { status, label } = statusFor(device);
          return (
            <tr key={device.id} className="border-b border-[var(--border-000)] last:border-0">
              <td className="py-[var(--space-200)]">
                <Link href={`/dashboard/devices/${device.id}`} className="hover:underline">
                  {device.name}
                </Link>
              </td>
              <td className="py-[var(--space-200)]">
                <StatusBadge status={status} label={label} />
              </td>
              <td className="py-[var(--space-200)] font-mono">
                {device.latest?.fuel_level_pct != null ? `${device.latest.fuel_level_pct}%` : "—"}
              </td>
              <td className="py-[var(--space-200)] text-[var(--text-200)]">
                {device.latest ? new Date(device.latest.recorded_at).toLocaleString() : "Never"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
