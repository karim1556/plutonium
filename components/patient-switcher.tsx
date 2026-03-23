import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PatientOption } from "@/lib/data";

interface PatientSwitcherProps {
  patients: PatientOption[];
  activePatientId?: string | null;
  basePath: string;
}

export function PatientSwitcher({ patients, activePatientId, basePath }: PatientSwitcherProps) {
  if (patients.length <= 1) {
    return null;
  }

  return (
    <div className="rounded-[30px] border border-white/80 bg-white/88 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Active Patient</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {patients.map((patient) => {
          const active = patient.id === activePatientId;

          return (
            <Link
              key={patient.id}
              href={{
                pathname: basePath,
                query: { patient: patient.id }
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                  : "bg-slate-50 text-slate-700 hover:bg-sky-50 hover:text-slate-900"
              )}
            >
              {patient.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
