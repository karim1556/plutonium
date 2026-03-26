import Link from "next/link";
import { AlertTriangle, ClipboardList, LifeBuoy, MessageCircle } from "lucide-react";
import { ActionLinkCard } from "@/components/action-link-card";
import { AppShell } from "@/components/app-shell";
import { LanguageSelector } from "@/components/language-selector";
import { PageIntro } from "@/components/page-intro";
import { PatientSwitcher } from "@/components/patient-switcher";
import { PredictionsWidget } from "@/components/predictions-widget";
import { QuickActions } from "@/components/quick-actions";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { requireSession } from "@/lib/auth";
import { getCaregiverDashboardState } from "@/lib/data";
import { formatTimestamp, titleCase } from "@/lib/utils";

export default async function CaregiverPage({
  searchParams
}: {
  searchParams?: {
    patient?: string;
  };
}) {
  const session = await requireSession(["caregiver"]);
  const state = await getCaregiverDashboardState(session, searchParams?.patient);
  const nextDose =
    state.todaySchedules.find((schedule) => schedule.status !== "taken" && schedule.status !== "missed") ?? null;
  const schedulePreview = state.todaySchedules.slice(0, 4);
  const patientQuery = state.patient ? { patient: state.patient.id } : undefined;

  return (
    <AppShell currentPath="/caregiver" contextPatientId={state.patient?.id} session={session}>
      <PageIntro
        eyebrow="Caregiver Hub"
        title={state.patient ? `Care overview for ${state.patient.name}` : "Choose a patient to start monitoring"}
        description="The dashboard is now reserved for urgent actions, current patient status, and the next support move."
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
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
            <SectionCard
              eyebrow="Priority Now"
              title="What needs you first"
              description="Only the most important caregiver actions stay here. The deeper tools live in Support."
            >
              <div className="space-y-4">
                {state.openTasks.length ? (
                  state.openTasks.slice(0, 3).map((task) => (
                    <article key={task.id} className="rounded-[30px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{task.title}</p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p>
                        </div>
                        <StatusPill
                          value={task.urgency === "high" ? "critical" : task.urgency === "medium" ? "warning" : "info"}
                        />
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="rounded-[30px] border border-emerald-100 bg-[linear-gradient(180deg,#f1fbf4_0%,#ffffff_100%)] p-5">
                    <p className="text-lg font-semibold text-slate-900">Nothing urgent is waiting right now.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Use Support when you want the full medication board, analytics, scheduling tools, or device controls.
                    </p>
                  </article>
                )}
                <Link
                  href={{ pathname: "/support", query: patientQuery }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Open Support Center
                </Link>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Patient Snapshot"
              title="Current status"
              description="A fast read before you intervene, call, or open a deeper tool."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  {
                    label: "Adherence",
                    value: `${state.adherence.score}%`,
                    note: state.adherence.trendLabel
                  },
                  {
                    label: "Next dose",
                    value: nextDose ? nextDose.time : "Clear",
                    note: nextDose ? nextDose.medicines.join(" + ") : "No pending medicine dose is left today."
                  },
                  {
                    label: "Device",
                    value: state.device ? titleCase(state.device.status) : "Not set",
                    note: state.device
                      ? `Current slot ${state.device.currentSlot}.`
                      : "Register the patient's dispenser in Support."
                  },
                  {
                    label: "Refill",
                    value: state.refillItems[0]?.name ?? "All stocked",
                    note: state.refillItems.length
                      ? `${state.refillItems[0]?.remaining} pills remain.`
                      : "No refill pressure is visible right now."
                  }
                ].map((item) => (
                  <article key={item.label} className="rounded-[26px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
                    <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
                  </article>
                ))}
              </div>
              <div className="mt-4 rounded-[28px] bg-[#f4f7f2] p-4">
                <p className="text-sm font-semibold text-slate-900">Last confirmed pickup</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {state.patientSummary.lastConfirmedPickup
                    ? formatTimestamp(state.patientSummary.lastConfirmedPickup)
                    : "No confirmation has been logged yet today."}
                </p>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <SectionCard
              eyebrow="Today"
              title="Upcoming medication moments"
              description="This is only a preview. The fuller medication board is kept in Support."
            >
              <div className="space-y-3">
                {schedulePreview.length ? (
                  schedulePreview.map((schedule) => (
                    <article
                      key={schedule.id}
                      className="grid gap-4 rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center"
                    >
                      <div>
                        <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{schedule.time}</p>
                        <p className="mt-2 text-sm text-slate-500">Slot {schedule.slotId}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-semibold text-slate-900">{schedule.medicines.join(" + ")}</p>
                          <StatusPill value={schedule.status} />
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                          {schedule.status === "missed"
                            ? "Contact the patient before moving this dose."
                            : schedule.status === "taken"
                              ? "Pickup has already been confirmed."
                              : "Keep this visible until the reminder window closes."}
                        </p>
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5 text-sm leading-6 text-slate-600">
                    No schedules are stored for today yet. Import the prescription and save the generated plan from Support.
                  </article>
                )}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Go Deeper"
              title="Open the right tool"
              description="Support now acts as the main home for scheduling, analytics, hardware, and the assistant."
            >
              <div className="space-y-4">
                <ActionLinkCard
                  href={{ pathname: "/chat", query: patientQuery }}
                  title="Chat with MedAssist"
                  description="Ask questions about patient adherence, risks, and get AI-powered insights using text or voice."
                  icon={MessageCircle}
                  cta="Open Chat"
                  tone="sky"
                />
                <ActionLinkCard
                  href={{ pathname: "/support", query: patientQuery }}
                  title="Support Center"
                  description="Use this to reach the full medication board, scheduling, device tools, analytics, and the assistant."
                  icon={LifeBuoy}
                  cta="Go to Support"
                  tone="amber"
                />
                <ActionLinkCard
                  href="/connections"
                  title="Manage Connections"
                  description="Link new patients or confirm who is already connected to this caregiver account."
                  icon={ClipboardList}
                  cta="Open Connections"
                  tone="slate"
                />
                {state.criticalAlerts.length ? (
                  <div className="rounded-[28px] bg-rose-50 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-700" />
                      <p className="text-sm font-semibold text-slate-900">Critical alert watch</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {state.criticalAlerts[0]?.message ?? "There is a critical issue that should stay visible."}
                    </p>
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>

          {/* AI Predictions & Settings Row */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <SectionCard
              eyebrow="AI Predictions"
              title="Patient adherence insights"
              description="Machine learning analysis of medication patterns and risk factors."
            >
              <PredictionsWidget patientId={state.patient?.id} variant="detailed" />
            </SectionCard>

            <div className="space-y-4">
              <SectionCard
                eyebrow="Settings & Tools"
                title="Quick actions"
                description="Manage preferences and export data"
              >
                <div className="space-y-4">
                  <LanguageSelector variant="full" />
                  <QuickActions
                    patientId={state.patient?.id}
                    showNotifications={true}
                    showExport={true}
                  />
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
