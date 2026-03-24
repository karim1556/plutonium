import type { ReactNode } from "react";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionCard({ eyebrow, title, description, children }: SectionCardProps) {
  return (
    <section className="glass-panel p-6 sm:p-7">
      <div className="mb-6 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
        ) : null}
        <h2 className="font-serif text-[2rem] leading-tight text-slate-950">{title}</h2>
        {description ? <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
