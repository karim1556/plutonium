"use client";

import { useState, useTransition } from "react";
import { Loader2, Play } from "lucide-react";

interface DispenseButtonProps {
  slotId: number;
  deviceIP: string;
  label?: string;
  deviceId?: string;
  patientId?: string;
}

export function DispenseButton({ slotId, deviceIP, label = "Dispense Now", deviceId, patientId }: DispenseButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDispense = () => {
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/dispense", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            slot: slotId,
            deviceIP,
            deviceId,
            patientId
          })
        });

        const payload = (await response.json()) as { message?: string };
        setMessage(payload.message ?? "Dispense request completed.");
      })();
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleDispense}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {label}
      </button>
      {message ? <p className="text-sm leading-6 text-slate-600">{message}</p> : null}
    </div>
  );
}
