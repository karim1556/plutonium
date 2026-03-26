"use client";

import { AIChatbot } from "@/components/ai-chatbot";
import type { AppRole } from "@/types/auth";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

interface ChatbotWrapperProps {
  schedules: ScheduleItem[];
  logs: DoseLog[];
  medications: Medication[];
  role: AppRole;
  patientName?: string;
}

export function ChatbotWrapper({ schedules, logs, medications, role, patientName }: ChatbotWrapperProps) {
  return (
    <AIChatbot
      schedules={schedules}
      logs={logs}
      medications={medications}
      role={role}
      patientName={patientName}
      embedded={true}
    />
  );
}
