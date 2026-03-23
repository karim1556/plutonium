import { redirect } from "next/navigation";
import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { SignUpForm } from "@/components/sign-up-form";
import { getCurrentSessionUser } from "@/lib/auth";

export default async function SignUpPage({
  searchParams
}: {
  searchParams?: {
    invite?: string;
  };
}) {
  const session = await getCurrentSessionUser();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#edf7f1_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 grid gap-6 rounded-[40px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-sky-700">MedAssist Pro</p>
            <h1 className="font-serif text-5xl leading-tight text-slate-950 sm:text-6xl">
              Create a real patient or caregiver account.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Sign-up writes role-aware profile data to Supabase so the right dashboard, permissions, and
              patient-caregiver links can work without manual shortcuts.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            {[
              {
                icon: HeartHandshake,
                title: "Patient sign-up",
                body: "Patients create the account they will use for daily dose guidance."
              },
              {
                icon: ShieldCheck,
                title: "Caregiver sign-up",
                body: "Caregivers create their own account, then connect to a patient using an invite code."
              },
              {
                icon: Sparkles,
                title: "Invite-aware flow",
                body: "Caregivers can optionally enter a patient invite code during sign-up and complete linking after auth."
              }
            ].map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-[28px] bg-slate-50 p-5">
                <div className="rounded-2xl bg-white p-3 text-sky-700 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>

        <SignUpForm initialInviteCode={searchParams?.invite} />
      </div>
    </div>
  );
}
