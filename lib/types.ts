export type DeviceType = "phone_sim" | "padlock" | "fuelguard";
export type LockStatus = "locked" | "unlocked";

export interface Device {
  id: string;
  name: string;
  device_type: DeviceType;
  created_at: string;
}

export interface Telemetry {
  id: number;
  device_id: string;
  recorded_at: string;
  lat: number | null;
  lng: number | null;
  fuel_level_pct: number | null;
  lock_status: LockStatus | null;
}

export interface TamperEvent {
  id: number;
  device_id: string;
  occurred_at: string;
  event_type: string;
  magnitude: number | null;
  prev_hash: string | null;
  record_hash: string;
}

export interface AccessSession {
  id: string;
  device_id: string;
  code: string;
  issued_by: string | null;
  issued_at: string;
  expires_at: string;
  used_at: string | null;
}

/** A device joined with its most recent telemetry report, for list and map views. */
export interface DeviceWithLatestTelemetry extends Device {
  latest: Telemetry | null;
}
