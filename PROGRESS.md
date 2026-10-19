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
  append only, enforced by a trigger), and access_sessions, plus row level
  security policies limiting authenticated reads and routing all writes
  through the service role key.
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

## Next up

1. Complete the four setup steps in README.md (Supabase, EMQX, Vercel, GitHub
   collaborators), then fill in .env.local from env.example.
2. Create a fleet manager user in Supabase Auth and sign in at /login.
3. Configure the EMQX Rule Engine webhook action to call /api/webhook/emqx,
   using the JSON shape documented at the top of that file.
4. Start the Flutter phone simulator.
5. Wire up push alerts once Firebase credentials exist.
