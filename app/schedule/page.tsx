import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { PatientSwitcher } from "@/components/patient-switcher";
import { ScheduleEditor } from "@/components/schedule-editor";
import { SectionCard } from "@/components/section-card";
import { requireSession } from "@/lib/auth";
import { getSchedulePageState } from "@/lib/data";

export default async function SchedulePage({
  searchParams
}: {
  searchParams?: {
    patient?: string;
  };
}) {
  const session = await requireSession(["caregiver"]);
  const state = await getSchedulePageState(session, searchParams?.patient);

  return (
    <AppShell currentPath="/schedule" contextPatientId={state.activePatient?.id} session={session}>
      <PageIntro
        eyebrow="Care Plan Builder"
        title={state.activePatient ? `Schedule plan for ${state.activePatient.name}` : "Choose a patient to build the schedule"}
        description="This scheduler keeps dose times aligned with real slot inventory, caregiver support, and missed-dose safety rules."
        accent="caregiver"
      />

      <PatientSwitcher patients={state.linkedPatients} activePatientId={state.activePatient?.id} basePath="/schedule" />

      {state.activePatient ? (
        <ScheduleEditor
          initialSchedules={state.schedules}
          medications={state.medications}
          slots={state.slots}
          logs={state.logs}
          patientId={state.activePatient.id}
          initialRecommendations={state.recommendations}
        />
      ) : (
        <SectionCard
          eyebrow="No Patient Linked"
          title="The scheduler needs a linked patient"
          description="Schedules are generated from the selected patient's medications and slot map."
        >
          <div className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Connect a patient first. Then import the prescription and register the device so the scheduler can assign real slots.
          </div>
        </SectionCard>
      )}

      <SectionCard
        eyebrow="Safety Rules"
        title="What this scheduler should never compromise"
        description="If these rules stay true, the system remains explainable, safer, and ready for hardware execution."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Never assign more medicines to a slot bundle than the compartment can physically hold.",
            "When a dose is missed, allow rescheduling only if the safe-gap threshold is reached.",
            "Use slot-linked schedules so the hardware can dispense without ambiguous medicine mapping."
          ].map((rule) => (
            <article key={rule} className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              {rule}
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
