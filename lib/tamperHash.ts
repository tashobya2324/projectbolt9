import { createHash } from "crypto";

/**
 * Matches db/schema.sql's record_hash comment: sha256(prev_hash + device_id +
 * occurred_at + event_type + magnitude). The backend computes this on ingest, not
 * the device, so every writer produces an identical chain regardless of client.
 */
export function computeTamperHash(input: {
  prevHash: string | null;
  deviceId: string;
  occurredAt: string;
  eventType: string;
  magnitude: number | null;
}): string {
  const parts = [
    input.prevHash ?? "",
    input.deviceId,
    input.occurredAt,
    input.eventType,
    input.magnitude ?? ""
  ].join("");

  return createHash("sha256").update(parts).digest("hex");
}
