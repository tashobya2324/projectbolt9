import dynamic from "next/dynamic";
import { Card, CardHeader } from "@/components/Card";
import { DeviceList } from "@/components/DeviceList";
import { StatTile } from "@/components/StatTile";
import { TamperFeed } from "@/components/TamperFeed";
import { fetchDevicesWithLatestTelemetry, fetchRecentTamperEvents } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { DeviceWithLatestTelemetry, TamperEvent } from "@/lib/types";

// Leaflet touches `window` at import time, so it can only render client side.
const FleetMap = dynamic(() => import("@/components/FleetMap").then((m) => m.FleetMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-[14px] text-[var(--text-200)]">Loading map</div>
  )
});

export default async function FleetOverviewPage() {
  if (!isSupabaseConfigured) {
    return <NotConnectedNotice />;
  }

  let devices: DeviceWithLatestTelemetry[] = [];
  let tamperEvents: TamperEvent[] = [];
  let loadError: string | null = null;

  try {
    const supabase = createClient();
    [devices, tamperEvents] = await Promise.all([
      fetchDevicesWithLatestTelemetry(supabase),
      fetchRecentTamperEvents(supabase, { limit: 10 })
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load fleet data.";
  }

  if (loadError) {
    return <NotConnectedNotice detail={loadError} />;
  }

  const online = devices.filter((d) => d.latest).length;
  const unlocked = devices.filter((d) => d.latest?.lock_status === "unlocked").length;

  return (
    <div className="flex flex-col gap-[var(--space-500)]">
      <h2 className="text-[28px] font-semibold">Fleet overview</h2>

      <div className="grid grid-cols-3 gap-[var(--space-400)]">
        <StatTile label="Devices" value={String(devices.length)} subtitle={`${online} reporting`} />
        <StatTile label="Unlocked" value={String(unlocked)} subtitle="Right now" />
        <StatTile label="Tamper events" value={String(tamperEvents.length)} subtitle="Last 10 logged" />
      </div>

      <div className="grid grid-cols-2 gap-[var(--space-400)]">
        <Card className="h-[360px] overflow-hidden p-0">
          <FleetMap devices={devices} />
        </Card>
        <Card>
          <CardHeader title="Tamper feed" meta={tamperEvents.length} />
          <TamperFeed events={tamperEvents} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Devices" meta={devices.length} />
        <DeviceList devices={devices} />
      </Card>
    </div>
  );
}

function NotConnectedNotice({ detail }: { detail?: string }) {
  return (
    <Card className="max-w-lg" surface="raised">
      <h2 className="mb-[var(--space-200)] text-[20px] font-semibold">Backend not connected yet</h2>
      <p className="text-[14px] text-[var(--text-100)]">
        Add your Supabase project URL and keys to .env.local (see env.example) once the Supabase project from
        README.md step 2 exists, then restart the dev server.
      </p>
      {detail ? <p className="mt-[var(--space-200)] text-[12px] text-[var(--text-200)]">{detail}</p> : null}
    </Card>
  );
}
