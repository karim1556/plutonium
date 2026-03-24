import {
  ActivitySquare,
  CalendarRange,
  ClipboardPlus,
  Cpu,
  LayoutDashboard,
  Link2,
  MessageCircleHeart,
  ShieldCheck
} from "lucide-react";
import { ActionLinkCard } from "@/components/action-link-card";
import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { PatientSwitcher } from "@/components/patient-switcher";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { TimelineRail } from "@/components/timeline-rail";
import { requireSession } from "@/lib/auth";
import { getCaregiverDashboardState, getPatientDashboardState } from "@/lib/data";
import { formatTimestamp, titleCase } from "@/lib/utils";

export default async function SupportPage({
  searchParams
}: {
  searchParams?: {
    patient?: string;
  };
}) {
  const session = await requireSession();

  if (session.role === "patient") {
    const state = await getPatientDashboardState(session);

    return (
      <AppShell currentPath="/support" session={session}>
        <PageIntro
          eyebrow="Support Center"
          title="More help, details, and reassurance"
          description="Everything that is not urgent stays here, so the home screen can stay calm and easy to trust."
          accent="patient"
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SectionCard
            eyebrow="Quick Help"
            title="Choose what you need"
            description="Large, simple routes make it easier to find help without guessing."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ActionLinkCard
                href="/chat"
                title="Ask a question"
                description="Get simple guidance if you are unsure about timing, a missed dose, or what to do next."
                icon={MessageCircleHeart}
                cta="Open Assistant"
                tone="sky"
              />
              <ActionLinkCard
                href="/device"
                title="Check my device"
                description="See if the dispenser is ready and confirm what the machine is doing right now."
                icon={Cpu}
                cta="Open Device"
                tone="sage"
              />
              <ActionLinkCard
                href="/connections"
                title="My care circle"
                description="View linked caregivers or add support when you want someone to help from a distance."
                icon={Link2}
                cta="Open Connections"
                tone="amber"
              />
              <ActionLinkCard
                href="/patient"
                title="Back to home"
                description="Return to the simplified dashboard that shows only the next medicine step."
                icon={LayoutDashboard}
                cta="Go to Dashboard"
                tone="slate"
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="At A Glance"
            title="Important notes"
            description="These reminders stay visible here without crowding the dashboard."
          >
            <div className="space-y-4">
              <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
                <p className="text-sm font-semibold text-slate-900">Care circle</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {state.caregiver
                    ? `${state.caregiver.name} is linked and can support you remotely.`
                    : "No caregiver is linked yet. You can add one from Connections when you want extra support."}
                </p>
              </article>
              <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
                <p className="text-sm font-semibold text-slate-900">Device status</p>
                <div className="mt-3 flex items-center gap-3">
                  <StatusPill value={state.device?.status ?? "offline"} />
                  <p className="text-sm leading-6 text-slate-600">
                    {state.device
                      ? `The dispenser is currently ${state.device.status}.`
                      : "No dispenser is registered yet."}
                  </p>
                </div>
              </article>
              <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
                <p className="text-sm font-semibold text-slate-900">Refill watch</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {state.refillItems.length
                    ? `${state.refillItems[0]?.name} is running low with ${state.refillItems[0]?.remaining} pills left.`
                    : "No refill warning is active right now."}
                </p>
              </article>
              <article className="rounded-[28px] bg-amber-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Safety reminder</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  If anything feels confusing, pause and ask for help before taking more medicine.
                </p>
              </article>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          eyebrow="Today In Detail"
          title="Full medicine plan"
          description="The dashboard shows only the next step. This page keeps the fuller checklist."
        >
          <div className="space-y-4">
            {state.todaySchedules.length ? (
              state.todaySchedules.map((schedule) => {
                const medicineDetails = state.medications.filter((medication) => schedule.medicines.includes(medication.name));

                return (
                  <article
                    key={schedule.id}
                    className="grid gap-4 rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5 lg:grid-cols-[170px_minmax(0,1fr)_220px]"
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
                      <ul className="space-y-2 text-sm leading-6 text-slate-600">
                        {medicineDetails.map((medication) => (
                          <li key={medication.id}>
                            {medication.name} {medication.dosage}. {medication.instructions?.[0] ?? "Follow the prescribed timing."}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-[24px] bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">Friendly reminder</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {schedule.status === "taken"
                          ? "This dose has already been completed."
                          : schedule.status === "missed"
                            ? "Do not double the next dose. Ask for help before taking more."
                            : "Wait for the reminder window, then follow the device prompts calmly."}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5 text-sm leading-6 text-slate-600">
                There are no dose bundles for today yet. Once a caregiver imports the prescription and schedules the plan,
                your checklist will appear here.
              </article>
            )}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SectionCard
            eyebrow="Week View"
            title="A simple view of your week"
            description="Progress is easier to understand when it looks like a timeline instead of a report."
          >
            {state.weeklyTimeline.length ? (
              <TimelineRail items={state.weeklyTimeline} />
            ) : (
              <div className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5 text-sm leading-6 text-slate-600">
                Your weekly adherence timeline will start filling in after the first logged doses.
              </div>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="Remember"
            title="Small things that help"
            description="Short reminders are easier to follow than long instructions."
          >
            <div className="space-y-4">
              {state.reminders.map((reminder) => (
                <article key={reminder} className="rounded-[24px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4 text-sm leading-6 text-slate-600">
                  {reminder}
                </article>
              ))}
              {state.refillItems.length ? (
                <article className="rounded-[24px] bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Refill coming up</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {state.refillItems[0]?.name} is running low. Your caregiver can help restock it soon.
                  </p>
                </article>
              ) : null}
            </div>
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const state = await getCaregiverDashboardState(session, searchParams?.patient);
  const patientQuery = state.patient ? { patient: state.patient.id } : undefined;

  return (
    <AppShell currentPath="/support" contextPatientId={state.patient?.id} session={session}>
      <PageIntro
        eyebrow="Support Center"
        title={state.patient ? `Tools and details for ${state.patient.name}` : "Choose a patient to open the support center"}
        description="This is where the broader feature set now lives: scheduling, analytics, device tools, assistant help, and the fuller medication board."
        accent="caregiver"
      />

      <PatientSwitcher patients={state.linkedPatients} activePatientId={state.patient?.id} basePath="/support" />

      {!state.patient ? (
        <SectionCard
          eyebrow="No Patient Linked"
          title="Connect a patient first"
          description="The support center becomes useful after it is connected to a real patient record."
        >
          <div className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5 text-sm leading-6 text-slate-600">
            Open Connections, accept the patient invite code, and then come back here.
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <SectionCard
              eyebrow="Action Tools"
              title="Choose the job"
              description="The dashboard stays calm now. Use this page when you need the fuller operating surface."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ActionLinkCard
                  href={{ pathname: "/upload", query: patientQuery }}
                  title="Add prescription"
                  description="Parse a new prescription image into a live medication plan."
                  icon={ClipboardPlus}
                  cta="Open Intake"
                  tone="amber"
                />
                <ActionLinkCard
                  href={{ pathname: "/schedule", query: patientQuery }}
                  title="Edit schedule"
                  description="Adjust times, slot mapping, and safer rescheduling logic."
                  icon={CalendarRange}
                  cta="Open Schedule"
                  tone="sage"
                />
                <ActionLinkCard
                  href={{ pathname: "/analytics", query: patientQuery }}
                  title="Review insights"
                  description="See adherence patterns, daypart performance, and intervention signals."
                  icon={ActivitySquare}
                  cta="Open Insights"
                  tone="sky"
                />
                <ActionLinkCard
                  href={{ pathname: "/device", query: patientQuery }}
                  title="Check device"
                  description="Monitor hardware readiness, slot inventory, and recent machine events."
                  icon={Cpu}
                  cta="Open Device"
                  tone="slate"
                />
                <ActionLinkCard
                  href={{ pathname: "/chat", query: patientQuery }}
                  title="Ask the assistant"
                  description="Use the patient context to ask about missed doses, refill order, or safe next steps."
                  icon={ShieldCheck}
                  cta="Open Assistant"
                  tone="rose"
                />
                <ActionLinkCard
                  href="/connections"
                  title="Manage connections"
                  description="Link new patients or confirm who already has access."
                  icon={Link2}
                  cta="Open Connections"
                  tone="slate"
                />
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Care Summary"
              title="What to keep in mind"
              description="A quick narrative before you open a detailed tool."
            >
              <div className="space-y-4">
                <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-semibold text-slate-900">Care plan</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{state.patientSummary.carePlan}</p>
                </article>
                <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-semibold text-slate-900">Device readiness</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {state.device
                      ? `The dispenser is ${titleCase(state.device.status)} and currently pointed at slot ${state.device.currentSlot}.`
                      : "The patient does not have a registered dispenser yet."}
                  </p>
                </article>
                <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
                  <p className="text-sm font-semibold text-slate-900">Last confirmed pickup</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {state.patientSummary.lastConfirmedPickup
                      ? formatTimestamp(state.patientSummary.lastConfirmedPickup)
                      : "No confirmation has been logged yet today."}
                  </p>
                </article>
                <article className="rounded-[28px] bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Current support focus</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{state.quickActions[0]}</p>
                </article>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            eyebrow="Today In Detail"
            title="Medication board"
            description="The fuller schedule is kept off the main dashboard so the overview can stay focused."
          >
            <div className="space-y-4">
              {state.todaySchedules.length ? (
                state.todaySchedules.map((schedule) => (
                  <article
                    key={schedule.id}
                    className="grid gap-4 rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5 lg:grid-cols-[160px_minmax(0,1fr)_220px]"
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
                <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5 text-sm leading-6 text-slate-600">
                  No schedules are stored for today yet. Import the prescription and save the generated plan.
                </article>
              )}
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              eyebrow="Predictions"
              title="Intervention watch"
              description="Simple pattern detection is still useful when it leads to clear action."
            >
              <div className="space-y-4">
                {state.predictions.map((prediction) => (
                  <article key={prediction.id} className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{prediction.label}</p>
                      <StatusPill value={prediction.severity} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{prediction.recommendation}</p>
                  </article>
                ))}
                {!state.predictions.length ? (
                  <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4 text-sm leading-6 text-slate-600">
                    Pattern-based intervention notes will appear after more schedule and logging history builds up.
                  </article>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Risk + Refill"
              title="Safety watch"
              description="Low stock and repeat-risk issues stay visible here without cluttering the home screen."
            >
              <div className="space-y-4">
                {state.risks.map((risk) => (
                  <article key={risk.id} className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4">
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
                {!state.risks.length && !state.refillItems.length ? (
                  <article className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-4 text-sm leading-6 text-slate-600">
                    No active safety or refill issues are visible right now.
                  </article>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </AppShell>
  );
}
