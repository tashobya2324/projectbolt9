import { NextResponse, type NextRequest } from "next/server";
import { computeTamperHash } from "@/lib/tamperHash";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Receives EMQX Rule Engine webhook calls for both device topics (FR-3, FR-6):
 *   bolt/<device_id>/telemetry  -> { kind: "telemetry", device_id, lat, lng, fuel_level_pct, lock_status }
 *   bolt/<device_id>/tamper     -> { kind: "tamper", device_id, event_type, magnitude }
 *
 * Configure the EMQX rule's SQL SELECT to produce exactly these fields, and set
 * the rule's webhook action header `x-webhook-secret` to EMQX_WEBHOOK_SECRET.
 * This shape is this project's own choice, not fixed by EMQX; change it here and
 * in the rule together if it needs to change.
 */
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.EMQX_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "EMQX_WEBHOOK_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  const providedSecret = request.headers.get("x-webhook-secret");
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.device_id) {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
  }

  let supabase: ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase is not configured yet." },
      { status: 503 }
    );
  }

  if (body.kind === "telemetry") {
    const { error } = await supabase.from("telemetry").insert({
      device_id: body.device_id,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      fuel_level_pct: body.fuel_level_pct ?? null,
      lock_status: body.lock_status ?? null
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // FR-12 (abnormal fuel drop) and FR-18/19 (push alerts) plug in here once
    // Firebase Cloud Messaging credentials exist; left as a later step.
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "tamper") {
    const { data: lastEvent, error: lastEventError } = await supabase
      .from("tamper_events")
      .select("record_hash")
      .eq("device_id", body.device_id)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastEventError) return NextResponse.json({ error: lastEventError.message }, { status: 500 });

    const occurredAt = new Date().toISOString();
    const eventType = body.event_type ?? "accelerometer_spike";
    const magnitude = body.magnitude ?? null;
    const prevHash = lastEvent?.record_hash ?? null;

    const recordHash = computeTamperHash({
      prevHash,
      deviceId: body.device_id,
      occurredAt,
      eventType,
      magnitude
    });

    const { error: insertError } = await supabase.from("tamper_events").insert({
      device_id: body.device_id,
      occurred_at: occurredAt,
      event_type: eventType,
      magnitude,
      prev_hash: prevHash,
      record_hash: recordHash
    });

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown payload kind." }, { status: 400 });
}
