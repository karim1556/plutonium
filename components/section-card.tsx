import type { ReactNode } from "react";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionCard({ eyebrow, title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-[34px] border border-white/80 bg-white/88 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="mb-5 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p>
        ) : null}
        <h2 className="font-serif text-2xl text-slate-950 sm:text-3xl">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
