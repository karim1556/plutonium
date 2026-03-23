interface TimelinePoint {
  label: string;
  status: string;
}

interface TimelineRailProps {
  items: TimelinePoint[];
}

const statusClasses: Record<string, string> = {
  taken: "bg-emerald-500",
  delayed: "bg-amber-500",
  missed: "bg-rose-500",
  pending: "bg-slate-300"
};

export function TimelineRail({ items }: TimelineRailProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-7">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.status}`}
          className="rounded-[26px] border border-white/80 bg-slate-50/90 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.05)]"
        >
          <div className={`h-2 rounded-full ${statusClasses[item.status] ?? "bg-slate-300"}`} />
          <p className="mt-4 text-sm font-semibold text-slate-900">{item.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{item.status}</p>
        </div>
      ))}
    </div>
  );
}
