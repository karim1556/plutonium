import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <article className="rounded-[30px] border border-[var(--sage-line)] bg-white/94 p-6 shadow-[0_20px_60px_rgba(23,33,37,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
        </div>
        {icon ? <div className="rounded-[20px] bg-[#f3f8f5] p-3 text-slate-900">{icon}</div> : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{hint}</p>
    </article>
  );
}
