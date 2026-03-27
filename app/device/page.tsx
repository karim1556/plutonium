import { AppShell } from "@/components/app-shell";
import { DeviceRegistrationForm } from "@/components/device-registration-form";
import { DispenseButton } from "@/components/dispense-button";
import { EditDeviceIp } from "@/components/edit-device-ip";
import { PageIntro } from "@/components/page-intro";
import { PatientSwitcher } from "@/components/patient-switcher";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { requireSession } from "@/lib/auth";
import { getDeviceState } from "@/lib/data";
import { describeHardwareLog } from "@/lib/hardware";
import { formatTimestamp } from "@/lib/utils";

export default async function DevicePage({
  searchParams
}: {
  searchParams?: {
    patient?: string;
  };
}) {
  const session = await requireSession();
  const state = await getDeviceState(session, searchParams?.patient);

  return (
    <AppShell
      currentPath="/device"
      contextPatientId={state.role === "caregiver" ? state.activePatient?.id : undefined}
      session={session}
    >
      <PageIntro
        eyebrow={state.role === "patient" ? "My Dispenser" : "Device Console"}
        title={
          state.role === "patient"
            ? "Check if your medicine device is ready"
            : state.activePatient
              ? `Device status for ${state.activePatient.name}`
              : "Choose a patient to manage hardware"
        }
        description={state.patientFriendlyText}
        accent={state.role}
      />

      {state.role === "caregiver" ? (
        <PatientSwitcher patients={state.linkedPatients} activePatientId={state.activePatient?.id} basePath="/device" />
      ) : null}

      {!state.activePatient ? (
        <SectionCard
          eyebrow="No Patient Linked"
          title="Connect a patient before configuring hardware"
          description="The device console is scoped to one patient at a time."
        >
          <div className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Accept a patient invite first, then come back here to register the dispenser and monitor events.
          </div>
        </SectionCard>
      ) : !state.device ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <SectionCard
            eyebrow="Device Setup"
            title="Register the dispenser"
            description="Save the device IP, firmware version, and authentication policy so the software can trigger the ESP32."
          >
            <DeviceRegistrationForm patientId={state.activePatient.id} />
          </SectionCard>

          <SectionCard
            eyebrow="What Happens Next"
            title="After registration"
            description="The backend will create the five slot records automatically so the scheduler can map medicines to the wheel."
          >
            <div className="space-y-4">
              {[
                "Slot 1 to 3 are created as single compartments.",
                "Slot 4 and 5 are created as dual compartments.",
                "The schedule engine can then assign medication bundles to real slot numbers.",
                "The firmware can start posting heartbeat and pickup events back to the backend."
              ].map((item) => (
                <article key={item} className="rounded-[28px] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {item}
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <SectionCard
            eyebrow="Device"
            title={state.role === "patient" ? "Simple device view" : "Current device state"}
            description={
              state.role === "patient"
                ? "This view keeps technical details minimal and focuses on whether the machine is ready."
                : "These properties should be mirrored from the device heartbeat and hardware log table."
            }
          >
            <div className="space-y-4">
              <div className="rounded-[28px] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">Device status</p>
                  <StatusPill value={state.device.status} />
                </div>
                <p className="text-sm leading-6 text-slate-600">Current slot: {state.device.currentSlot}</p>
                {state.role === "caregiver" ? (
                  <>
                    <EditDeviceIp 
                      patientId={state.activePatient.id}
                      currentIp={state.device.ipAddress}
                      firmwareVersion={state.device.firmwareVersion ?? null}
                      requiresFingerprint={state.device.requiresFingerprint}
                    />
                    <p className="text-sm leading-6 text-slate-600">Firmware: {state.device.firmwareVersion ?? "Unknown"}</p>
                    <p className="text-sm leading-6 text-slate-600">Last seen: {formatTimestamp(state.device.lastSeen)}</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Last checked: {formatTimestamp(state.device.lastSeen)}
                  </p>
                )}
              </div>
              {state.role === "caregiver" ? (
                <div className="rounded-[28px] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-ink">Remote control</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use this only when the patient is present and ready for a supervised dispense.
                  </p>
                  <div className="mt-4">
                    <DispenseButton
                      slotId={state.device.currentSlot}
                      deviceIP={state.device.ipAddress}
                      deviceId={state.device.id}
                      patientId={state.activePatient.id}
                      label="Trigger Current Slot"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-ink">How it helps</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    When your dose is due, the machine lights up, buzzes, and guides you one step at a time.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard
              eyebrow="Slots"
              title={state.role === "patient" ? "What each slot contains" : "Inventory and compartment map"}
              description={
                state.role === "patient"
                  ? "This helps the patient trust that the right medicines are in the right place."
                  : "The slot table keeps the software aligned with the physical wheel."
              }
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {state.slots.length ? (
                  state.slots.map((slot) => (
                    <article key={slot.recordId ?? slot.id} className="rounded-[28px] bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-semibold text-ink">Slot {slot.id}</p>
                        <StatusPill value={slot.type === "dual" ? "info" : "pending"} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {slot.medicines.length ? slot.medicines.join(" + ") : "Not assigned yet"}
                      </p>
                      {state.role === "caregiver" ? (
                        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                          Remaining {slot.remaining} • angle {slot.rotationAngle}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {slot.type === "dual" ? "Dual compartment" : "Single medicine compartment"}
                        </p>
                      )}
                    </article>
                  ))
                ) : (
                  <article className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                    Slot records will appear here after the device is registered.
                  </article>
                )}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Hardware Logs"
              title={state.role === "patient" ? "Recent device activity" : "Recent hardware events"}
              description={
                state.role === "patient"
                  ? "A simple event trail can reassure the patient that the machine is working."
                  : "Use these logs to prove real dispensing, pickup validation, and failure handling."
              }
            >
              <div className="space-y-4">
                {state.hardwareLogs.length ? (
                  state.hardwareLogs.map((log) => (
                    <article key={log.id} className="rounded-[28px] bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-ink">{describeHardwareLog(log)}</p>
                        <StatusPill value={log.event === "missed" ? "critical" : "info"} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{formatTimestamp(log.timestamp)}</p>
                    </article>
                  ))
                ) : (
                  <article className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                    Hardware logs will appear after the ESP32 starts sending heartbeat, dispense, and pickup events.
                  </article>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </AppShell>
  );
}
