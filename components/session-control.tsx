"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { SessionUser } from "@/types/auth";

interface SessionControlProps {
  session: SessionUser;
}

export function SessionControl({ session }: SessionControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      void (async () => {
        const supabase = createBrowserSupabaseClient();
        await supabase?.auth.signOut();
        router.push("/login");
        router.refresh();
      })();
    });
  };

  return (
    <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-800">{session.name}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{session.role}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        Logout
      </button>
    </div>
  );
}
