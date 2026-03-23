# MedAssist Pro Implementation Guide

This guide maps every major feature to:

- the real problem it solves
- what the starter already implements
- what to build next in Codex for a production-grade version

## 1. Prescription Intelligence Engine

Problem:
Patients receive handwritten prescriptions with unclear dosage, timing, and shorthand like `OD`, `BD`, or `SOS`.

Starter implementation:

- UI: [app/upload/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/upload/page.tsx)
- Component: [components/upload-form.tsx](/Users/karimshaikh/Desktop/plutonium/components/upload-form.tsx)
- API: [app/api/parse/route.ts](/Users/karimshaikh/Desktop/plutonium/app/api/parse/route.ts)
- Logic: [lib/ai.ts](/Users/karimshaikh/Desktop/plutonium/lib/ai.ts)

What it does now:

- accepts OCR text plus image metadata
- expands frequency abbreviations such as `OD` and `BD`
- extracts dosage, duration, meal relation, and part-of-day timing
- returns structured JSON suitable for scheduling

What to build next:

- add OCR provider integration before parsing
- add confidence thresholds per field, not just per medicine
- add doctor name, diagnosis, and handwriting ambiguity flags
- add medicine normalization against a local formulary list

## 2. Smart Scheduler Engine

Problem:
A medicine reminder is useless if it ignores the actual slot where the pills are stored or allows unsafe rescheduling.

Starter implementation:

- UI: [app/schedule/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/schedule/page.tsx)
- Editor: [components/schedule-editor.tsx](/Users/karimshaikh/Desktop/plutonium/components/schedule-editor.tsx)
- API: [app/api/schedule/route.ts](/Users/karimshaikh/Desktop/plutonium/app/api/schedule/route.ts)
- Logic: [lib/scheduler.ts](/Users/karimshaikh/Desktop/plutonium/lib/scheduler.ts)

What it does now:

- maps medicines to slots based on configured slot inventory
- bundles medicines by `date + time + slot`
- generates output like `09:00 -> slot 4 -> Aspirin + Vitamin D3`
- suggests missed-dose rescheduling only when the safe gap allows it

What to build next:

- store user wake time and meal windows in Supabase
- add overdose prevention by checking the last taken dose per medicine
- handle weekly schedules and PRN medicines
- prevent more than 2 medicines from being assigned to a dual slot

## 3. Hardware-linked Dispensing Engine

Problem:
Users still forget even when they see the reminder. The system needs to trigger the machine and dispense the correct physical slot.

Starter implementation:

- UI: [app/dashboard/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/dashboard/page.tsx)
- Device UI: [app/device/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/device/page.tsx)
- Action: [components/dispense-button.tsx](/Users/karimshaikh/Desktop/plutonium/components/dispense-button.tsx)
- API: [app/api/dispense/route.ts](/Users/karimshaikh/Desktop/plutonium/app/api/dispense/route.ts)
- Logic: [lib/hardware.ts](/Users/karimshaikh/Desktop/plutonium/lib/hardware.ts)

What it does now:

- sends `POST /dispense?slot=N` to the configured device IP
- supports simulated mode through `MEDASSIST_HARDWARE_ENABLED=false`
- returns alert context when a live request fails

What to build next:

- sign device requests with a shared secret
- retry on transient network failure
- add caregiver remote trigger audit logging
- support queued commands if the device is temporarily offline

## 4. Adherence Intelligence System

Problem:
Medication adherence is invisible until outcomes get worse.

Starter implementation:

- Analytics UI: [app/analytics/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/analytics/page.tsx)
- Logic: [lib/adherence.ts](/Users/karimshaikh/Desktop/plutonium/lib/adherence.ts)
- Mock history: [lib/data.ts](/Users/karimshaikh/Desktop/plutonium/lib/data.ts)

What it does now:

- computes taken, missed, delayed, and adherence percentage
- generates a week-view timeline
- summarizes today’s schedule against today’s logs

What to build next:

- calculate adherence per medicine, not just total doses
- add rolling 7-day and 30-day trends
- separate “dispensed” from “consumed” in analytics
- include late-by-minutes distribution for clinicians

## 5. Predictive AI Engine

Problem:
Most reminder apps react after the patient already fails.

Starter implementation:

- Logic: [lib/predictor.ts](/Users/karimshaikh/Desktop/plutonium/lib/predictor.ts)
- Dashboard view: [app/dashboard/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/dashboard/page.tsx)
- Analytics view: [app/analytics/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/analytics/page.tsx)

What it does now:

- detects evening miss patterns
- flags dual-slot complexity
- predicts refill shortages
- returns intervention recommendations that are easy to explain in a demo

What to build next:

- add user-specific wake/sleep patterns
- build a simple risk score per daypart
- send early reminders for high-risk time windows
- later replace or augment rule logic with a small ML model

## 6. Medication Risk Engine

Problem:
A smart dispenser must be safe, not just convenient.

Starter implementation:

- Logic: [lib/risk.ts](/Users/karimshaikh/Desktop/plutonium/lib/risk.ts)
- Analytics view: [app/analytics/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/analytics/page.tsx)

What it does now:

- flags duplicate medicines
- checks a starter list of dangerous combinations
- detects slot-capacity overflow
- warns on consecutive missed doses

What to build next:

- add a larger curated interaction dataset
- distinguish severity by dosage, not just medicine name
- add duplicate active ingredient detection by generic/brand mapping
- add “wrong slot loaded” warnings when refill stock does not match configuration

## 7. Context-aware AI Chat

Problem:
Patients need specific help such as “Can I take it now?” instead of generic chatbot replies.

Starter implementation:

- UI: [app/chat/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/chat/page.tsx)
- Component: [components/chat-panel.tsx](/Users/karimshaikh/Desktop/plutonium/components/chat-panel.tsx)
- API: [app/api/chat/route.ts](/Users/karimshaikh/Desktop/plutonium/app/api/chat/route.ts)
- Logic: [lib/ai.ts](/Users/karimshaikh/Desktop/plutonium/lib/ai.ts)

What it does now:

- answers based on schedule, logs, and remaining pills
- supports missed-dose and refill questions
- includes a simple safety layer in every answer

What to build next:

- plug in a stronger model provider
- add language selection and voice transcription
- pass device heartbeat and alert context into prompts
- store chat sessions for caregiver review

## 8. Caregiver Dashboard

Problem:
Elderly or dependent patients often need a second set of eyes.

Starter implementation:

- Dashboard alerts: [app/dashboard/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/dashboard/page.tsx)
- Alert API: [app/api/alerts/route.ts](/Users/karimshaikh/Desktop/plutonium/app/api/alerts/route.ts)
- Schema support: [supabase/schema.sql](/Users/karimshaikh/Desktop/plutonium/supabase/schema.sql)

What it does now:

- shows escalation-ready alerts in the main dashboard
- supports caregiver relationship storage through `caregiver_links`
- models channels like push, SMS, buzzer, LED, and caregiver notification

What to build next:

- add a dedicated caregiver login and patient switcher
- add live status cards powered by Supabase realtime
- add acknowledgment states and alert history
- connect Twilio or WhatsApp messaging

## 9. Refill Intelligence System

Problem:
Even the best reminder system fails if the medicine is out of stock.

Starter implementation:

- Refill analytics: [app/analytics/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/analytics/page.tsx)
- Prediction logic: [lib/predictor.ts](/Users/karimshaikh/Desktop/plutonium/lib/predictor.ts)
- Mock inventory: [lib/data.ts](/Users/karimshaikh/Desktop/plutonium/lib/data.ts)

What it does now:

- tracks remaining pills per medicine and per slot
- flags low-stock medicines when remaining pills are below a threshold
- keeps refill risk visible on dashboard and analytics

What to build next:

- decrement stock automatically after confirmed dispense
- separate “device stock” from “home backup stock”
- trigger caregiver confirmation when refills are not acknowledged
- add pharmacy reminder workflows

## 10. Digital Health Timeline

Problem:
Patients and caregivers need something visual and obvious, not a raw table of logs.

Starter implementation:

- Timeline UI: [components/timeline-rail.tsx](/Users/karimshaikh/Desktop/plutonium/components/timeline-rail.tsx)
- Analytics page: [app/analytics/page.tsx](/Users/karimshaikh/Desktop/plutonium/app/analytics/page.tsx)

What it does now:

- shows daily medication outcome status across the week
- makes adherence trend easy to understand in a demo

What to build next:

- add dose-level drilldown for each date
- color-code by severity and delay duration
- allow caregiver notes on missed days

## 11. Multilingual + Voice System

Problem:
Language barriers reduce adherence, especially in India-focused deployments.

Starter implementation:

- Placeholder only. The app is structured so it can accept locale and prompt changes quickly.

What to build next:

- store `locale` per user in `users`
- translate all patient-facing copy to Hindi and Marathi
- add speech-to-text on the chat page
- add device voice prompts through an external speaker module

## 12. Offline-first Mode

Problem:
Medication support should not disappear when the internet does.

Starter implementation:

- simulated device mode and mock data let you keep core flows working locally

What to build next:

- cache the day’s schedule on the device
- cache the day’s schedule in the browser for patient view
- sync logs back to Supabase when connectivity returns
- mark reconciled versus pending logs in analytics

## Hardware Feature Mapping

### Slot system

- firmware: [firmware/esp32-medassist/esp32-medassist.ino](/Users/karimshaikh/Desktop/plutonium/firmware/esp32-medassist/esp32-medassist.ino)
- schema: [supabase/schema.sql](/Users/karimshaikh/Desktop/plutonium/supabase/schema.sql)

The software stores slot inventory and angle mapping so the UI and the device use the same physical model.

### Dispensing mechanism

The firmware exposes `POST /dispense?slot=N`, rotates to the calibrated angle, performs a dispense pulse, then waits for pickup confirmation.

### Sensor validation

The firmware checks both:

- IR motion
- load-cell weight drop

Only when both are true does it log a successful pickup.

### Fingerprint auth

The firmware blocks dispensing if fingerprint authorization fails while the fingerprint gate is enabled.

### Hardware alert system

The firmware uses:

- buzzer for due and error feedback
- green LED for success
- red LED for block or miss

### Failure handling

The starter already models:

- retry when pickup is not confirmed
- red-light miss state
- offline handling on the software side
- unauthorized block flow

## Database design notes

The schema follows your requested tables and adds a small extension:

- `caregiver_links` for linking caregivers to patients
- `bundle_key` and `bundle_medicines` in `schedules` so grouped slot dispenses still fit a relational model

That lets you preserve the simple core design while still supporting multi-medicine slot bundles.
