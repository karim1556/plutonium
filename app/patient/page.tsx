import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, HeartPulse, ShieldAlert, TimerReset } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DispenseButton } from "@/components/dispense-button";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { TimelineRail } from "@/components/timeline-rail";
import { requireSession } from "@/lib/auth";
import { getPatientDashboardState } from "@/lib/data";

export default async function PatientPage() {
  const session = await requireSession(["patient"]);
  const state = await getPatientDashboardState(session);

  return (
    <AppShell currentPath="/patient" session={session}>
      <PageIntro
        eyebrow="Patient Home"
        title={state.greeting}
        description={state.comfortMessage}
        accent="patient"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {state.healthCards.map((card, index) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            icon={
              index === 0 ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : index === 1 ? (
                <HeartPulse className="h-5 w-5" />
              ) : (
                <TimerReset className="h-5 w-5" />
              )
            }
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard
          eyebrow="Next Step"
          title="What should I do now?"
          description="This card always focuses on the next medicine moment so the patient does not need to decode charts."
        >
          {state.nextDose ? (
            <div className="grid gap-4 rounded-[30px] bg-sky-50 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-3xl font-semibold text-slate-950">{state.nextDose.time}</p>
                  <StatusPill value={state.nextDose.status} />
                </div>
                <p className="text-lg font-medium text-slate-800">{state.nextDose.medicines.join(" + ")}</p>
                <p className="text-sm leading-7 text-slate-600">
                  Slot {state.nextDose.slotId}. Follow the dispenser light and take only the medicines shown here.
                </p>
              </div>
              <div className="rounded-[26px] bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Ready when you are</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  If the machine is nearby and this dose is due, you can start from here.
                </p>
                <div className="mt-4">
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
                      className="inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Set Up Device
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[30px] bg-emerald-50 p-5">
              <p className="text-lg font-semibold text-slate-900">
                {state.medications.length ? "You are all caught up for now." : "No medicines are in your active plan yet."}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {state.medications.length
                  ? "Keep the dispenser nearby and come back here when the next reminder arrives."
                  : "Ask your caregiver to import the prescription and connect the hardware to start the automated flow."}
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Quick Support"
          title="Help without stress"
          description="Clear support routes matter more than extra features when someone feels unsure."
        >
          <div className="space-y-4">
            {state.supportActions.map((action) => (
              <Link
                key={action.id}
                href={action.href as Route}
                className="block rounded-[28px] border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-white"
              >
                <p className="text-base font-semibold text-slate-900">{action.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
              </Link>
            ))}
            <div className="rounded-[28px] bg-amber-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Safety first</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If you ever feel sick, dizzy, or confused about a dose, pause and contact your doctor or caregiver.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Today’s Plan"
        title="Your medicine checklist"
        description="Every medicine moment is shown in plain language with its slot, timing, and status."
      >
        <div className="space-y-4">
          {state.todaySchedules.length ? (
            state.todaySchedules.map((schedule) => {
              const medicineDetails = state.medications.filter((medication) => schedule.medicines.includes(medication.name));

              return (
                <article
                  key={schedule.id}
                  className="grid gap-4 rounded-[28px] border border-slate-100 bg-slate-50 p-5 lg:grid-cols-[170px_minmax(0,1fr)_220px]"
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
            <article className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              There are no dose bundles for today yet. Once a caregiver imports the prescription and schedules the plan,
              your checklist will appear here.
            </article>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SectionCard
          eyebrow="Progress"
          title="A simple view of your week"
          description="Progress is easier to understand when it looks like a timeline instead of a table."
        >
          {state.weeklyTimeline.length ? (
            <TimelineRail items={state.weeklyTimeline} />
          ) : (
            <div className="rounded-[24px] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Your weekly adherence timeline will start filling in after the first logged doses.
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Remember"
          title="Small things that help"
          description="Gentle reminders are easier to follow than rigid instructions."
        >
          <div className="space-y-4">
            {state.reminders.map((reminder) => (
              <article key={reminder} className="rounded-[24px] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {reminder}
              </article>
            ))}
            {state.refillItems.length ? (
              <article className="rounded-[24px] bg-rose-50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-700" />
                  <p className="text-sm font-semibold text-slate-900">Refill coming up</p>
                </div>
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
