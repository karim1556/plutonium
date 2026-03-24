import { ActivitySquare, AlertTriangle, Box, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { PatientSwitcher } from "@/components/patient-switcher";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { TimelineRail } from "@/components/timeline-rail";
import { requireSession } from "@/lib/auth";
import { getAnalyticsState } from "@/lib/data";

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams?: {
    patient?: string;
  };
}) {
  const session = await requireSession(["caregiver"]);
  const state = await getAnalyticsState(session, searchParams?.patient);

  return (
    <AppShell currentPath="/analytics" contextPatientId={state.activePatient?.id} session={session}>
      <PageIntro
        eyebrow="Care Insights"
        title={state.activePatient ? `Insights for ${state.activePatient.name}` : "Connect a patient to unlock analytics"}
        description="This analytics view is built for action. It highlights what is stable, what is slipping, and where caregiver intervention will matter most."
        accent="caregiver"
      />

      <PatientSwitcher patients={state.linkedPatients} activePatientId={state.activePatient?.id} basePath="/analytics" />

      {!state.activePatient ? (
        <SectionCard eyebrow="No Patient Linked" title="Analytics will appear after connection" description="Caregiver analytics are calculated from the linked patient's live schedule and logs.">
          <div className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Accept a patient invite from the Connections page to start tracking adherence and risk trends.
          </div>
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Adherence"
              value={`${state.adherence.score}%`}
              hint={`${state.adherence.taken} taken, ${state.adherence.missed} missed, ${state.adherence.delayed} delayed`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label="Predictions"
              value={String(state.predictions.length)}
              hint="Pattern-based alerts are ready now, ML can be added later."
              icon={<ActivitySquare className="h-5 w-5" />}
            />
            <StatCard
              label="Risk Flags"
              value={String(state.risks.length)}
              hint="Combines schedule, stock, and miss-pattern logic."
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <StatCard
              label="Refills"
              value={String(state.refill.length)}
              hint="Low-stock medicines that can break adherence soon."
              icon={<Box className="h-5 w-5" />}
            />
          </div>

          <SectionCard
            eyebrow="Timeline"
            title="Digital adherence timeline"
            description="A quick week-view that helps you explain patient progress without reading raw logs."
          >
            {state.timeline.length ? (
              <TimelineRail items={state.timeline} />
            ) : (
              <div className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                Timeline events will appear after the first logged medication events.
              </div>
            )}
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard
              eyebrow="Predictions"
              title="Pattern-based intervention engine"
              description="Simple rules are enough for a strong V1 and easier to validate than black-box ML."
            >
              <div className="space-y-4">
                {state.predictions.map((prediction) => (
                  <article key={prediction.id} className="rounded-[28px] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-ink">{prediction.label}</p>
                      <StatusPill value={prediction.severity} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{prediction.recommendation}</p>
                  </article>
                ))}
                {state.daypartSummary.map((entry) => (
                  <article key={entry.label} className="rounded-[28px] bg-sky-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{entry.score}% adherence.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{entry.note}</p>
                  </article>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Risk + Refill"
              title="Safety engine output"
              description="Duplicate detection, interaction warnings, repeat misses, and refill shortage are surfaced here."
            >
              <div className="space-y-4">
                {state.risks.map((risk) => (
                  <article key={risk.id} className="rounded-[28px] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-ink">{risk.title}</p>
                      <StatusPill value={risk.severity} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{risk.description}</p>
                  </article>
                ))}
                {state.refill.map((item) => (
                  <article key={item.name} className="rounded-[28px] bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Only {item.remaining} pills left. Trigger refill message and caregiver confirmation.
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
