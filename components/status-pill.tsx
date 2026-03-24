import { cn, titleCase } from "@/lib/utils";

interface StatusPillProps {
  value: string;
}

const tones: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  due_soon: "bg-amber-100 text-amber-800",
  taken: "bg-emerald-100 text-emerald-800",
  delayed: "bg-orange-100 text-orange-800",
  missed: "bg-rose-100 text-rose-800",
  info: "bg-sky-100 text-sky-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-rose-100 text-rose-800",
  online: "bg-emerald-100 text-emerald-800",
  offline: "bg-rose-100 text-rose-800",
  dispensing: "bg-amber-100 text-amber-800",
  alert: "bg-rose-100 text-rose-800"
};

export function StatusPill({ value }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-[0.04em]",
        tones[value] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {titleCase(value)}
    </span>
  );
}
