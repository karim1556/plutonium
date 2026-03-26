import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Clock3, LifeBuoy, ShieldAlert, MessageCircle } from "lucide-react";
import { ActionLinkCard } from "@/components/action-link-card";
import { AppShell } from "@/components/app-shell";
import { DispenseButton } from "@/components/dispense-button";
import { LanguageSelector } from "@/components/language-selector";
import { PageIntro } from "@/components/page-intro";
import { PredictionsWidget } from "@/components/predictions-widget";
import { QuickActions } from "@/components/quick-actions";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { requireSession } from "@/lib/auth";
import { getPatientDashboardState } from "@/lib/data";

export default async function PatientPage() {
  const session = await requireSession(["patient"]);
  const state = await getPatientDashboardState(session);
  const upcomingSchedules = state.todaySchedules.filter((schedule) => schedule.status !== "taken").slice(0, 3);
  const supportHref = "/support" as Route;

  return (
    <AppShell currentPath="/patient" session={session}>
      <PageIntro
        eyebrow="Patient Home"
        title={state.greeting}
        description={
          state.nextDose
            ? "This home screen keeps the next medicine step clear, calm, and easy to follow."
            : "Nothing urgent is left right now. Come back here for the next medicine step when you need it."
        }
        accent="patient"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_360px]">
        <SectionCard
          eyebrow="Right Now"
          title={state.nextDose ? "Your next medicine step" : "You are clear for now"}
          description={
            state.nextDose
              ? "Read this one card first. Everything else has been moved out of the way."
              : state.medications.length
                ? "You have completed the urgent part of today. Open Support if you want the full plan."
                : "A caregiver can import the prescription and connect the device when you are ready to begin."
          }
        >
          {state.nextDose ? (
            <div className="grid gap-5 rounded-[34px] border border-sky-100 bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_100%)] p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-5xl font-semibold tracking-[-0.05em] text-slate-950">{state.nextDose.time}</p>
                  <StatusPill value={state.nextDose.status} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{state.nextDose.medicines.join(" + ")}</p>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                    Slot {state.nextDose.slotId}. Follow the device light and take only the medicines shown here.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    "Wait for the reminder or due time.",
                    "Take only this dose bundle.",
                    "Open Support if anything feels unclear."
                  ].map((step) => (
                    <div key={step} className="rounded-[24px] bg-white/90 p-4 text-sm leading-6 text-slate-600 shadow-sm">
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/90 bg-white/92 p-5 shadow-sm">
                <p className="text-lg font-semibold text-slate-900">Ready when you are</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{state.comfortMessage}</p>
                <div className="mt-5 flex flex-col gap-3">
                  {state.device ? (
                    <DispenseButton
                      slotId={state.nextDose.slotId}
                      deviceIP={state.device.ipAddress}
                      deviceId={state.device.id}
                      patientId={state.patient?.id}
                      label="Start My Dose"
                    />
                  ) : (
                    <Link
                      href="/device"
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Set Up Device
                    </Link>
                  )}
                  <Link
                    href={supportHref}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Open Support
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[34px] border border-emerald-100 bg-[linear-gradient(180deg,#f1fbf4_0%,#ffffff_100%)] p-6">
              <p className="text-2xl font-semibold text-slate-900">
                {state.medications.length ? "You are all caught up right now." : "No medicines are in your plan yet."}
              </p>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                {state.medications.length
                  ? "Keep the dispenser nearby and come back when the next reminder arrives. Support stays available if you want a fuller view."
                  : "Ask your caregiver to import the prescription and connect the dispenser so the guided flow can begin."}
              </p>
              <div className="mt-5">
                <Link
                  href={supportHref}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open Support
                </Link>
              </div>
            </div>
          )}
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <StatCard
            label="Taken today"
            value={String(state.completedToday)}
            hint={`${state.todaySchedules.length || 0} medicine times are scheduled for today.`}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />
          <StatCard
            label="Still to take"
            value={String(Math.max(state.remainingToday, 0))}
            hint={
              state.nextDose
                ? `Next time is ${state.nextDose.time}.`
                : "No pending medicine step is left right now."
            }
            icon={<Clock3 className="h-5 w-5" />}
          />
          <StatCard
            label="Refill watch"
            value={state.refillItems.length ? `${state.refillItems[0]?.remaining} left` : "All set"}
            hint={
              state.refillItems.length
                ? `${state.refillItems[0]?.name} is the next medicine to restock.`
                : "No refill action is needed right now."
            }
            icon={<ShieldAlert className="h-5 w-5" />}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          eyebrow="Later Today"
          title="Upcoming medicine times"
          description="Only the next few moments stay on the dashboard. The full detail lives in Support."
        >
          {upcomingSchedules.length ? (
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
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
                      {schedule.status === "taken"
                        ? "This medicine time is already complete."
                        : schedule.status === "missed"
                          ? "Pause and ask for help before taking more."
                          : "This stays here so you can see what is coming next without opening a detailed plan."}
                    </p>
                  </div>
                </article>
              ))}
              <Link
                href={supportHref}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
              >
                See Full Plan In Support
              </Link>
            </div>
          ) : (
            <div className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5">
              <p className="text-lg font-semibold text-slate-900">Nothing else needs attention here right now.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Support still has your full medicine plan, weekly progress, and help routes if you want them.
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Support"
          title="Need anything else?"
          description="The home screen stays simple on purpose. Deeper help and details live in Support."
        >
          <div className="space-y-4">
            <ActionLinkCard
              href="/chat"
              title="Chat with MedAssist"
              description="Ask questions about your doses using text or voice. Get instant answers about your medication plan."
              icon={MessageCircle}
              cta="Open Chat"
              tone="sky"
            />
            <ActionLinkCard
              href="/support"
              title="Open Support Center"
              description="Ask questions, check the full plan, review reminders, and reach the right tool without crowding the dashboard."
              icon={LifeBuoy}
              cta="Go to Support"
              tone="amber"
            />
            <div className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcfa] p-5">
              <p className="text-base font-semibold text-slate-900">
                {state.caregiver ? `${state.caregiver.name} is linked to your care circle.` : "No caregiver is linked yet."}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {state.device
                  ? `Your dispenser is ${state.device.status}. Support can help you check the device or ask for guidance.`
                  : "Support can help you set up the device or link a caregiver when you are ready."}
              </p>
            </div>
            <div className="rounded-[28px] bg-amber-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Safety first</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If you feel sick, dizzy, or confused about a dose, pause and contact your doctor or caregiver.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* AI Predictions & Quick Actions Row */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          eyebrow="AI Insights"
          title="Your adherence predictions"
          description="Machine learning analyzes your medication patterns to provide personalized insights."
        >
          <PredictionsWidget patientId={state.patient?.id} variant="detailed" />
        </SectionCard>

        <div className="space-y-4">
          <SectionCard
            eyebrow="Settings"
            title="Preferences"
            description="Customize your experience"
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
    </AppShell>
  );
}
