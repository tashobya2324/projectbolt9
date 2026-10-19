-- Bolt project database schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query > paste > Run).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- gen_random_uuid() comes from pgcrypto, which Supabase enables by default.
-- Uncomment the next line only if you ever get an error that gen_random_uuid() doesn't exist.
-- create extension if not exists pgcrypto;

-- =========================================================
-- devices
-- One row per physical (or simulated) Bolt unit: your phone counts as one.
-- =========================================================
create table if not exists devices (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- e.g. "Tash's Phone - Padlock Sim"
  device_type text not null check (device_type in ('phone_sim', 'padlock', 'fuelguard')),
  created_at  timestamptz not null default now()
);

-- =========================================================
-- telemetry
-- The regular heartbeat: location + fuel + lock status, sent every 15-30s.
-- =========================================================
create table if not exists telemetry (
  id              bigserial primary key,
  device_id       uuid not null references devices(id) on delete cascade,
  recorded_at     timestamptz not null default now(),
  lat             double precision,
  lng             double precision,
  fuel_level_pct  numeric(5,2),               -- 0.00 - 100.00, simulated for now
  lock_status     text check (lock_status in ('locked', 'unlocked'))
);

-- Dashboard will constantly ask "give me the latest point(s) for this device"
-- and "give me this device's fuel history over the last N hours" - index for both.
create index if not exists idx_telemetry_device_time
  on telemetry (device_id, recorded_at desc);

-- =========================================================
-- tamper_events
-- Discrete events: accelerometer spike, forced lock, forced tank cover.
-- This table is append-only on purpose - see the trigger below.
-- =========================================================
create table if not exists tamper_events (
  id           bigserial primary key,
  device_id    uuid not null references devices(id) on delete cascade,
  occurred_at  timestamptz not null default now(),
  event_type   text not null,                 -- e.g. 'accelerometer_spike', 'lock_forced'
  magnitude    numeric,                       -- raw sensor reading, for later tuning
  prev_hash    text,                          -- hash of the previous row in this device's chain
  record_hash  text not null                  -- sha256(prev_hash + device_id + occurred_at + event_type + magnitude)
);

create index if not exists idx_tamper_device_time
  on tamper_events (device_id, occurred_at desc);

-- Enforce append-only: block any attempt to edit or delete a tamper log row,
-- even by someone with normal table access. This is what makes the log
-- "verifiable evidence" rather than just a regular table.
create or replace function prevent_tamper_log_modification()
returns trigger as $$
begin
  raise exception 'tamper_events is append-only: % is not allowed', tg_op;
end;
$$ language plpgsql;

drop trigger if exists trg_tamper_no_update on tamper_events;
create trigger trg_tamper_no_update
  before update on tamper_events
  for each row execute function prevent_tamper_log_modification();

drop trigger if exists trg_tamper_no_delete on tamper_events;
create trigger trg_tamper_no_delete
  before delete on tamper_events
  for each row execute function prevent_tamper_log_modification();

-- =========================================================
-- access_sessions
-- One row per unlock code the fleet manager issues from the dashboard.
-- The phone app subscribes for these and "unlocks" when a valid one arrives.
-- =========================================================
create table if not exists access_sessions (
  id          uuid primary key default gen_random_uuid(),
  device_id   uuid not null references devices(id) on delete cascade,
  code        text not null,
  issued_by   text,                           -- fleet manager identifier, free text for now
  issued_at   timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create index if not exists idx_access_device
  on access_sessions (device_id, issued_at desc);

-- =========================================================
-- Row level security
-- The dashboard reads with the anon key under a signed in fleet manager
-- session; all writes (telemetry ingest, tamper logging, unlock issuance) go
-- through the API routes using the service role key, which bypasses RLS
-- entirely. So: authenticated users may only ever SELECT here, never write.
-- =========================================================
alter table devices enable row level security;
alter table telemetry enable row level security;
alter table tamper_events enable row level security;
alter table access_sessions enable row level security;

drop policy if exists "Authenticated users can read devices" on devices;
create policy "Authenticated users can read devices"
  on devices for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read telemetry" on telemetry;
create policy "Authenticated users can read telemetry"
  on telemetry for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read tamper events" on tamper_events;
create policy "Authenticated users can read tamper events"
  on tamper_events for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read access sessions" on access_sessions;
create policy "Authenticated users can read access sessions"
  on access_sessions for select
  to authenticated
  using (true);
