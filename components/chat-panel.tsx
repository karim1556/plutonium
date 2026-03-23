"use client";

import { useState, useTransition } from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import type { AppRole } from "@/types/auth";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

interface ChatPanelProps {
  schedules: ScheduleItem[];
  logs: DoseLog[];
  medications: Medication[];
  role: AppRole;
  promptStarters: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  safety?: string;
}

export function ChatPanel({ schedules, logs, medications, role, promptStarters }: ChatPanelProps) {
  const [question, setQuestion] = useState(
    role === "patient" ? "Can I take my missed evening dose now?" : "Why is the patient missing evening doses?"
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        role === "patient"
          ? "Ask me anything about your next dose, a missed dose, or whether you need help."
          : "Ask me about adherence risk, refill urgency, missed doses, or device issues.",
      safety:
        role === "patient"
          ? "Answers are simplified and based on your current medicine plan."
          : "Answers use the current schedule, adherence history, and stock warnings."
    }
  ]);
  const [isPending, startTransition] = useTransition();

  const send = () => {
    if (!question.trim()) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      role: "user",
      content: question
    };

    setMessages((current) => [...current, nextUserMessage]);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            question,
            schedules,
            logs,
            medications
          })
        });

        const payload = (await response.json()) as { answer: string; safety: string };
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: payload.answer,
            safety: payload.safety
          }
        ]);
        setQuestion("");
      })();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={
                message.role === "assistant"
                  ? "rounded-[28px] bg-sky-50 p-4"
                  : "ml-auto max-w-xl rounded-[28px] bg-slate-900 p-4 text-white"
              }
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">{message.role}</p>
              <p className="mt-2 text-sm leading-6">{message.content}</p>
              {message.safety ? <p className="mt-3 text-xs opacity-70">{message.safety}</p> : null}
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-[28px] border border-slate-100 bg-slate-50 p-4">
          <label className="block text-sm font-medium text-slate-700">
            Ask MedAssist
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-ocean"
            />
          </label>
          <button
            type="button"
            onClick={send}
            disabled={isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
            Send
          </button>
        </div>
      </div>

      <div className="rounded-[34px] bg-[linear-gradient(160deg,#0f172a_0%,#1e3a8a_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Prompt Starters</p>
        <div className="mt-5 space-y-3 text-sm text-white/80">
          {promptStarters.map((starter) => (
            <p key={starter}>{starter}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
