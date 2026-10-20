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
  name        text not null,                 -- e.g. "Tash's Phone, Padlock Sim"
  device_type text not null check (device_type in ('phone_sim', 'padlock', 'fuelguard')),
  created_at  timestamptz not null default now()
);

-- =========================================================
-- telemetry
-- The regular heartbeat: location, fuel, and lock status, sent every 15 to
-- 30 seconds.
-- =========================================================
create table if not exists telemetry (
  id              bigserial primary key,
  device_id       uuid not null references devices(id) on delete cascade,
  recorded_at     timestamptz not null default now(),
  lat             double precision,
  lng             double precision,
  fuel_level_pct  numeric(5,2),               -- 0.00 to 100.00, simulated for now
  lock_status     text check (lock_status in ('locked', 'unlocked'))
);

-- Dashboard will constantly ask "give me the latest point(s) for this device"
-- and "give me this device's fuel history over the last N hours": indexed
-- for both.
create index if not exists idx_telemetry_device_time
  on telemetry (device_id, recorded_at desc);

-- =========================================================
-- tamper_events
-- Discrete events: accelerometer spike, forced lock, forced tank cover.
-- This table is append only on purpose, see the trigger below.
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

-- Enforce append only status: block any attempt to edit or delete a tamper log row,
-- even by someone with normal table access. This is what makes the log
-- "verifiable evidence" rather than just a regular table.
create or replace function prevent_tamper_log_modification()
returns trigger as $$
begin
  raise exception 'tamper_events is append only, % is not allowed', tg_op;
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

-- =========================================================
-- profiles
-- One row per dashboard sign in, giving every auth.users row a role. The SRS
-- names two dashboard user classes: the Fleet Manager, who may issue unlock
-- codes, and the Supervisor or Examiner, a read only viewer for evaluation.
-- Every new sign up defaults to supervisor, the safer of the two, and a
-- fleet manager is promoted by hand in the Supabase table editor.
-- =========================================================
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'supervisor' check (role in ('fleet_manager', 'supervisor')),
  created_at timestamptz not null default now()
);

-- Runs with the privilege of its owner, not the signing up user, which is
-- what lets a trigger on auth.users write into public.profiles at all.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'supervisor');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================
-- geofences
-- The allowed area for a device, as a center point and a radius, simpler
-- than a full polygon for a prototype. A null device_id applies fleet wide.
-- Feeds the status badge states "geofence clear" and "unlock outside the
-- geofence" from the design system.
-- =========================================================
create table if not exists geofences (
  id            uuid primary key default gen_random_uuid(),
  device_id     uuid references devices(id) on delete cascade,
  name          text not null,
  center_lat    double precision not null,
  center_lng    double precision not null,
  radius_meters numeric not null check (radius_meters > 0),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_geofences_device
  on geofences (device_id);

-- =========================================================
-- device_settings
-- One row per device, holding the thresholds the functional requirements
-- call configurable rather than fixed in code: the telemetry interval
-- (FR 1), the tamper threshold (FR 5), the abnormal fuel drop rate (FR 12),
-- and the unlock code validity period (FR 15).
-- =========================================================
create table if not exists device_settings (
  device_id                        uuid primary key references devices(id) on delete cascade,
  telemetry_interval_seconds       integer not null default 20 check (telemetry_interval_seconds between 15 and 30),
  tamper_threshold                 numeric not null default 2.5,
  fuel_drop_threshold_pct_per_hour numeric not null default 10,
  unlock_code_validity_minutes     integer not null default 5,
  updated_at                       timestamptz not null default now()
);

-- =========================================================
-- alerts
-- A durable home for every push alert the backend sends or should send to
-- the fleet manager (FR 18, FR 19), plus the conditions the design system's
-- serious and critical status badges describe: a geofence breach, a stop
-- that has run long, a sensor fault, or a device gone offline mid transit.
-- Separate from tamper_events, which is its own append only evidence log;
-- this table is the dashboard's and the push channel's shared inbox and can
-- be acknowledged and, later, updated or cleared.
-- =========================================================
create table if not exists alerts (
  id              bigserial primary key,
  device_id       uuid not null references devices(id) on delete cascade,
  kind            text not null check (
    kind in ('tamper', 'fuel_drop', 'geofence_breach', 'unscheduled_stop', 'sensor_fault', 'device_offline')
  ),
  severity        text not null check (severity in ('warn', 'serious', 'critical')),
  message         text not null,
  created_at      timestamptz not null default now(),
  pushed_at       timestamptz,                 -- when the FCM notification actually went out
  acknowledged_at timestamptz,
  acknowledged_by text
);

create index if not exists idx_alerts_device_time
  on alerts (device_id, created_at desc);

-- =========================================================
-- stored_files
-- Metadata for whatever the backend puts in Cloudflare R2: an exported
-- report or a firmware build. The object itself lives in R2, named by
-- r2_key; this row is what the dashboard lists and what a device checks
-- for a firmware update.
-- =========================================================
create table if not exists stored_files (
  id           uuid primary key default gen_random_uuid(),
  device_id    uuid references devices(id) on delete set null,
  kind         text not null check (kind in ('firmware', 'report')),
  r2_key       text not null,
  file_name    text not null,
  size_bytes   bigint,
  content_type text,
  created_by   text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_stored_files_device
  on stored_files (device_id, created_at desc);

-- =========================================================
-- Row level security for the five tables above
-- =========================================================
alter table profiles enable row level security;
alter table geofences enable row level security;
alter table device_settings enable row level security;
alter table alerts enable row level security;
alter table stored_files enable row level security;

drop policy if exists "Authenticated users can read profiles" on profiles;
create policy "Authenticated users can read profiles"
  on profiles for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read geofences" on geofences;
create policy "Authenticated users can read geofences"
  on geofences for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read device settings" on device_settings;
create policy "Authenticated users can read device settings"
  on device_settings for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read alerts" on alerts;
create policy "Authenticated users can read alerts"
  on alerts for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read stored files" on stored_files;
create policy "Authenticated users can read stored files"
  on stored_files for select
  to authenticated
  using (true);
