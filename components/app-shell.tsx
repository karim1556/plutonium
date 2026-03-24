import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  type LucideIcon
} from "lucide-react";
import type { UrlObject } from "url";
import { SessionControl } from "@/components/session-control";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPaths?: string[];
  preservePatientContext?: boolean;
}

const navigationByRole: Record<SessionUser["role"], NavigationItem[]> = {
  patient: [
    { href: "/patient", label: "Today", icon: LayoutDashboard, matchPaths: ["/patient"] },
    {
      href: "/support",
      label: "Support",
      icon: LifeBuoy,
      matchPaths: ["/support", "/chat", "/device"]
    },
    { href: "/connections", label: "Care Circle", icon: Link2, matchPaths: ["/connections"] }
  ],
  caregiver: [
    { href: "/caregiver", label: "Care Overview", icon: HeartHandshake, matchPaths: ["/caregiver"] },
    {
      href: "/support",
      label: "Support Center",
      icon: LifeBuoy,
      matchPaths: ["/support", "/upload", "/schedule", "/analytics", "/device", "/chat"],
      preservePatientContext: true
    },
    { href: "/connections", label: "Connections", icon: Link2, matchPaths: ["/connections"] }
  ]
} as const;

interface AppShellProps {
  children: ReactNode;
  currentPath?: string;
  contextPatientId?: string | null;
  session: SessionUser;
}

export function AppShell({ children, currentPath, contextPatientId, session }: AppShellProps) {
  const navigation = navigationByRole[session.role];
  const roleHeadline =
    session.role === "patient" ? "One clear medicine step at a time." : "Care decisions with less noise.";
  const roleDescription =
    session.role === "patient"
      ? "The dashboard stays calm. Support and extra tools live in one separate place."
      : "Keep the overview focused here, then use Support for schedules, analytics, device tools, and assistance.";
  const roleTip =
    session.role === "patient"
      ? "If you feel unsure, open Support before taking more medicine."
      : "Start with the patient, the next dose, and the highest-risk task.";

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="glass-panel flex flex-col gap-5 p-5 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
            <div className="overflow-hidden rounded-[30px] bg-[linear-gradient(155deg,#173d35_0%,#2b6a5e_56%,#f1d7b0_100%)] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/72">MedAssist Pro</p>
              <h1 className="mt-3 font-serif text-[2rem] leading-tight">{roleHeadline}</h1>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/80">{roleDescription}</p>
            </div>

            <div className="rounded-[28px] border border-[var(--sage-line)] bg-[#f8fbf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Signed in as</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{session.name}</p>
              <p className="mt-1 text-sm text-slate-600">{session.relationLabel ?? session.role}</p>
            </div>

            <nav className="grid gap-2">
              {navigation.map(({ href, label, icon: Icon, matchPaths, preservePatientContext }) => {
                const active = Boolean(currentPath && (currentPath === href || matchPaths?.includes(currentPath)));
                const navHref =
                  preservePatientContext && session.role === "caregiver" && contextPatientId
                    ? { pathname: href, query: { patient: contextPatientId } }
                    : href;

                return (
                  <Link
                    key={href}
                    href={navHref as Route | UrlObject}
                    className={cn(
                      "group inline-flex items-center gap-3 rounded-[24px] px-4 py-3.5 text-sm font-semibold transition",
                      active
                        ? "bg-slate-900 text-white shadow-[0_18px_46px_rgba(15,23,42,0.18)]"
                        : "bg-[#f5f7f2] text-slate-700 hover:bg-white hover:text-slate-950"
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-2xl p-2.5 transition",
                        active ? "bg-white/10 text-white" : "bg-white text-slate-500 group-hover:text-slate-900"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-4">
              <div className="rounded-[28px] border border-[var(--sage-line)] bg-[#fbfcf9] p-4">
                <p className="text-sm font-semibold text-slate-900">Keep it simple</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{roleTip}</p>
              </div>
              <SessionControl session={session} />
            </div>
          </aside>

          <main className="space-y-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
