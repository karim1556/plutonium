"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, Loader2 } from "lucide-react";

interface InviteResult {
  token: string;
  inviteUrl: string;
  expiresAt: string;
}

export function CreateInvitePanel() {
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generateInvite = () => {
    setError(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/invitations/create", {
          method: "POST"
        });

        const payload = (await response.json()) as {
          error?: string;
          invite?: InviteResult;
        };

        if (!response.ok || !payload.invite) {
          setError(payload.error ?? "Unable to create invite.");
          return;
        }

        setInvite(payload.invite);
      })();
    });
  };

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={generateInvite}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        Generate Caregiver Invite
      </button>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

      {invite ? (
        <div className="space-y-4 rounded-[28px] bg-sky-50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Invite code</p>
            <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-slate-950">{invite.token}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => copyValue(invite.token, "Code copied")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
            >
              <Copy className="h-4 w-4" />
              Copy Code
            </button>
            <button
              type="button"
              onClick={() => copyValue(invite.inviteUrl, "Link copied")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700"
            >
              <Copy className="h-4 w-4" />
              Copy Invite Link
            </button>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Share this code or link with the caregiver. They can use it on sign-up or in their Connections page.
          </p>
          {copied ? <p className="text-sm font-medium text-emerald-700">{copied}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
