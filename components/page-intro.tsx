interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "patient" | "caregiver" | "neutral";
}

export function PageIntro({ eyebrow, title, description, accent = "neutral" }: PageIntroProps) {
  const accentClasses =
    accent === "patient"
      ? {
          shell: "from-[#eef8ff] via-white to-[#f2fbf5]",
          glow: "from-sky-200/70 via-emerald-100/30 to-transparent",
          dot: "bg-sky-500",
          note: "Large actions, calmer guidance."
        }
      : accent === "caregiver"
        ? {
            shell: "from-[#fff6ea] via-white to-[#fff1ef]",
            glow: "from-amber-200/70 via-rose-100/30 to-transparent",
            dot: "bg-amber-500",
            note: "Watch the highest-risk item first."
          }
        : {
            shell: "from-white via-[#f4f9f6] to-[#eef7ff]",
            glow: "from-emerald-100/60 via-sky-100/30 to-transparent",
            dot: "bg-emerald-500",
            note: "Start with what matters now."
          };

  return (
    <section
      className={`glass-panel relative overflow-hidden bg-gradient-to-br ${accentClasses.shell} p-6 sm:p-7 lg:p-8`}
    >
      <div className={`absolute inset-y-0 right-0 hidden w-[34%] bg-gradient-to-l ${accentClasses.glow} lg:block`} />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{eyebrow}</p>
          <h2 className="font-serif text-4xl leading-tight text-slate-950 sm:text-5xl">{title}</h2>
          <p className="max-w-2xl text-base leading-8 text-slate-600">{description}</p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-full border border-white/90 bg-white/88 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${accentClasses.dot}`} />
          {accentClasses.note}
        </div>
      </div>
    </section>
  );
}
