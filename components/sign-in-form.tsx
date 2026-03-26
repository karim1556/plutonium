"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event?: FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    startTransition(() => {
      void (async () => {
        const supabase = createBrowserSupabaseClient();

        if (!supabase) {
          setError("Supabase environment variables are missing. Add them to .env.local first.");
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        window.location.assign("/dashboard");
      })();
    });
  };

  return (
    <div className="rounded-[36px] bg-white/92 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">Sign In</p>
      <h2 className="mt-3 font-serif text-4xl leading-tight text-slate-900">Welcome back</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        Sign in with the real patient or caregiver account you created in Supabase Auth.
      </p>

      <form onSubmit={submit} className="mt-6 grid gap-4" noValidate>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
          />
        </label>

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Sign In
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-sky-700 hover:text-sky-800">
          Create an account
        </Link>
      </p>
    </div>
  );
}
