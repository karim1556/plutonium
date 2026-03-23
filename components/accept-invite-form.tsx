"use client";

import { useState, useTransition } from "react";
import { Link2, Loader2 } from "lucide-react";

interface AcceptInviteFormProps {
  initialToken?: string;
}

export function AcceptInviteForm({ initialToken }: AcceptInviteFormProps) {
  const [token, setToken] = useState(initialToken ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setMessage(null);
    setError(null);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token
          })
        });

        const payload = (await response.json()) as {
          error?: string;
          patient?: {
            name?: string;
          };
        };

        if (!response.ok) {
          setError(payload.error ?? "Unable to accept invite.");
          return;
        }

        setMessage(
          payload.patient?.name
            ? `Connected successfully to ${payload.patient.name}.`
            : "Connected successfully."
        );
      })();
    });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Patient invite code
        <input
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value.toUpperCase())}
          className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
        />
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        Connect to Patient
      </button>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
    </div>
  );
}
