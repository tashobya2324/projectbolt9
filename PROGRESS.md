# Bolt Progress Log

This file is the running record of what has been built and decided on this
project, in plain language, for teammates, examiners, and any agent picking
up the work later. Git history has the exact diffs; this file has the why
and the current state in one place. Add a dated entry here whenever you
finish a meaningful piece of work, whether you are a person or an agent.

## Current status, as of October 20, 2026

Built and in the repository:

* The software requirements specification, covering scope, architecture, the
  three data flow loops, functional and non functional requirements, and the
  eight week timeline to demo day.
* A Bolt design system (color tokens for light and dark, type scale, spacing,
  radius, the logo mark) covering Button, Input, Card, Stat tile, Status
  badge, and Nav item. Ported into app/globals.css as real CSS variables and
  component classes.
* The database schema (db/schema.sql): devices, telemetry, tamper_events (
  append only, enforced by a trigger), access_sessions, profiles (role based
  access, auto created on sign up), geofences, device_settings, alerts, and
  stored_files, plus row level security policies limiting authenticated
  reads and routing all writes through the service role key. The five newer
  tables are not read or written by the dashboard yet; see Next up.
* A Next.js dashboard: a fleet overview page (live map, stat tiles, tamper
  feed, device list) and a device detail page (fuel chart, tamper log, unlock
  code control), both behind a Supabase auth gate.
* Two API routes: one that will receive the EMQX Rule Engine webhook for
  telemetry and tamper events (and computes the hash chain on write), and one
  that issues a time limited, single use unlock code.
* A GitHub repository (tashobya2324/projectbolt9), with the above pushed to
  main.
* Node.js installed and the dashboard's dependencies installed and run
  locally for the first time, to confirm the scaffold actually builds.

Not started yet:

* The four manual signup steps in README.md: GitHub collaborators, the
  Supabase project, EMQX Cloud Serverless, and the Vercel import. Everything
  above currently runs against placeholder credentials and shows a plain
  message instead of real data until these are done.
* The Flutter phone simulator (GPS, accelerometer tamper detection, simulated
  fuel and lock, MQTT publish).
* Push alerts through Firebase Cloud Messaging (FR 18, FR 19).
* The EMQX Rule Engine configuration itself (the webhook route is ready to
  receive it; the rule that calls it still needs to be created once an EMQX
  deployment exists).
* The ESP32 hardware proof of concept (stretch goal, planned to run in
  parallel with cloud deployment per the SRS risk section).

## Log

### October 18, 2026

* Wrote the software requirements specification.
* Added the initial project setup checklist (README.md), the database schema
  (schema.sql, later moved to db/schema.sql), and the environment variable
  template (env.example).
* Built the Bolt design system: color, type, spacing, and radius tokens for
  light and dark, plus Button, Input, Card, Stat tile, Status badge, Nav
  item, and Chart swatches components.

### October 19, 2026

* Replaced the design system's logo mark with the eye and keyhole design, and
  updated the matching assets and documentation.

### October 20, 2026

* Initialized the git repository and connected it to
  https://github.com/tashobya2324/projectbolt9, confirmed empty, and set the
  default branch to main.
* Moved schema.sql to db/schema.sql to match the paths named in README.md,
  and added row level security policies to it.
* Scaffolded the Next.js dashboard and API layer: the fleet overview and
  device detail pages, the Button, Input, Card, Stat tile, Status badge, Nav
  item, Fleet map, Fuel chart, Tamper feed, Device list, and Unlock control
  components, the Supabase client and server helpers, and the two API routes
  described above. Every page degrades to a plain message instead of
  crashing while Supabase is not yet configured.
* Pushed the first commit to main.
* Added this file and AGENTS.md.
* Installed Node.js and ran the dashboard locally for the first time to
  confirm it builds and renders.
* Verified the running server directly: the root path redirects to
  /dashboard, /dashboard and /login both render, the unlock route answers
  with a clear not configured response instead of crashing, and the webhook
  route correctly rejects a call with no shared secret set.
* Noticed during install that next@14.2.15 carried a known security
  vulnerability and moved the project to the patched 14.2.35. A full
  `npm audit` still lists sixteen findings, one critical, mostly tied to
  Next.js advisories whose full fix is next@16.4.2, a breaking change
  (Next 15 and 16 make params, cookies, and headers asynchronous, so every
  route and page that reads them would need updating), plus a matching jump
  to Tailwind 4, which changes how its configuration works. Left as a
  decision for the team rather than done automatically; see the note added
  to AGENTS.md.
* Removed an AI co author line that had been added to a commit before this
  rule existed, by amending that commit and force pushing the correction.
* Went back through the design system's component specifications (Button,
  Card, Input, Stat tile, Status badge, Nav item) and brought the dashboard
  in line with every state they describe: four button variants instead of
  two, a focus ring on inputs, an error and hint line, a card header with an
  optional monospace meta value, a stat tile delta line, badge colors and
  spacing matched exactly, and a nav item left border that reserves its own
  space so nothing shifts on the active state. Also brought in the real Bolt
  logo mark (both the light and dark surface versions) into public/logo and
  a small Logo component that switches between them with no script, and
  fixed one real content rule violation: the sign in required error message
  had a requirement id folded into it whose own id format uses the
  character the content rule forbids, so that id was dropped from the
  message shown to a person and kept only in a code comment instead.
  Confirmed with a type check and against the running server afterward.
* Added five tables to db/schema.sql: profiles (gives every signed in person
  a role, fleet manager or supervisor, matching the two dashboard user
  classes in the SRS, filled in automatically by a trigger on sign up),
  geofences (a center point and a radius per device), device_settings (the
  telemetry interval, tamper threshold, fuel drop rate, and unlock code
  period that the functional requirements call configurable rather than
  fixed in code), alerts (a durable log of what the backend sends or should
  send as a push notification, separate from the append only tamper log),
  and stored_files (metadata for whatever lands in Cloudflare R2). All five
  have row level security matching the existing tables and a matching
  TypeScript type in lib/types.ts, but nothing in the dashboard reads or
  writes them yet. That wiring is next.
* Checked the full commit history and the local git identity: every commit
  so far is authored as the person actually working on this repository,
  with no mention of an assistant anywhere, so there was nothing left to
  remove there. Changed the rule in AGENTS.md going forward though: rather
  than no trailer at all, every commit from here on names the project
  itself as a co author instead of a person or an assistant. The four
  commits made before this rule existed were left alone rather than
  rewriting pushed history a second time for a cosmetic change.

## Next up

1. Wire the five new tables into the application: check profiles.role
   before letting someone issue an unlock code, read device_settings
   instead of the hard coded values in lib/unlockCode.ts and the webhook
   route, show geofences on the fleet map and flag a breach on ingest, give
   alerts its own feed on the dashboard and have the webhook route and a
   future Firebase integration write to it, and list stored_files wherever
   reports or firmware end up.
2. Complete the four setup steps in README.md (Supabase, EMQX, Vercel, GitHub
   collaborators), then fill in .env.local from env.example.
2. Create a fleet manager user in Supabase Auth and sign in at /login.
3. Configure the EMQX Rule Engine webhook action to call /api/webhook/emqx,
   using the JSON shape documented at the top of that file.
4. Start the Flutter phone simulator.
5. Wire up push alerts once Firebase credentials exist.
