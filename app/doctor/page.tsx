import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/auth";
import { getCaregiverDashboardState, type PatientOption } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  FileText,
  Download
} from "lucide-react";

export default async function DoctorPortalPage() {
  const session = await getCurrentSessionUser();

  if (!session) {
    redirect("/login");
  }

  // Doctor portal is accessible to caregivers (doctors/nurses)
  if (session.role !== "caregiver") {
    redirect("/patient");
  }

  const state = await getCaregiverDashboardState(session);

  // Calculate stats using linkedPatients
  const totalPatients = state.linkedPatients.length;
  const currentPatient = state.patient;

  return (
    <AppShell session={session} currentPath="/doctor">
      <div className="space-y-6">
        <PageIntro
          eyebrow="Doctor Portal"
          title="Patient Management"
          description="Monitor all patients, view adherence trends, and manage interventions from a single dashboard."
        />

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Total Patients"
            value={String(totalPatients)}
            hint="Active patients under your care"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Current Adherence"
            value={`${state.adherence.score}%`}
            hint="Active patient's adherence"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            label="Open Tasks"
            value={String(state.openTasks.length)}
            hint="Tasks needing attention"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            label="Risk Flags"
            value={String(state.risks.flags.length)}
            hint="Safety alerts detected"
            icon={<Activity className="h-5 w-5" />}
          />
        </div>

        {/* Patient List */}
        <SectionCard
          eyebrow="Patients"
          title="Linked Patients"
          description="Select a patient to view their medication adherence and manage their care."
        >
          <div className="space-y-3">
            {state.linkedPatients.length === 0 ? (
              <p className="text-sm text-slate-500">
                No patients linked yet. Patients can invite you using a connection code.
              </p>
            ) : (
              state.linkedPatients.map((patient: PatientOption) => (
                <article
                  key={patient.id}
                  className={`rounded-2xl border bg-white p-4 hover:border-blue-300 transition-colors ${
                    currentPatient?.id === patient.id ? "border-blue-400" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {patient.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {patient.role === "patient" ? "Patient" : "Caregiver"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {currentPatient?.id === patient.id && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600">
                          Active
                        </span>
                      )}

                      <a
                        href={`/caregiver?patient=${patient.id}`}
                        className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard
          eyebrow="Actions"
          title="Quick Actions"
          description="Common tasks for managing patient care."
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <a
              href="/api/export?format=csv&includeHistory=true"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 transition-colors"
            >
              <Download className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-slate-900">Export All Data</p>
                <p className="text-sm text-slate-500">Download CSV report</p>
              </div>
            </a>

            <a
              href="/api/export?format=fhir"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 transition-colors"
            >
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-slate-900">FHIR Export</p>
                <p className="text-sm text-slate-500">HL7 compatible format</p>
              </div>
            </a>

            <a
              href="/analytics"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 transition-colors"
            >
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-slate-900">Analytics</p>
                <p className="text-sm text-slate-500">View detailed trends</p>
              </div>
            </a>
          </div>
        </SectionCard>

        {/* Current Patient Summary */}
        {currentPatient && (
          <SectionCard
            eyebrow="Current Patient"
            title={`${currentPatient.name}'s Summary`}
            description="Quick overview of the active patient's status."
          >
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4">
                <p className="text-sm font-medium text-slate-600">Medications</p>
                <p className="text-lg font-semibold text-slate-900">
                  {state.medications.length} active medications
                </p>
              </div>

              {state.predictions.length > 0 && (
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-700">Predictions</p>
                  <ul className="mt-2 space-y-1">
                    {state.predictions.slice(0, 3).map((pred, idx) => (
                      <li key={idx} className="text-sm text-slate-600">
                        {pred.label}: {pred.recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}
