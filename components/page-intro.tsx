interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "patient" | "caregiver" | "neutral";
}

export function PageIntro({ eyebrow, title, description, accent = "neutral" }: PageIntroProps) {
  const accentClasses =
    accent === "patient"
      ? "from-sky-100 via-white to-emerald-50"
      : accent === "caregiver"
        ? "from-amber-50 via-white to-rose-50"
        : "from-white via-sky-50 to-emerald-50";

  return (
    <div
      className={`grid gap-4 rounded-[36px] border border-white/80 bg-gradient-to-br ${accentClasses} p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end`}
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p>
        <h2 className="font-serif text-4xl leading-tight text-slate-950 sm:text-5xl">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
      </div>
      <div className="rounded-[30px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Focus</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Clean guidance first, operational detail second. That keeps the patient experience calm and the
          caregiver experience actionable.
        </p>
      </div>
    </div>
  );
}
