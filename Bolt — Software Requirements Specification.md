# Bolt — Software Requirements Specification

A Tamper-Proof Smart Lock and Fuel Security System for the Ugandan Logistics Sector

Oct 18, 2026 · @tash

## 1. Introduction

This document is the Software Requirements Specification (SRS) for Bolt, covering the software prototype phase: phone-simulated devices, the cloud backend, and the fleet manager dashboard, built ahead of the physical hardware.

### 1.1 Purpose

This SRS defines what the Bolt software must do and how well it must do it, as the agreed basis for implementation, team coordination, and final-year project evaluation.

### 1.2 Scope

In scope for this phase:

- A phone application simulating the Bolt Padlock and Bolt FuelGuard: real GPS location, real accelerometer-based tamper detection, simulated fuel level, and a simulated lock state.
- A cloud backend: MQTT broker, webhook API, database, and object storage.
- A web dashboard for the fleet manager: live map, fuel trend, tamper log, and unlock-code issuance.
- A proof-of-concept hardware build (one ESP32-based unit) as a stretch goal.

Out of scope for this phase:

- Finished, enclosed Padlock and FuelGuard hardware units.
- Public app store distribution.
- Multi-fleet billing or multi-tenant account management.

### 1.3 Definitions and Acronyms

| Term | Meaning |
| --- | --- |
| SRS | Software Requirements Specification |
| MQTT | Message Queuing Telemetry Transport, the messaging protocol devices use to publish data |
| GPS | Global Positioning System |
| GSM | Global System for Mobile Communications, the cellular network devices use to reach the internet |
| API | Application Programming Interface |
| CI/CD | Continuous Integration / Continuous Deployment |
| FCM | Firebase Cloud Messaging |
| UUID | Universally Unique Identifier |
| PoC | Proof of Concept |

### 1.4 References

&#91;1\] Group 5, "BOLT: A Tamper-Proof Smart Lock and Fuel Security System for the Ugandan Logistics Sector," Project Concept, Mbarara University of Science and Technology, Faculty of Computing and Informatics, Department of Information Technology, 2026.

### 1.5 Document Overview

Section 2 describes the product at a high level. Section 3 covers the system architecture. Sections 4 to 6 state the functional, non-functional, and interface requirements. Section 7 walks through the system's main use cases. Section 8 is the project timeline. Sections 9 and 10 cover risks and reference material.

## 2. Overall Description

### 2.1 Product Perspective

Bolt is a new, standalone system. In this phase, a smartphone stands in for the physical Padlock and FuelGuard units: it has a real GPS and a real accelerometer, so location tracking and tamper detection are genuinely demonstrated, while fuel level and lock state are simulated since the phone has no tank or physical lock. The backend and dashboard are built to the same architecture planned for the eventual hardware, so introducing real devices later changes the device layer only.

### 2.2 Product Functions

- Live location tracking of each device.
- Tamper detection from sudden motion, logged immutably.
- Fuel-level monitoring with abnormal-drop detection.
- Digital access control: the fleet manager issues time-limited unlock codes; no driver holds a permanent key.
- A fleet dashboard: live map, fuel trend chart, tamper event feed.
- Push alerts to the fleet manager when a tamper event or abnormal fuel drop occurs.

### 2.3 User Classes and Characteristics

| User class | Description |
| --- | --- |
| Fleet Manager | Primary dashboard user. Views the live fleet, issues unlock codes, reviews tamper logs and fuel history. |
| Driver | Carries the device (phone, later the real unit). Receives and uses unlock codes; cannot unlock without one. |
| Device | The phone app, or later the ESP32 hardware. An automated actor that publishes telemetry and tamper events. |
| Supervisor / Examiner | Read-only dashboard viewer, for project evaluation. |

### 2.4 Operating Environment

| Layer | Service |
| --- | --- |
| Dashboard hosting | Vercel (free Hobby plan) |
| Database | Supabase (free plan, Postgres + Auth + Realtime) |
| MQTT broker | EMQX Cloud Serverless (free, spend limit set to $0) |
| Object storage | Cloudflare R2 (free tier) |
| Push notifications | Firebase Cloud Messaging |
| Maps | Leaflet.js with OpenStreetMap tiles |
| Code hosting / CI | GitHub, connected to Vercel for automatic deployment |
| Client devices | Android/iOS phone (Flutter app) during prototyping; a modern web browser for the dashboard |

### 2.5 Design and Implementation Constraints

- Software budget is $0: every service used is on a plan that cannot bill without a card on file, or has its spend limit set to zero.
- Delivery window is 1 to 2 months to demo day.
- The team is new to both mobile and embedded development, so the build sequence favours proven, well-documented tools over custom infrastructure.
- No local containers (Docker): local development points directly at the shared cloud database and broker, and GitHub pushes trigger live deployment through Vercel.

### 2.6 Assumptions and Dependencies

- The phone's GPS and accelerometer are accurate enough to demonstrate the concept, even though they are not the final sensors.
- The demo venue has working WiFi or mobile data.
- A small pilot of simulated devices stays well within the free-tier quotas described in Section 10.
- Real hardware, when introduced, reuses the backend and dashboard without redesign.

## 3. System Architecture

### 3.1 Architectural Overview

Bolt is a layered, serverless system: a device publishes telemetry over MQTT, a broker rule forwards it by webhook to a backend API, the API writes it to a shared database, and the dashboard reads it back — live.

&#91;embedded content: Bolt system architecture · device to dashboard pipeline\]

The same pipeline carries two side effects: the API can write larger files (firmware, exported reports) to Cloudflare R2, and it can push alerts to the fleet manager through Firebase Cloud Messaging.

### 3.2 The Three Data-Flow Loops

- **Telemetry loop.** The device reports location, fuel level, and lock status every 15 to 30 seconds. The API writes each report as one row in the `telemetry` table.
- **Tamper loop.** The accelerometer triggers immediately on a motion spike, independent of the regular heartbeat, and is written as an append-only row in `tamper_events`, chained by hash to the row before it so no entry can be altered without breaking the chain.
- **Access control loop.** The fleet manager issues an unlock code from the dashboard; it is written to `access_sessions` and published to the device's own MQTT topic; the device receives it and simulates unlocking. No driver holds standing authority over the lock.

### 3.3 MQTT Topic Design

| Topic | Direction | Carries |
| --- | --- | --- |
| `bolt/<device_id>/telemetry` | Device → broker | Location, fuel level, lock status |
| `bolt/<device_id>/tamper` | Device → broker | Discrete tamper events |
| `bolt/<device_id>/access` | Broker → device | Unlock codes issued by the fleet manager |

### 3.4 Database Design

| Table | Purpose |
| --- | --- |
| `devices` | One row per device (phone simulator or hardware unit). |
| `telemetry` | The regular heartbeat: location, fuel level, lock status, timestamped. |
| `tamper_events` | Append-only, hash-chained log of tamper events. |
| `access_sessions` | Unlock codes issued, with issue and expiry times. |

The full schema, including the trigger that enforces the append-only rule, is maintained in `db/schema.sql` in the project repository.

### 3.5 Deployment and CI/CD Pipeline

The dashboard and API live in one GitHub repository connected to Vercel, which deploys `main` automatically and gives every branch and pull request its own live preview link. Each piece of work is built on its own branch and merged once its preview confirms it works, so the system grows piece by piece without anyone needing to run a local server stack to see a change live.

The repository is [tashobya2324/projectbolt9](https://github.com/tashobya2324/projectbolt9).

### 3.6 Security and Tamper-Evidence Design

Device-to-broker traffic runs over TLS. Unlock codes expire and are single-use. The `tamper_events` table is enforced append-only by a database trigger, so a logged event cannot be edited or deleted after the fact — this is what makes the tamper log usable as evidence, not just a claim of one.

## 4. Functional Requirements

### 4.1 Telemetry

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | The device shall report its GPS location at a configurable interval (default 15-30s). | High |
| FR-2 | The device shall report fuel level and lock status with every location report. | High |
| FR-3 | The backend shall store every telemetry report with device ID and timestamp. | High |
| FR-4 | The dashboard shall display each device's latest position on a live map. | High |

### 4.2 Tamper Detection

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-5 | The device shall monitor its accelerometer continuously and flag a reading above a configurable threshold as a tamper event. | High |
| FR-6 | A tamper event shall be sent to the backend immediately, independent of the regular telemetry interval. | High |
| FR-7 | The backend shall store every tamper event as an append-only, hash-chained record. | High |
| FR-8 | The dashboard shall display tamper events in a live feed, newest first. | Medium |

### 4.3 Fuel Monitoring

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-9 | The device shall report a simulated fuel level that decreases steadily over time. | High |
| FR-10 | The device shall support manually triggering a sudden fuel drop, to simulate siphoning. | Medium |
| FR-11 | The dashboard shall chart each device's fuel level over time. | High |
| FR-12 | The system shall flag a fuel drop that exceeds a configurable rate as abnormal. | Medium |

### 4.4 Access Control

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-13 | The fleet manager shall be able to issue a time-limited unlock code to a specific device from the dashboard. | High |
| FR-14 | The device shall receive the unlock code over its own MQTT topic and simulate unlocking on a valid code. | High |
| FR-15 | An unlock code shall expire after a configurable period and be usable once only. | Medium |

### 4.5 Dashboard

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-16 | The dashboard shall list all registered devices with their current status. | High |
| FR-17 | The dashboard shall require fleet-manager authentication to issue unlock codes. | Medium |

### 4.6 Alerts

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-18 | The system shall send a push notification to the fleet manager on a tamper event. | Medium |
| FR-19 | The system shall send a push notification to the fleet manager on an abnormal fuel drop. | Medium |

## 5. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Performance | A telemetry report shall reach the dashboard within 10 seconds of being sent, under normal network conditions. |
| Reliability | A tamper event shall never be silently dropped between device and database; the pipeline favours at-least-once delivery. |
| Security | All device-to-broker traffic shall use TLS. Unlock codes shall be single-use and time-limited. |
| Data integrity | The tamper log shall be enforced append-only at the database level, not only by application logic. |
| Usability | A fleet manager shall be able to issue an unlock code in no more than two actions from the dashboard's device view. |
| Portability | The device layer (phone app or hardware) shall be replaceable without changing the backend or dashboard. |
| Maintainability | The codebase shall be organised so each module (device, broker rule, API, dashboard) can be changed independently. |
| Cost | The system shall run entirely on service plans that cannot bill without a payment method on file, or with spend limits set to zero, for the duration of the project. |

## 6. External Interface Requirements

### 6.1 User Interfaces

The fleet manager uses a responsive web dashboard (desktop and mobile browser) showing a live map, a fuel chart, a tamper feed, and an unlock-code control per device. The driver's interaction, in this phase, is limited to the phone app's simulated lock display.

### 6.2 Hardware Interfaces

Not applicable to this phase. The planned future interface is an ESP32 microcontroller with a combined GPS/GSM module (e.g. Quectel EC200U or SIM7600 family), an accelerometer (e.g. MPU6050), a reed switch for lock state, and an ultrasonic or capacitive fuel-level sensor.

### 6.3 Software Interfaces

| Interface | Role |
| --- | --- |
| Supabase REST/Realtime API | Database reads/writes, authentication, live dashboard updates |
| EMQX MQTT broker | Device-to-backend messaging |
| EMQX Rule Engine webhook | Forwards broker messages to the API over HTTPS |
| Cloudflare R2 API | Storage for firmware files and exported reports |
| Firebase Cloud Messaging API | Push notifications to the fleet manager |
| Leaflet.js / OpenStreetMap | Map rendering and tile data |

### 6.4 Communication Interfaces

Device-to-broker: MQTT over TLS. Broker-to-API: HTTPS webhook. Dashboard-to-database: HTTPS (Supabase client library) plus a Realtime WebSocket subscription for live updates.

## 7. System Features / Use Cases

### UC-1: View Live Fleet Map

**Actor:** Fleet Manager. **Precondition:** At least one device is reporting telemetry.

1. Fleet manager opens the dashboard.
2. Dashboard subscribes to live telemetry updates.
3. Each device's latest position appears on the map, updating as new reports arrive.

**Postcondition:** Fleet manager has an up-to-date view of the fleet.

### UC-2: Issue an Unlock Code

**Actor:** Fleet Manager. **Precondition:** Fleet manager is authenticated; target device is online.

1. Fleet manager selects a device and requests an unlock code.
2. Backend generates a time-limited, single-use code and stores it.
3. Backend publishes the code to the device's access topic.
4. Device receives the code and simulates unlocking.

**Postcondition:** The device shows an unlocked state; the code cannot be reused.

### UC-3: Detect and Log a Tamper Event

**Actor:** Device (automated). **Precondition:** Device is active and reporting.

1. Accelerometer reading exceeds the tamper threshold.
2. Device immediately sends a tamper event to the broker.
3. Backend writes the event as a new, hash-chained row in the tamper log.
4. Dashboard shows the event in the tamper feed; fleet manager receives a push alert.

**Postcondition:** The event is permanently and verifiably recorded.

### UC-4: Detect an Abnormal Fuel Drop

**Actor:** Device (automated) and System. **Precondition:** Device has an established fuel-level baseline.

1. Device reports a fuel level significantly lower than its recent trend.
2. Backend compares the drop rate against the configured threshold.
3. If abnormal, backend flags the event and sends a push alert to the fleet manager.

**Postcondition:** Fleet manager is alerted to a likely siphoning event.

## 8. Project Timeline

&#91;embedded content: Bolt build schedule · October to December 2026\]

The schedule runs eight weekly phases from setup to demo day, each building directly on the one before it: the backend pipeline is proven before the phone app sends anything real, the phone app is working end to end before the dashboard is built against it, and the full access-control loop closes before the system moves to the cloud for final testing. The last week is held as buffer for demo rehearsal rather than new work, since a tight two-month window leaves little room to absorb delays elsewhere. The hardware proof-of-concept runs in parallel with cloud deployment rather than as its own phase, reflecting the scope decision in Section 9: a single working breadboard unit, not two finished enclosures, is the realistic hardware target for this timeline.

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Hardware build is too ambitious for the remaining time | High — could leave no working hardware for demo day | Treat hardware as a parallel, lower-priority track; target one breadboard proof-of-concept, not two finished enclosures |
| Free-tier quota exceeded during heavy testing | Medium — a service pauses until the next cycle | Keep EMQX spend limit at $0; monitor Supabase's 500MB / 1-week-inactivity limits; this is a pause, not a bill |
| Phone's GSM/WiFi dependency mirrors the gap the proposal criticises in existing trackers | Medium — a coverage gap looks like a missing feature in the demo | Acceptable for the prototype phase; store-and-forward buffering is noted as future work for the hardware phase |
| Accelerometer false positives from normal phone handling | Medium — undermines confidence in tamper detection | Tune the motion threshold during Week 4 testing, before the dashboard's tamper feed is built around it |
| Team is new to both mobile and embedded development | High — could slip the 1-2 month timeline | The sequence proves the backend before the phone app, and the phone app before the dashboard, so a slip in one area is visible early, not discovered at the end |
| Statistics in the original project concept rely on a single secondary news source | Low for this phase — affects the written proposal, not the software | Trace the Uganda Revenue Authority assessment and transport-association figures to primary sources before final submission |

## 10. Appendices

### Appendix A: Free-Tier Service Reference

| Service | Free limit | Requires a card on file |
| --- | --- | --- |
| Vercel (Hobby) | 100GB transfer, 1M function invocations/month | No |
| Supabase (Free) | 500MB database, 1GB file storage, 50k auth users | No |
| EMQX Cloud Serverless | 1,000 concurrent connections, 1M session-minutes and 1GB traffic/month, spend limit can be set to $0 | No |
| Cloudflare R2 | 10GB storage, 1M Class A / 10M Class B operations/month | Yes — usage beyond the free allowance bills automatically; monitor usage |
| Firebase Cloud Messaging | Unlimited push notifications | No |

### Appendix B: Glossary

| Term | Meaning |
| --- | --- |
| Tamper-evidence | A record designed so that any after-the-fact alteration is detectable, here enforced by a hash chain and a database trigger |
| Hash chain | Each record's hash includes the previous record's hash, so changing any past record breaks every hash after it |
| Siphoning | The gradual, repeated theft of fuel from a tank, as opposed to a single large theft |
| Append-only | A table that only allows new rows to be added; existing rows cannot be edited or deleted |
| Serverless | Backend code that runs on demand, without a continuously running server process to manage |
