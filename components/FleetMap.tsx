"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { DeviceWithLatestTelemetry } from "@/lib/types";

interface FleetMapProps {
  devices: DeviceWithLatestTelemetry[];
}

const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];

/** Live map of each device's latest reported position (FR-4, UC-1). */
export function FleetMap({ devices }: FleetMapProps) {
  const located = devices.filter(
    (d) => d.latest?.lat != null && d.latest?.lng != null
  ) as (DeviceWithLatestTelemetry & {
    latest: NonNullable<DeviceWithLatestTelemetry["latest"]>;
  })[];

  const center: [number, number] =
    located.length > 0 ? [located[0].latest.lat as number, located[0].latest.lng as number] : UGANDA_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={located.length > 0 ? 12 : 6}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", borderRadius: "var(--radius-100)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((device) => (
        <Marker key={device.id} position={[device.latest.lat as number, device.latest.lng as number]}>
          <Popup>
            <strong>{device.name}</strong>
            <br />
            {device.latest.lock_status ?? "unknown"} · {device.latest.fuel_level_pct ?? "?"}% fuel
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
