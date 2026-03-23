# MedAssist Pro

MedAssist Pro is a full-stack medication adherence system built with Next.js, Supabase, and an ESP32 dispenser. It supports separate patient and caregiver accounts, invite-based linking between them, slot-aware scheduling, live hardware events, and installable PWA behavior.

## Stack

- Next.js App Router for UI and API routes
- Supabase Auth, Postgres, and Row-Level Security
- Server-side data access with `@supabase/ssr`
- ESP32 firmware for dispense control, fingerprint gating, sensors, and backend callbacks
- PWA manifest + service worker for installable app shell behavior

## Real User Model

There are two real roles in the system:

- Patient
  - signs up with their own email and password
  - sees a patient-friendly dashboard
  - can generate a caregiver invite code
  - can view device readiness and dose progress

- Caregiver
  - signs up with their own email and password
  - can optionally paste a patient invite code during sign-up
  - can also connect later from the Connections page
  - can switch between linked patients on caregiver routes

## How Patient-Caregiver Linking Works

1. A patient signs up.
2. Supabase Auth creates the auth user.
3. The `handle_new_user_profile()` database trigger creates the matching row in `public.users`.
4. The patient opens `/connections`.
5. The patient clicks `Generate Caregiver Invite`.
6. The backend creates a row in `public.caregiver_invitations` and returns:
   - invite code
   - invite link
   - expiry timestamp
7. The caregiver:
   - signs up using the invite code, or
   - signs in and opens `/connections`, then pastes the code
8. `/api/invitations/accept` validates the invite and creates a `public.caregiver_links` row.
9. All caregiver dashboards now resolve the linked patient list dynamically from the database.

## Route Guide

### Public routes

- `/login`
  - sign in with real Supabase credentials
  - redirects to `/patient` or `/caregiver` after login

- `/signup`
  - create a patient or caregiver account
  - supports `?invite=CODE` so caregiver sign-up can start pre-linked

- `/auth/callback`
  - completes Supabase email auth redirects
  - forwards invite tokens into the linking flow

### Shared protected routes

- `/dashboard`
  - role-aware redirect only

- `/connections`
  - patient view:
    - generate invite
    - copy invite code
    - copy invite link
    - see linked caregivers
  - caregiver view:
    - paste invite code
    - connect to patient
    - see linked patients

- `/chat`
  - patient:
    - ask about next dose, missed dose, refill risk
  - caregiver:
    - switch linked patient with the patient switcher
    - ask context-aware questions using the active patient's data

- `/device`
  - patient:
    - simple device readiness view
    - slot contents
    - recent hardware activity
  - caregiver:
    - patient switcher
    - register/update device IP and firmware
    - see slot map and hardware logs
    - trigger supervised dispense

### Patient-only routes

- `/patient`
  - next dose card
  - start dose button
  - today schedule bundles
  - adherence timeline
  - refill warning

### Caregiver-only routes

- `/caregiver`
  - patient switcher
  - adherence snapshot
  - open task list
  - prediction and refill sections
  - current supervised dispense action

- `/upload`
  - patient switcher
  - paste OCR text
  - parse prescription
  - save parsed medications into the selected patient's plan
  - auto-generate today’s schedule when slots already exist

- `/schedule`
  - patient switcher
  - view current slot-aware schedule bundles
  - regenerate proposed schedule
  - adjust times locally
  - save schedule bundles back into Supabase

- `/analytics`
  - patient switcher
  - adherence trend cards
  - daily timeline
  - prediction engine output
  - risk and refill sections

## Button-by-Button Flow

### Patient flow

- `Generate Caregiver Invite` on `/connections`
  - calls `POST /api/invitations/create`
  - stores a real invite row in Supabase

- `Start My Dose` on `/patient`
  - calls `POST /api/dispense`
  - forwards slot number and device IP
  - optionally logs `dispense_requested` and `dispensed`

- `Ask MedAssist` on `/chat`
  - calls `POST /api/chat`
  - uses the logged-in patient’s real schedules, logs, and medications

### Caregiver flow

- `Connect to Patient` on `/connections`
  - calls `POST /api/invitations/accept`
  - creates the caregiver-patient link

- `Parse Prescription` on `/upload`
  - calls `POST /api/parse`
  - turns OCR text into structured medication JSON

- `Save To Patient` on `/upload`
  - calls `POST /api/medications/import`
  - creates or updates medications in Supabase
  - auto-generates today’s schedule if device slots already exist

- `Regenerate` on `/schedule`
  - calls `POST /api/schedule`
  - returns schedule bundles plus safe-gap recommendations

- `Save Schedule` on `/schedule`
  - calls `POST /api/schedule` with `persist: true`
  - updates unlogged rows and inserts missing rows

- `Save Device` on `/device`
  - calls `POST /api/device/register`
  - creates or updates the patient device
  - ensures all 5 slot records exist

- `Trigger Supervised Dose` on `/caregiver` or `/device`
  - calls `POST /api/dispense`
  - triggers the ESP32
  - logs device-side events if device metadata is present

## Database Tables

- `users`
  - role-aware app profile linked to `auth.users`

- `caregiver_links`
  - permanent caregiver-patient relationship table

- `caregiver_invitations`
  - temporary invite code table with expiry and acceptance tracking

- `devices`
  - patient dispenser metadata such as IP, status, current slot, firmware, and last seen

- `slots`
  - 5 hardware-aligned slot records
  - slot 1 to 3 are `single`
  - slot 4 and 5 are `dual`

- `medications`
  - active patient medications and timing data

- `schedules`
  - persisted slot-linked medication rows
  - grouped into bundles in the UI through `bundle_key`

- `logs`
  - dose outcome events such as `taken`, `missed`, and `delayed`

- `hardware_logs`
  - ESP32 events such as `dispensed`, `pickup_confirmed`, `missed`, `heartbeat`

## Hardware Integration

The backend and ESP32 are connected in both directions.

### Backend to ESP32

- Web app calls `/api/dispense`
- The backend calls:
  - `POST http://DEVICE_IP/dispense?slot=NUMBER`
- The device rotates to the requested slot and starts its local dispense flow

### ESP32 to backend

The firmware posts device events to:

- `POST /api/device/event`

Supported event payload fields:

```json
{
  "deviceId": "device-prod-1",
  "event": "pickup_confirmed",
  "slotNumber": 4,
  "details": "IR + load cell confirmed pickup.",
  "scheduleIds": ["schedule-1", "schedule-2"]
}
```

If `scheduleIds` are included and the event is `pickup_confirmed` or `missed`, the backend also creates medication dose logs.

## Firmware Structure

The ESP32 firmware is split into separate files:

- `firmware/esp32-medassist/Config.h`
  - Wi-Fi, backend URL, shared device key, slot angles, timing constants

- `firmware/esp32-medassist/Pins.h`
  - GPIO pin map

- `firmware/esp32-medassist/State.h`
  - device runtime state

- `firmware/esp32-medassist/HardwareContext.h`
  - shared global hardware object declarations

- `firmware/esp32-medassist/Indicators.h`
  - buzzer and LED helpers

- `firmware/esp32-medassist/BackendClient.h`
  - backend event posting helpers

- `firmware/esp32-medassist/Sensors.h`
  - Wi-Fi, fingerprint, HX711, and pickup confirmation logic

- `firmware/esp32-medassist/DispenseFlow.h`
  - slot rotation, retry logic, dispense flow

- `firmware/esp32-medassist/esp32-medassist.ino`
  - web handlers, setup, heartbeat loop

## PWA

The project now includes:

- `app/manifest.ts`
- `app/icon.tsx`
- `app/apple-icon.tsx`
- `components/pwa-register.tsx`
- `public/sw.js`
- `app/offline/page.tsx`

What this gives you:

- installable app behavior on supported devices
- cached app shell
- offline fallback screen when the network is unavailable

## Environment Variables

Copy `.env.example` to `.env.local` and fill these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MEDASSIST_HARDWARE_ENABLED=false
MEDASSIST_DEFAULT_DEVICE_IP=192.168.1.40
MEDASSIST_DEVICE_SHARED_KEY=
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is required for server-side writes and linked reads.
- `MEDASSIST_HARDWARE_ENABLED=true` makes the backend call the real ESP32 instead of returning a simulated success.
- `MEDASSIST_DEVICE_SHARED_KEY` should match the `DEVICE_SHARED_KEY` in the firmware if you want to secure `/api/device/event`.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` from `.env.example`.

3. Apply the SQL schema in `supabase/schema.sql`.

4. Optional: load `supabase/seed.sql` if you want sample records for local testing.

5. Start the app:

```bash
pnpm dev
```

6. Flash the ESP32 firmware after editing:
   - `Config.h`
   - `Pins.h`
   - `DEVICE_ID`
   - `BACKEND_EVENT_URL`
   - `DEVICE_SHARED_KEY`

## Current Realistic Limits

- Prescription parsing currently expects OCR text input; image OCR provider wiring is still a separate integration step.
- Push notifications and SMS providers are not wired yet.
- Voice input is not implemented yet.
- Real-time subscriptions can be added on top of the current Supabase-backed model, but the main data flow is already server-backed.

## Verification

Recommended verification commands:

```bash
pnpm typecheck
pnpm build
```
