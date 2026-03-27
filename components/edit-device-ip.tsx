"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Edit3, X, Check } from "lucide-react";

interface EditDeviceIpProps {
  patientId: string;
  currentIp: string;
  firmwareVersion: string | null;
  requiresFingerprint: boolean;
}

export function EditDeviceIp({
  patientId,
  currentIp,
  firmwareVersion,
  requiresFingerprint
}: EditDeviceIpProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [ipAddress, setIpAddress] = useState(currentIp);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (!ipAddress.trim() || ipAddress === currentIp) {
      setIsEditing(false);
      return;
    }

    setError(null);
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

        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Failed to update IP address.");
          return;
        }

        setIsEditing(false);
        router.refresh();
      })();
    });
  };

  if (!isEditing) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm leading-6 text-slate-600">
        IP: {currentIp}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          title="Change IP Address"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">IP:</label>
        <input
          type="text"
          value={ipAddress}
          onChange={(e) => setIpAddress(e.target.value)}
          disabled={isPending}
          className="rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none transition focus:border-ocean w-36"
        />
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded p-1 text-emerald-600 hover:bg-emerald-50 transition"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setIpAddress(currentIp);
            setError(null);
            setIsEditing(false);
          }}
          disabled={isPending}
          className="rounded p-1 text-red-500 hover:bg-red-50 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
