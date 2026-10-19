import { randomInt } from "crypto";

/** A 6 digit code, easy to show on a dashboard and to key in on a phone. */
export function generateUnlockCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function unlockExpiryFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
