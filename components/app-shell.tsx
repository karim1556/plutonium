import Link from "next/link";
import type { ReactNode } from "react";
import {
  ActivitySquare,
  CalendarRange,
  ClipboardPlus,
  Cpu,
  HeartHandshake,
  LayoutDashboard,
  Link2,
  MessageCircleHeart,
  ShieldCheck
} from "lucide-react";
import { SessionControl } from "@/components/session-control";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";

const navigationByRole = {
  patient: [
    { href: "/patient", label: "Today", icon: LayoutDashboard },
    { href: "/connections", label: "Care Circle", icon: Link2 },
    { href: "/chat", label: "Ask For Help", icon: MessageCircleHeart },
    { href: "/device", label: "My Device", icon: Cpu }
  ],
  caregiver: [
    { href: "/caregiver", label: "Care Overview", icon: HeartHandshake },
    { href: "/connections", label: "Connections", icon: Link2 },
    { href: "/upload", label: "Add Prescription", icon: ClipboardPlus },
    { href: "/schedule", label: "Schedule", icon: CalendarRange },
    { href: "/analytics", label: "Insights", icon: ActivitySquare },
    { href: "/device", label: "Device", icon: Cpu },
    { href: "/chat", label: "Assistant", icon: ShieldCheck }
  ]
} as const;

interface AppShellProps {
  children: ReactNode;
  currentPath?: string;
  session: SessionUser;
}

export function AppShell({ children, currentPath, session }: AppShellProps) {
  const navigation = navigationByRole[session.role];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef7f2_100%)] text-slate-900">
      <div className="mx-auto max-w-[1540px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-5 rounded-[36px] border border-white/80 bg-white/82 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">MedAssist Pro</p>
              <h1 className="mt-3 font-serif text-3xl leading-tight">
                {session.role === "patient" ? "Your medicines, made simpler." : "Caregiving, without the guesswork."}
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/78">
                {session.role === "patient"
                  ? "Clear steps, larger actions, and gentle support when it is time to take a dose."
                  : "See risk early, support remotely, and keep your loved one on track."}
              </p>
            </div>

            <div className="rounded-[28px] bg-sky-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-800/70">Signed in as</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{session.name}</p>
              <p className="mt-1 text-sm text-slate-600">{session.relationLabel ?? session.role}</p>
            </div>

            <nav className="grid gap-2">
              {navigation.map(({ href, label, icon: Icon }) => {
                const active = currentPath === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "group inline-flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold transition",
                      active
                        ? "bg-slate-900 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
                        : "bg-slate-50 text-slate-700 hover:bg-sky-50 hover:text-slate-900"
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-2xl p-2 transition",
                        active ? "bg-white/10 text-white" : "bg-white text-slate-500 group-hover:text-sky-700"
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
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {session.role === "patient" ? "Small reminder" : "Care note"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {session.role === "patient"
                    ? "If anything feels confusing, use the assistant before skipping or doubling a dose."
                    : "Start with refill risk, device readiness, and evening adherence. Those are usually the fastest interventions."}
                </p>
              </div>
              <SessionControl session={session} />
            </div>
          </aside>

          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
