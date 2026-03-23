import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { PatientSwitcher } from "@/components/patient-switcher";
import { SectionCard } from "@/components/section-card";
import { UploadForm } from "@/components/upload-form";
import { requireSession } from "@/lib/auth";
import { getUploadPageState } from "@/lib/data";

const parserFlow = [
  "Upload a prescription image or captured scan.",
  "OCR extracts the readable text lines.",
  "The parser expands abbreviations like OD and BD into structured fields.",
  "The scheduler links each medicine to safe timing and a physical slot bundle.",
  "The caregiver reviews the result before saving it to the patient profile."
];

export default async function UploadPage({
  searchParams
}: {
  searchParams?: {
    patient?: string;
  };
}) {
  const session = await requireSession(["caregiver"]);
  const state = await getUploadPageState(session, searchParams?.patient);

  return (
    <AppShell currentPath="/upload" session={session}>
      <PageIntro
        eyebrow="Prescription Intake"
        title={state.activePatient ? `Import a prescription for ${state.activePatient.name}` : "Choose a patient to import a prescription"}
        description="This screen is designed for the caregiver workflow: capture the prescription, review the parsed result, then turn it into a slot-linked medicine plan."
        accent="caregiver"
      />

      <PatientSwitcher patients={state.linkedPatients} activePatientId={state.activePatient?.id} basePath="/upload" />

      {state.activePatient ? (
        <UploadForm patientId={state.activePatient.id} patientName={state.activePatient.name} />
      ) : (
        <SectionCard
          eyebrow="No Patient Linked"
          title="Prescription intake starts after connection"
          description="The parser saves medications into a specific patient's live plan."
        >
          <div className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Accept a patient invite from the Connections page, then return here to parse and save the prescription.
          </div>
        </SectionCard>
      )}

      <SectionCard
        eyebrow="Why This Matters"
        title="A safer bridge from paper prescription to smart dispenser"
        description="The parser is not just extracting text. It is converting clinical shorthand into schedule-ready, hardware-aware data."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {parserFlow.map((step, index) => (
              <div key={step} className="flex items-start gap-4 rounded-[28px] bg-slate-50 p-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-600">{step}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[28px] bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_100%)] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Output Contract</p>
            <p className="mt-3 text-sm leading-6 text-white/80">
              Return only medicine name, dosage, frequency, duration, timing, meal relation, and confidence.
              This keeps the scheduler deterministic and hardware-safe.
            </p>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
