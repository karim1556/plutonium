"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, HeartPulse, Loader2, ShieldPlus } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { AppRole } from "@/types/auth";

const roleInfo = {
  patient: {
    label: "Patient",
    description: "Choose this if the person taking the medicine is creating the account.",
    icon: HeartPulse
  },
  caregiver: {
    label: "Caregiver",
    description: "Choose this if the person monitoring and supporting the patient is creating the account.",
    icon: ShieldPlus
  }
} as const;

interface SignUpFormProps {
  initialInviteCode?: string;
}

export function SignUpForm({ initialInviteCode = "" }: SignUpFormProps) {
  const [role, setRole] = useState<AppRole>(initialInviteCode ? "caregiver" : "patient");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        const supabase = createBrowserSupabaseClient();

        if (!supabase) {
          setError("Supabase environment variables are missing. Add them to .env.local first.");
          return;
        }

        const redirectUrl = new URL("/auth/callback", window.location.origin);
        redirectUrl.searchParams.set("next", "/dashboard");

        if (inviteCode.trim()) {
          redirectUrl.searchParams.set("invite", inviteCode.trim());
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl.toString(),
            data: {
              name,
              role,
              phone
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          if (role === "caregiver" && inviteCode.trim()) {
            await fetch("/api/invitations/accept", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                token: inviteCode.trim()
              })
            });
          }

          window.location.assign(inviteCode.trim() ? "/connections?linked=1" : "/dashboard");
          return;
        }

        setMessage(
          "Account created. Check your email to confirm the account, then sign in. If you entered an invite code, use it on the Connections page after login."
        );
      })();
    });
  };

  return (
    <div className="rounded-[36px] bg-white/92 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">Create Account</p>
      <h2 className="mt-3 font-serif text-4xl leading-tight text-slate-900">Create a real patient or caregiver account</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        This form creates a real Supabase Auth account and writes the role and profile details into the
        database.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(Object.keys(roleInfo) as AppRole[]).map((entryRole) => {
          const Icon = roleInfo[entryRole].icon;
          const active = role === entryRole;

          return (
            <button
              key={entryRole}
              type="button"
              onClick={() => setRole(entryRole)}
              className={`rounded-[28px] border p-5 text-left transition ${
                active
                  ? "border-sky-600 bg-sky-50 shadow-[0_12px_40px_rgba(14,165,233,0.16)]"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-2xl p-3 ${active ? "bg-sky-600 text-white" : "bg-white text-slate-700"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{roleInfo[entryRole].label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{roleInfo[entryRole].description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Full name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          />
        </label>
      </div>

      {role === "caregiver" ? (
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Patient invite code or link token
          <input
            type="text"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            placeholder="Optional during sign-up"
            className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          />
        </label>
      ) : null}

      {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Create Account
      </button>

      <p className="mt-5 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-sky-700 hover:text-sky-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}
