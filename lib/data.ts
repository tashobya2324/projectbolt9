import type { SupabaseClient } from "@supabase/supabase-js";
import type { Device, DeviceWithLatestTelemetry, TamperEvent } from "./types";

/**
 * Fetches every device plus its single latest telemetry row. Fine for a small
 * pilot fleet (per the SRS); a larger fleet would move this to a Postgres view.
 */
export async function fetchDevicesWithLatestTelemetry(
  supabase: SupabaseClient
): Promise<DeviceWithLatestTelemetry[]> {
  const { data: devices, error: devicesError } = await supabase
    .from("devices")
    .select("*")
    .order("created_at", { ascending: true });

  if (devicesError) throw devicesError;
  if (!devices || devices.length === 0) return [];

  const withLatest = await Promise.all(
    (devices as Device[]).map(async (device) => {
      const { data: latest } = await supabase
        .from("telemetry")
        .select("*")
        .eq("device_id", device.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { ...device, latest: latest ?? null };
    })
  );

  return withLatest;
}

export async function fetchFuelHistory(supabase: SupabaseClient, deviceId: string, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("telemetry")
    .select("recorded_at, fuel_level_pct")
    .eq("device_id", deviceId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentTamperEvents(
  supabase: SupabaseClient,
  options: { deviceId?: string; limit?: number } = {}
): Promise<TamperEvent[]> {
  let query = supabase
    .from("tamper_events")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(options.limit ?? 20);

  if (options.deviceId) {
    query = query.eq("device_id", options.deviceId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDevice(supabase: SupabaseClient, deviceId: string): Promise<Device | null> {
  const { data, error } = await supabase.from("devices").select("*").eq("id", deviceId).maybeSingle();
  if (error) throw error;
  return data ?? null;
}
