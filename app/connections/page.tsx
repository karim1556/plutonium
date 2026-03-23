import { AppShell } from "@/components/app-shell";
import { AcceptInviteForm } from "@/components/accept-invite-form";
import { CreateInvitePanel } from "@/components/create-invite-panel";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { requireSession, getLinkedCaregivers, getLinkedPatients } from "@/lib/auth";

export default async function ConnectionsPage({
  searchParams
}: {
  searchParams?: {
    invite?: string;
    linked?: string;
  };
}) {
  const session = await requireSession();
  const linkedCaregivers = session.role === "patient" ? await getLinkedCaregivers(session.id) : [];
  const linkedPatients = session.role === "caregiver" ? await getLinkedPatients(session.id) : [];

  return (
    <AppShell currentPath="/connections" session={session}>
      <PageIntro
        eyebrow="Connections"
        title={session.role === "patient" ? "Manage your care circle" : "Connect yourself to a patient"}
        description={
          session.role === "patient"
            ? "Generate a secure invite code so a caregiver can join your care circle."
            : "Use a patient invite code to link your caregiver account to the right person."
        }
        accent={session.role}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <SectionCard
          eyebrow={session.role === "patient" ? "Invite" : "Connect"}
          title={session.role === "patient" ? "Share an invite with your caregiver" : "Enter the patient invite code"}
          description={
            session.role === "patient"
              ? "This creates a real database-backed invitation. The caregiver can use the code during sign-up or later."
              : "Once accepted, the caregiver dashboard can load the patient’s live care data."
          }
        >
          {session.role === "patient" ? (
            <CreateInvitePanel />
          ) : (
            <AcceptInviteForm initialToken={searchParams?.invite} />
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Linked Accounts"
          title={session.role === "patient" ? "Caregivers already linked to you" : "Patients already linked to you"}
          description="These relationships are read from the database and update as invites are accepted."
        >
          <div className="space-y-4">
            {(session.role === "patient" ? linkedCaregivers : linkedPatients).length ? (
              (session.role === "patient" ? linkedCaregivers : linkedPatients).map((profile) => (
                <article key={profile.id} className="rounded-[28px] bg-slate-50 p-5">
                  <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {profile.role} {profile.phone ? `• ${profile.phone}` : ""}
                  </p>
                </article>
              ))
            ) : (
              <article className="rounded-[28px] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                {session.role === "patient"
                  ? "No caregivers linked yet. Generate an invite and share it."
                  : "No patients linked yet. Enter a patient invite code to connect."}
              </article>
            )}

            {searchParams?.linked ? (
              <p className="text-sm font-medium text-emerald-700">The latest link action completed successfully.</p>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
