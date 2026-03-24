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
    <div className="glass-panel p-4">
      <p className="text-sm font-semibold text-slate-500">Active patient</p>
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
                "rounded-full px-5 py-3 text-sm font-semibold transition",
                active
                  ? "bg-slate-900 text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)]"
                  : "bg-[#f5f7f2] text-slate-700 hover:bg-white hover:text-slate-900"
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
