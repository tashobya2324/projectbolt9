# Bolt - Project Setup Checklist

This is the "where do we start" checklist. Do these in order - each one unlocks the
next. Nothing here requires Docker; everything below is a free cloud account you
create yourself (I can't create these for you since they're tied to your own login).

Tick these off as a team. The Next.js dashboard and API route below are already
scaffolded against placeholder credentials, so once your real Supabase and EMQX
values go into `.env.local` (copy `env.example`), the dashboard starts reading and
writing real data with no further code changes.

## 1. GitHub repo

- [ ] Create a new GitHub repo (e.g. `bolt-system`). Keep it private for now if you'd
      rather not show it publicly before demo day - you can make it public later.
- [ ] Add your five teammates as collaborators so everyone can push branches and open
      pull requests.
- [ ] Put this `README.md` and the `db/schema.sql` file in the repo root as your first
      commit.

## 2. Supabase (database + auth + realtime)

- [ ] Go to supabase.com, sign up (no credit card needed for the Free plan), create a
      new project. Pick a region close to you if offered (e.g. Europe or a nearby
      option - it won't be exact for Uganda, but it's not critical for a demo).
- [ ] Open **SQL Editor** in the Supabase dashboard, paste in the contents of
      `db/schema.sql`, and run it. Check the **Table Editor** afterwards - you should
      see `devices`, `telemetry`, `tamper_events`, and `access_sessions`.
- [ ] Go to **Project Settings > API** and note down (you'll need these soon):
  - Project URL
  - `anon` public API key
  - Database connection string (**Project Settings > Database**)

## 3. EMQX Cloud Serverless (MQTT broker)

- [ ] Go to emqx.com, sign up for EMQX Cloud, create a **Serverless** deployment (not
      Dedicated - Serverless is the forever-free one, no credit card required).
- [ ] In the deployment's billing/usage settings, set the **Spend Limit to $0** - this
      is what guarantees it can never charge you; it just pauses if you somehow hit
      the free monthly quota instead.
- [ ] Note down the broker connection details (host, port, and the
      username/password you set for device authentication).
- [ ] Leave the Rule Engine / webhook setup for later - we'll configure it once the
      API route that receives it actually exists.

## 4. Vercel (hosting the dashboard + API)

- [ ] Go to vercel.com, sign up with your GitHub account, and "Import" the
      `bolt-system` repo as a new project. It's fine if the repo is still mostly
      empty - Vercel will give you a live URL the moment there's a basic Next.js app
      in it, which is the next step I'll help with.
- [ ] In the Vercel project's **Settings > Environment Variables**, this is where the
      Supabase and EMQX credentials from steps 2 and 3 will eventually go - don't
      add them yet, just know this is where they'll live.

## 5. Naming convention (so everyone's pieces fit together)

Agree on these now so the phone app, the broker, and the backend all speak the same
language from day one:

- Each device gets a UUID from the `devices` table in Supabase (create one row per
  phone/device you're testing with).
- MQTT topics follow this pattern:
  - `bolt/<device_id>/telemetry` - regular heartbeat (location, fuel, lock status)
  - `bolt/<device_id>/tamper` - discrete tamper events
  - `bolt/<device_id>/access` - unlock codes pushed from the dashboard to the device

## What's built so far

- A Next.js dashboard (`app/dashboard`) with a live map, fuel chart, tamper feed,
  device list and unlock code control, styled from the Bolt design system tokens
  in `app/globals.css`.
- `POST /api/webhook/emqx` - the endpoint the EMQX Rule Engine webhook action calls
  for both telemetry and tamper events. See the comment at the top of
  `app/api/webhook/emqx/route.ts` for the exact JSON shape the rule's SQL SELECT
  needs to produce.
- `POST /api/unlock` - issues a time limited, single use code (FR-13, FR-15),
  gated behind Supabase auth (FR-17).
- Row level security policies in `db/schema.sql`: authenticated fleet managers can
  read every table; all writes go through the API routes with the service role key.

Everything above runs against placeholder Supabase credentials until step 2 is
done, showing a "Backend not connected yet" message instead of crashing.

## What's next

- Once step 2 (Supabase) is done, fill in `.env.local` and create a fleet manager
  user in Supabase Auth to sign in at `/login`.
- Once step 3 (EMQX) is done, configure the Rule Engine's webhook action as
  described in `app/api/webhook/emqx/route.ts`, pointed at your deployed
  `/api/webhook/emqx` URL, with the `x-webhook-secret` header set to
  `EMQX_WEBHOOK_SECRET`.
- The starting point for the Flutter phone app (device simulator: GPS,
  accelerometer tamper detection, simulated fuel and lock, MQTT publish) is the
  next piece of work after that.
- Push alerts (FR-18, FR-19) plug into the webhook route once Firebase Cloud
  Messaging credentials exist; left as a TODO in that file for now.
