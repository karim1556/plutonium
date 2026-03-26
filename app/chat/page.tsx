import { AppShell } from "@/components/app-shell";
import { VoiceChatPanel } from "@/components/voice-chat-panel";
import { PageIntro } from "@/components/page-intro";
import { PatientSwitcher } from "@/components/patient-switcher";
import { SectionCard } from "@/components/section-card";
import { requireSession } from "@/lib/auth";
import { getChatState } from "@/lib/data";

export default async function ChatPage({
  searchParams
}: {
  searchParams?: {
    patient?: string;
  };
}) {
  const session = await requireSession();
  const state = await getChatState(session, searchParams?.patient);

  return (
    <AppShell
      currentPath="/chat"
      contextPatientId={session.role === "caregiver" ? state.activePatient?.id : undefined}
      session={session}
    >
      <PageIntro
        eyebrow={session.role === "patient" ? "Voice & Text Chat" : "Care Assistant"}
        title={
          session.role === "patient"
            ? "Ask for help using voice or text"
            : state.activePatient
              ? `Chat assistant for ${state.activePatient.name}`
              : "Connect a patient to start using the care assistant"
        }
        description={
          session.role === "patient"
            ? "Speak or type your questions. MedAssist uses your medication schedule and activity to give personalized, supportive answers."
            : "Use voice or text to ask about adherence, risks, and get AI-powered insights. Responses are read aloud automatically."
        }
        accent={session.role}
      />

      {session.role === "caregiver" ? (
        <PatientSwitcher patients={state.linkedPatients} activePatientId={state.activePatient?.id} basePath="/chat" />
      ) : null}

      {session.role === "caregiver" && !state.activePatient ? (
        <SectionCard
          eyebrow="No Patient Linked"
          title="The assistant needs patient context"
          description="Link a patient from the Connections page so answers can use real schedules and recent logs."
        >
          <div className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Once a patient is connected, this assistant will answer with their live schedule, refill status, and recent misses.
          </div>
        </SectionCard>
      ) : (
        <>
          <VoiceChatPanel
            schedules={state.schedules}
            logs={state.logs}
            medications={state.medications}
            role={state.role}
            promptStarters={state.promptStarters}
            patientName={state.activePatient?.name}
          />

          <SectionCard
            eyebrow="Prompt Design"
            title={session.role === "patient" ? "Why these answers feel specific" : "What makes the answers operational"}
            description="These context blocks are what stop the assistant from behaving like a generic chatbot."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[
                "Upcoming schedule bundles, slot numbers, and meal timing.",
                "Recent logs including missed, delayed, and confirmed pickup events.",
                "Safety instructions such as no double-dose rule and low-stock warnings."
              ].map((item) => (
                <article key={item} className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  {item}
                </article>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </AppShell>
  );
}
