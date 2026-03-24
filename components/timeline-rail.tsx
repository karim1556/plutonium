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
          className="rounded-[28px] border border-[var(--sage-line)] bg-white p-5 shadow-[0_16px_45px_rgba(23,33,37,0.05)]"
        >
          <div className={`h-2 rounded-full ${statusClasses[item.status] ?? "bg-slate-300"}`} />
          <p className="mt-4 text-base font-semibold text-slate-900">{item.label}</p>
          <p className="mt-1 text-sm text-slate-500">{item.status}</p>
        </div>
      ))}
    </div>
  );
}
