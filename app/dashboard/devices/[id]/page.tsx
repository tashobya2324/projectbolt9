import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader } from "@/components/Card";
import { FuelChart } from "@/components/FuelChart";
import { TamperFeed } from "@/components/TamperFeed";
import { UnlockControl } from "@/components/UnlockControl";
import { fetchDevice, fetchFuelHistory, fetchRecentTamperEvents } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function DeviceDetailPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured) redirect("/dashboard");

  const supabase = createClient();
  const device = await fetchDevice(supabase, params.id);

  if (!device) notFound();

  const [fuelHistory, tamperEvents] = await Promise.all([
    fetchFuelHistory(supabase, device.id),
    fetchRecentTamperEvents(supabase, { deviceId: device.id })
  ]);

  return (
    <div className="flex flex-col gap-[var(--space-500)]">
      <div>
        <Link href="/dashboard" className="text-[14px] text-[var(--text-200)] hover:underline">
          Fleet overview
        </Link>
        <h2 className="text-[28px] font-semibold">{device.name}</h2>
      </div>

      <div className="grid grid-cols-2 gap-[var(--space-400)]">
        <Card>
          <CardHeader title="Fuel level, last 24 hours" />
          <div className="h-[200px]">
            <FuelChart points={fuelHistory} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Access control" />
          <p className="mb-[var(--space-300)] text-[14px] text-[var(--text-100)]">
            Issue a time limited, single use unlock code for this device.
          </p>
          <UnlockControl deviceId={device.id} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Tamper log" meta={tamperEvents.length} />
        <TamperFeed events={tamperEvents} />
      </Card>
    </div>
  );
}
