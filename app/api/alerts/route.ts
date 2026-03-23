import { NextResponse } from "next/server";
import type { AlertEvent } from "@/types/slot";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    doseDue?: boolean;
    missedDoseCount?: number;
    deviceOffline?: boolean;
    userName?: string;
  };

  const alerts: AlertEvent[] = [];
  const timestamp = new Date().toISOString();

  if (payload.doseDue) {
    alerts.push({
      id: `alert-due-${Date.now()}`,
      severity: "info",
      channel: ["push", "buzzer", "led"],
      message: `Dose window started for ${payload.userName ?? "the patient"}. Trigger reminder and hardware buzzer.`,
      createdAt: timestamp,
      acknowledged: false
    });
  }

  if ((payload.missedDoseCount ?? 0) >= 2) {
    alerts.push({
      id: `alert-escalate-${Date.now()}`,
      severity: "critical",
      channel: ["push", "sms", "caregiver"],
      message: "Patient missed multiple doses. Escalate to the caregiver immediately.",
      createdAt: timestamp,
      acknowledged: false
    });
  }

  if (payload.deviceOffline) {
    alerts.push({
      id: `alert-offline-${Date.now()}`,
      severity: "critical",
      channel: ["push", "sms", "caregiver"],
      message: "Device is offline. Switch to manual dispense and confirm medication pickup manually.",
      createdAt: timestamp,
      acknowledged: false
    });
  }

  return NextResponse.json({
    alerts
  });
}
