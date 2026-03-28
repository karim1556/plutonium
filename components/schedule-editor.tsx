"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";
import type { Slot } from "@/types/slot";
import { StatusPill } from "@/components/status-pill";

interface ScheduleEditorProps {
  initialSchedules: ScheduleItem[];
  medications: Medication[];
  slots: Slot[];
  logs: DoseLog[];
  patientId?: string | null;
  initialRecommendations?: ScheduleResponse["recommendations"];
}

interface ScheduleResponse {
  schedules: ScheduleItem[];
  recommendations: Array<{
    scheduleId: string;
    canReschedule: boolean;
    suggestedTime?: string;
    reason?: string;
  }>;
}

export function ScheduleEditor({
  initialSchedules,
  medications,
  slots,
  logs,
  patientId,
  initialRecommendations
}: ScheduleEditorProps) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [response, setResponse] = useState<ScheduleResponse | null>(
    initialRecommendations ? { schedules: initialSchedules, recommendations: initialRecommendations } : null
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateTime = (scheduleId: string, time: string) => {
    setSchedules((current) =>
      current.map((schedule) => (schedule.id === scheduleId ? { ...schedule, time } : schedule))
    );
  };

  const regenerate = () => {
    setFeedback(null);

    startTransition(() => {
      void (async () => {
        const result = await fetch("/api/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            patientId,
            medications,
            slots,
            logs,
            schedules
          })
        });

        const payload = (await result.json()) as ScheduleResponse & { error?: string };

        if (!result.ok) {
          setFeedback(payload.error ?? "Unable to regenerate schedule.");
          return;
        }

        setSchedules(payload.schedules);
        setResponse(payload);
      })();
    });
  };

  const save = () => {
    if (!patientId || !schedules.length) {
      return;
    }

    setFeedback(null);

    startTransition(() => {
      void (async () => {
        const result = await fetch("/api/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            patientId,
            schedules,
            persist: true
          })
        });

        const payload = (await result.json()) as {
          error?: string;
          message?: string;
          schedules?: ScheduleItem[];
        };

        if (!result.ok) {
          setFeedback(payload.error ?? "Unable to save schedule.");
          return;
        }

        if (payload.schedules?.length) {
          setSchedules(payload.schedules);
        }

        setFeedback(payload.message ?? "Schedule saved.");
      })();
    });
  };

  const handleReset = () => {
    if (!confirm("Are you sure you want to completely erase ALL medications, slots, and schedules for this user? This cannot be undone.")) return;
    
    setFeedback("Resetting data...");
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/schedule/reset${patientId ? `?patient=${patientId}` : ''}`, {
            method: "POST"
          });
          
          if (res.ok) {
            setFeedback("All data cleared. Reloading...");
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setFeedback("Failed to reset tables.");
          }
        } catch (e) {
          setFeedback("Error resetting data.");
        }
      })();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Slot-aware schedule editor</p>
            <p className="text-sm text-slate-500">
              Keep medicine bundles mapped to the correct hardware slot while tuning time windows.
            </p>
          </div>
          <button
            type="button"
            onClick={regenerate}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-600 hover:text-sky-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Regenerate
          </button>
        </div>

        <div className="space-y-4">
          {schedules.length ? (
            schedules.map((schedule) => (
              <article key={schedule.id} className="rounded-[28px] border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-ink">Slot {schedule.slotId}</p>
                      <StatusPill value={schedule.status} />
                    </div>
                    <p className="text-sm text-slate-600">{schedule.medicines.join(" + ")}</p>
                  </div>
                  <label className="text-sm font-medium text-slate-700">
                    Time
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(event) => updateTime(schedule.id, event.target.value)}
                      className="ml-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                    />
                  </label>
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              No schedule bundles exist yet. Import medications and register slots, then regenerate the plan.
            </article>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={save}
            disabled={isPending || !patientId || !schedules.length}
            className="inline-flex items-center gap-2 rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Save Schedule
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending || !patientId}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Reset All Device Tables
          </button>
          {feedback ? <p className="self-center text-sm font-medium text-slate-600">{feedback}</p> : null}
        </div>
      </div>

      <div className="rounded-[34px] bg-[linear-gradient(160deg,#0f172a_0%,#92400e_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Scheduler Output</p>
        {response ? (
          <div className="mt-5 space-y-4">
            {response.recommendations.map((recommendation) => (
              <div key={recommendation.scheduleId} className="rounded-[28px] bg-white/10 p-4">
                <p className="text-sm font-semibold">{recommendation.scheduleId}</p>
                <p className="mt-2 text-sm text-white/75">
                  {recommendation.canReschedule
                    ? `Reschedule allowed${recommendation.suggestedTime ? ` until ${recommendation.suggestedTime}` : ""}.`
                    : recommendation.reason}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-white/70">
            Regeneration returns schedule bundles plus safe-gap guidance for missed doses.
          </p>
        )}
      </div>
    </div>
  );
}
