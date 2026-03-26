import { z } from "zod";

// ============================================================================
// Common Schemas
// ============================================================================

export const uuidSchema = z.string().uuid();

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const emailSchema = z.string().email();

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);

// ============================================================================
// Medication Schemas
// ============================================================================

export const mealRelationSchema = z.enum([
  "before_food",
  "after_food",
  "with_food",
  "anytime"
]);

export const partOfDaySchema = z.enum([
  "morning",
  "afternoon",
  "evening",
  "night"
]);

export const medicationTimingSchema = z.object({
  partsOfDay: z.array(partOfDaySchema),
  mealRelation: mealRelationSchema,
  customTimes: z.array(timeSchema).optional(),
  wakeWindow: z
    .object({
      start: timeSchema,
      end: timeSchema
    })
    .optional(),
  notes: z.array(z.string()).optional()
});

export const createMedicationSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.number().int().min(1).max(4),
  durationDays: z.number().int().min(1).max(365),
  timing: medicationTimingSchema,
  instructions: z.array(z.string()).optional().default([]),
  refillThreshold: z.number().int().min(1).max(100).optional().default(5),
  remainingPills: z.number().int().min(0).optional(),
  interactionGroup: z.string().optional()
});

export const importMedicationsSchema = z.object({
  userId: uuidSchema,
  medications: z.array(createMedicationSchema)
});

// ============================================================================
// Chat Schemas
// ============================================================================

export const chatRequestSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  patientId: uuidSchema.optional(),
  schedules: z.array(z.any()).optional(),
  logs: z.array(z.any()).optional(),
  medications: z.array(z.any()).optional()
});

// ============================================================================
// Dispense Schemas
// ============================================================================

export const dispenseRequestSchema = z.object({
  slot: z.number().int().min(1).max(5),
  deviceIP: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Invalid IP address"),
  deviceId: uuidSchema.optional(),
  patientId: uuidSchema.optional(),
  scheduleIds: z.array(uuidSchema).optional()
});

// ============================================================================
// Device Schemas
// ============================================================================

export const deviceStatusSchema = z.enum([
  "online",
  "offline",
  "dispensing",
  "alert"
]);

export const hardwareEventSchema = z.enum([
  "dispense_requested",
  "dispensed",
  "pickup_confirmed",
  "missed",
  "stuck_retry",
  "unauthorized",
  "offline",
  "heartbeat"
]);

export const deviceEventSchema = z.object({
  deviceId: z.string().min(1),
  event: hardwareEventSchema,
  slotNumber: z.number().int().min(1).max(5),
  details: z.string().optional(),
  scheduleIds: z.array(uuidSchema).optional()
});

export const registerDeviceSchema = z.object({
  userId: uuidSchema,
  ipAddress: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Invalid IP address"),
  firmwareVersion: z.string().optional(),
  requiresFingerprint: z.boolean().default(true)
});

// ============================================================================
// Schedule Schemas
// ============================================================================

export const scheduleStatusSchema = z.enum([
  "pending",
  "due_soon",
  "taken",
  "missed",
  "delayed"
]);

export const generateScheduleSchema = z.object({
  userId: uuidSchema,
  medications: z.array(z.any()),
  slots: z.array(z.any()),
  wakeTime: timeSchema.optional().default("07:00"),
  scheduledDate: dateSchema.optional(),
  persist: z.boolean().optional().default(false)
});

export const logDoseSchema = z.object({
  scheduleId: uuidSchema,
  status: scheduleStatusSchema.exclude(["pending", "due_soon"]),
  source: z.enum(["manual", "device", "sensor", "caregiver", "system"]).default("manual"),
  notes: z.string().optional()
});

// ============================================================================
// Invitation Schemas
// ============================================================================

export const createInvitationSchema = z.object({
  patientUserId: uuidSchema
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  caregiverUserId: uuidSchema
});

// ============================================================================
// Prescription Parsing Schemas
// ============================================================================

export const parseTextSchema = z.object({
  text: z.string().min(1, "Prescription text cannot be empty")
});

export const parseImageSchema = z.object({
  imageData: z.string().min(1, "Image data is required"),
  // Base64 encoded image or image URL
  format: z.enum(["base64", "url"]).default("base64")
});

// ============================================================================
// Validation Helper
// ============================================================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

export function formatValidationError(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
