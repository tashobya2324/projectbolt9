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

export type ProfileRole = "fleet_manager" | "supervisor";

export interface Profile {
  id: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
}

export interface Geofence {
  id: string;
  device_id: string | null;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  active: boolean;
  created_at: string;
}

export interface DeviceSettings {
  device_id: string;
  telemetry_interval_seconds: number;
  tamper_threshold: number;
  fuel_drop_threshold_pct_per_hour: number;
  unlock_code_validity_minutes: number;
  updated_at: string;
}

export type AlertKind =
  | "tamper"
  | "fuel_drop"
  | "geofence_breach"
  | "unscheduled_stop"
  | "sensor_fault"
  | "device_offline";

export type AlertSeverity = "warn" | "serious" | "critical";

export interface Alert {
  id: number;
  device_id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  message: string;
  created_at: string;
  pushed_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export interface StoredFile {
  id: string;
  device_id: string | null;
  kind: "firmware" | "report";
  r2_key: string;
  file_name: string;
  size_bytes: number | null;
  content_type: string | null;
  created_by: string | null;
  created_at: string;
}
