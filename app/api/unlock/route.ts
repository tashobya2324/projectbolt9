import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { generateUnlockCode, unlockExpiryFromNow } from "@/lib/unlockCode";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const CODE_VALID_MINUTES = 5;

/** UC-2 / FR-13, FR-15: issues a time limited, single use unlock code. */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase is not configured yet (see env.example)." }, { status: 503 });
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    // FR-17: a fleet manager must be signed in to issue a code.
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const deviceId = body?.deviceId;
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId is required." }, { status: 400 });
  }

  const code = generateUnlockCode();
  const expiresAt = unlockExpiryFromNow(CODE_VALID_MINUTES);

  const service = createServiceClient();
  const { error } = await service.from("access_sessions").insert({
    device_id: deviceId,
    code,
    issued_by: userData.user.email ?? userData.user.id,
    expires_at: expiresAt
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The device picks this up over its own bolt/<device_id>/access MQTT topic
  // (FR-14), published by the Rule Engine or a small publisher here once the
  // EMQX credentials exist; left as a later step for this preliminary pass.

  return NextResponse.json({ code, expiresAt });
}
