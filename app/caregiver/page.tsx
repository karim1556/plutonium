import { AlertTriangle, ClipboardList, ShieldAlert, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DispenseButton } from "@/components/dispense-button";
import { PageIntro } from "@/components/page-intro";
import { PatientSwitcher } from "@/components/patient-switcher";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { requireSession } from "@/lib/auth";
import { getCaregiverDashboardState } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export default async function CaregiverPage({
  searchParams
}: {
  searchParams?: {
    patient?: string;
  };
}) {
  const session = await requireSession(["caregiver"]);
  const state = await getCaregiverDashboardState(session, searchParams?.patient);

  return (
    <AppShell currentPath="/caregiver" session={session}>
      <PageIntro
        eyebrow="Caregiver Hub"
        title={state.patient ? `Care overview for ${state.patient.name}` : "Choose a patient to start monitoring"}
        description="This dashboard highlights the items that need action first: missed-dose risk, refill pressure, device readiness, and the next support step."
        accent="caregiver"
      />

      <PatientSwitcher patients={state.linkedPatients} activePatientId={state.patient?.id} basePath="/caregiver" />

      {!state.patient ? (
        <SectionCard
          eyebrow="No Patient Linked"
          title="Connect a patient first"
          description="A caregiver account becomes active after it accepts a patient invite code."
        >
          <div className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Open the Connections page, enter the patient's invite code, and then come back here.
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Adherence"
              value={`${state.adherence.score}%`}
              hint={state.adherence.trendLabel}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label="Critical Alerts"
              value={String(state.criticalAlerts.length)}
              hint="Escalate these first."
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <StatCard
              label="Open Tasks"
              value={String(state.openTasks.length)}
              hint="Care actions waiting on you."
              icon={<ClipboardList className="h-5 w-5" />}
            />
            <StatCard
              label="Device"
              value={state.device?.status ?? "not set"}
              hint="Hardware is part of the care loop, not a separate system."
              icon={<ShieldAlert className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard
              eyebrow="Urgent Actions"
              title="What should be handled next?"
              description="This is your intervention queue: the most important caregiver actions, in plain order."
            >
              <div className="space-y-4">
                {state.openTasks.map((task) => (
                  <article key={task.id} className="rounded-[28px] bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-slate-900">{task.title}</p>
                      <StatusPill value={task.urgency === "high" ? "critical" : task.urgency === "medium" ? "warning" : "info"} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p>
                  </article>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Remote Support"
              title="When the patient is ready"
              description="Use remote control only when the patient is present and the identity check has been completed."
            >
              <div className="space-y-4">
                <div className="rounded-[28px] bg-sky-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Current slot trigger</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {state.device
                      ? `Send a supervised dispense request to slot ${state.device.currentSlot} if the patient is at the machine.`
                      : "Register the patient's device first so remote supervised dispensing can be enabled."}
                  </p>
                  <div className="mt-4">
                    {state.device ? (
                      <DispenseButton
                        slotId={state.device.currentSlot}
                        deviceIP={state.device.ipAddress}
                        deviceId={state.device.id}
                        patientId={state.patient?.id}
                        label="Trigger Supervised Dose"
                      />
                    ) : null}
                  </div>
                </div>
                <div className="rounded-[28px] bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">Patient summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{state.patientSummary.carePlan}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Last confirmed pickup:{" "}
                    {state.patientSummary.lastConfirmedPickup
                      ? formatTimestamp(state.patientSummary.lastConfirmedPickup)
                      : "No confirmation yet today."}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            eyebrow="Live Medication Board"
            title="Today’s patient schedule"
            description="This combines the patient’s checklist, hardware slot map, and current dose state."
          >
            <div className="space-y-4">
              {state.todaySchedules.length ? (
                state.todaySchedules.map((schedule) => (
                  <article
                    key={schedule.id}
                    className="grid gap-4 rounded-[28px] border border-slate-100 bg-slate-50 p-5 lg:grid-cols-[160px_minmax(0,1fr)_220px]"
                  >
                    <div>
                      <p className="text-2xl font-semibold text-slate-950">{schedule.time}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">Slot {schedule.slotId}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{schedule.medicines.join(" + ")}</p>
                        <StatusPill value={schedule.status} />
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        Bundle-controlled for hardware dispensing and caregiver monitoring.
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">Support note</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {schedule.status === "missed"
                          ? "Contact the patient before moving this dose."
                          : schedule.status === "taken"
                            ? "Pickup was already confirmed."
                            : "Monitor the reminder window and device confirmation."}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <article className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  No schedules are stored for today yet. Import the prescription and save the generated plan.
                </article>
              )}
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              eyebrow="Predictions"
              title="Patterns to act on before failure"
              description="Simple rules are still very effective when they are connected to intervention."
            >
              <div className="space-y-4">
                {state.predictions.map((prediction) => (
                  <article key={prediction.id} className="rounded-[28px] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{prediction.label}</p>
                      <StatusPill value={prediction.severity} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{prediction.recommendation}</p>
                  </article>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Risk + Refill"
              title="The safety issues to keep visible"
              description="Medication systems only matter when they stay safe under missed, delayed, or low-stock conditions."
            >
              <div className="space-y-4">
                {state.risks.map((risk) => (
                  <article key={risk.id} className="rounded-[28px] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{risk.title}</p>
                      <StatusPill value={risk.severity} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{risk.description}</p>
                  </article>
                ))}
                {state.refillItems.map((item) => (
                  <article key={item.name} className="rounded-[28px] bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Only {item.remaining} pills remain. Confirm refill timing before the next two-day window closes.
                    </p>
                  </article>
                ))}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </AppShell>
  );
}
