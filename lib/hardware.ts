import type { AlertEvent, Device, DeviceStatus, HardwareEvent, HardwareLog } from "@/types/slot";

interface TriggerResult {
  ok: boolean;
  mode: "live" | "simulated";
  message: string;
  requestedAt: string;
}

export async function triggerDispense(deviceIP: string, slot: number): Promise<TriggerResult> {
  const hardwareEnabled = process.env.MEDASSIST_HARDWARE_ENABLED === "true";
  const requestedAt = new Date().toISOString();

  if (!hardwareEnabled) {
    return {
      ok: true,
      mode: "simulated",
      message: `Simulated dispense request for slot ${slot}. Enable MEDASSIST_HARDWARE_ENABLED for live calls.`,
      requestedAt
    };
  }

  const response = await fetch(`http://${deviceIP}/dispense?slot=${slot}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      mode: "live",
      message: `Hardware responded with status ${response.status}.`,
      requestedAt
    };
  }

  return {
    ok: true,
    mode: "live",
    message: `Dispense request accepted by ${deviceIP}.`,
    requestedAt
  };
}

export function buildHardwareAlert(event: HardwareEvent): AlertEvent {
  const base = {
    id: `alert-${event}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    acknowledged: false
  };

  if (event === "missed" || event === "offline") {
    return {
      ...base,
      severity: "critical",
      channel: ["push", "sms", "buzzer", "led", "caregiver"],
      message: event === "offline" ? "Device is offline. Switch to manual reminders." : "Dose pickup not confirmed. Notify caregiver now."
    };
  }

  if (event === "unauthorized" || event === "stuck_retry") {
    return {
      ...base,
      severity: "warning",
      channel: ["push", "led", "caregiver"],
      message:
        event === "unauthorized"
          ? "Unauthorized dispense attempt blocked by fingerprint gate."
          : "Dispense retry triggered because pill flow may be blocked."
    };
  }

  return {
    ...base,
    severity: "info",
    channel: ["push"],
    message: "Hardware event received successfully."
  };
}

export function getDeviceStatusTone(status: DeviceStatus) {
  const toneMap: Record<DeviceStatus, string> = {
    online: "text-ocean",
    offline: "text-clinic",
    dispensing: "text-amberglass",
    alert: "text-clinic"
  };

  return toneMap[status];
}

export function describeHardwareLog(log: HardwareLog) {
  const details = log.details ? ` ${log.details}` : "";
  return `${log.event.replaceAll("_", " ")} at slot ${log.slotId}.${details}`;
}

export function summarizeDevice(device: Device, hardwareLogs: HardwareLog[]) {
  const lastCriticalEvent = hardwareLogs.find(
    (log) => log.event === "missed" || log.event === "offline" || log.event === "unauthorized"
  );

  return {
    ...device,
    lastCriticalEvent
  };
}
