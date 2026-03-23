export type SlotType = "single" | "dual";

export type DeviceStatus = "online" | "offline" | "dispensing" | "alert";

export type HardwareEvent =
  | "dispense_requested"
  | "dispensed"
  | "pickup_confirmed"
  | "missed"
  | "stuck_retry"
  | "unauthorized"
  | "offline"
  | "heartbeat";

export interface Slot {
  id: number;
  recordId?: string;
  deviceId: string;
  type: SlotType;
  medicines: string[];
  capacity: number;
  remaining: number;
  rotationAngle: number;
}

export interface Device {
  id: string;
  userId: string;
  ipAddress: string;
  status: DeviceStatus;
  currentSlot: number;
  firmwareVersion?: string | null;
  lastSeen?: string | null;
  lastActivity?: string | null;
  requiresFingerprint: boolean;
}

export interface HardwareLog {
  id: string;
  deviceId: string;
  slotRecordId?: string | null;
  slotId: number;
  event: HardwareEvent;
  timestamp: string;
  details?: string;
}

export interface AlertEvent {
  id: string;
  severity: "info" | "warning" | "critical";
  channel: Array<"push" | "sms" | "buzzer" | "led" | "caregiver">;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}
