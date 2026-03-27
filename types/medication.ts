export type UserRole = "patient" | "caregiver";

export type PartOfDay = "morning" | "afternoon" | "evening" | "night";

export type MealRelation = "before_food" | "after_food" | "with_food" | "anytime";

export type ScheduleStatus = "pending" | "due_soon" | "taken" | "missed" | "delayed";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  locale: string;
}

export interface MedicationTiming {
  partsOfDay: PartOfDay[];
  mealRelation: MealRelation;
  customTimes?: string[];
  wakeWindow?: {
    start: string;
    end: string;
  };
  notes?: string[];
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: number;
  durationDays: number;
  timing: MedicationTiming;
  instructions?: string[];
  refillThreshold?: number;
  remainingPills?: number;
  interactionGroup?: string;
}

export interface ParsedPrescriptionMedication {
  name: string;
  dosage: string;
  frequency: number;
  durationDays: number;
  timing: MedicationTiming;
  instructions: string[];
  confidence: number;
  slotId?: number;
}

export interface ScheduleItem {
  id: string;
  medicationIds: string[];
  sourceScheduleIds?: string[];
  slotId: number;
  time: string;
  medicines: string[];
  status: ScheduleStatus;
  scheduledFor: string;
  delayMinutes?: number;
  safeGapHours?: number;
  actualTimestamp?: string;
}

export interface DoseLog {
  id: string;
  scheduleId: string;
  status: Exclude<ScheduleStatus, "pending" | "due_soon">;
  timestamp: string;
  source: "manual" | "device" | "sensor" | "caregiver" | "system";
  notes?: string;
}
