"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Router } from "lucide-react";

interface DeviceRegistrationFormProps {
  patientId: string;
  initialIpAddress?: string | null;
  initialFirmwareVersion?: string | null;
  initialRequiresFingerprint?: boolean;
}

export function DeviceRegistrationForm({
  patientId,
  initialIpAddress,
  initialFirmwareVersion,
  initialRequiresFingerprint = true
}: DeviceRegistrationFormProps) {
  const router = useRouter();
  const [ipAddress, setIpAddress] = useState(initialIpAddress ?? "");
  const [firmwareVersion, setFirmwareVersion] = useState(initialFirmwareVersion ?? "v1.0.0");
  const [requiresFingerprint, setRequiresFingerprint] = useState(initialRequiresFingerprint);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/device/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            patientId,
            ipAddress,
            firmwareVersion,
            requiresFingerprint
          })
        });

        const payload = (await response.json()) as {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          setError(payload.error ?? "Unable to save device.");
          return;
        }

        setMessage(payload.message ?? "Device saved successfully.");
        router.refresh();
      })();
    });
  };

  return (
    <div className="space-y-4 rounded-[28px] bg-slate-50 p-5">
      <label className="block text-sm font-medium text-slate-700">
        Device IP address
        <input
          type="text"
          value={ipAddress}
          onChange={(event) => setIpAddress(event.target.value)}
          placeholder="192.168.1.40"
          className="mt-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Firmware version
        <input
          type="text"
          value={firmwareVersion}
          onChange={(event) => setFirmwareVersion(event.target.value)}
          className="mt-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
        />
      </label>

      <label className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={requiresFingerprint}
          onChange={(event) => setRequiresFingerprint(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        Require fingerprint before dispense
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Router className="h-4 w-4" />}
        Save Device
      </button>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
    </div>
  );
}
