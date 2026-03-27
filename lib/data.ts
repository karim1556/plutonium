import "server-only";

import { buildDailyTimeline, calculateAdherence } from "@/lib/adherence";
import { getLinkedCaregivers, getLinkedPatients } from "@/lib/auth";
import { buildHardwareAlert, summarizeDevice } from "@/lib/hardware";
import { generatePredictionSignals } from "@/lib/predictor";
import { detectMedicationRisks } from "@/lib/risk";
import { generateScheduleFromMedications, getScheduleStatus, suggestReschedule } from "@/lib/scheduler";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getTodayIsoDate, uniqueValues } from "@/lib/utils";
import type { AppRole, SessionUser } from "@/types/auth";
import type { DoseLog, Medication, ParsedPrescriptionMedication, ScheduleItem } from "@/types/medication";
import type { AlertEvent, Device, HardwareEvent, HardwareLog, Slot } from "@/types/slot";

export interface PatientOption {
  id: string;
  name: string;
  phone?: string | null;
  role: AppRole;
  locale: string;
}

interface UserRow {
  id: string;
  auth_user_id: string | null;
  name: string;
  role: AppRole;
  phone: string | null;
  locale: string;
}

interface DeviceRow {
  id: string;
  user_id: string;
  ip_address: string;
  status: Device["status"];
  current_slot: number;
  firmware_version: string | null;
  requires_fingerprint: boolean;
  last_seen: string | null;
  last_activity: string | null;
}

interface SlotRow {
  id: string;
  device_id: string;
  slot_number: number;
  type: Slot["type"];
  medicines: unknown;
  capacity: number;
  remaining: number;
  rotation_angle: number;
}

interface MedicationRow {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: number;
  duration: number;
  timing: unknown;
  remaining_pills: number | null;
  refill_threshold: number | null;
  instructions: unknown;
}

interface ScheduleRow {
  id: string;
  medication_id: string;
  slot_id: string;
  bundle_key: string | null;
  bundle_medicines: unknown;
  scheduled_for: string;
  time: string;
  status: ScheduleItem["status"];
  medications: {
    id: string;
    name: string;
    dosage: string;
    frequency: number;
    timing: unknown;
    instructions: unknown;
  } | null;
  slots: {
    slot_number: number;
  } | null;
}

interface LogRow {
  id: string;
  schedule_id: string;
  status: DoseLog["status"];
  source: DoseLog["source"];
  timestamp: string;
  notes: string | null;
}

interface HardwareLogRow {
  id: string;
  device_id: string;
  slot_id: string | null;
  event: HardwareEvent;
  timestamp: string;
  details: string | null;
  slots: {
    slot_number: number;
  } | null;
}

interface BaseCareContext {
  session: SessionUser;
  activePatient: PatientOption | null;
  linkedPatients: PatientOption[];
  linkedCaregivers: PatientOption[];
  medications: Medication[];
  schedules: ScheduleItem[];
  logs: DoseLog[];
  slots: Slot[];
  device: Device | null;
  hardwareLogs: HardwareLog[];
  todaySchedules: ScheduleItem[];
  adherence: ReturnType<typeof calculateAdherence>;
  predictions: ReturnType<typeof generatePredictionSignals>;
  risks: ReturnType<typeof detectMedicationRisks>;
  refillItems: Array<{ name: string; remaining: number }>;
  alerts: AlertEvent[];
  weeklyTimeline: ReturnType<typeof buildDailyTimeline>;
}

function mapProfileRow(row: UserRow): PatientOption {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    locale: row.locale
  };
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  return [];
}

function asTiming(value: unknown): Medication["timing"] {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const mealRelation = raw.mealRelation;
  const allowedMealRelations = new Set(["before_food", "after_food", "with_food", "anytime"]);

  return {
    partsOfDay: asStringArray(raw.partsOfDay) as Medication["timing"]["partsOfDay"],
    mealRelation:
      typeof mealRelation === "string" && allowedMealRelations.has(mealRelation)
        ? (mealRelation as Medication["timing"]["mealRelation"])
        : "anytime",
    customTimes: asStringArray(raw.customTimes),
    notes: asStringArray(raw.notes)
  };
}

function mapMedicationRow(row: MedicationRow): Medication {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    durationDays: row.duration,
    timing: asTiming(row.timing),
    instructions: asStringArray(row.instructions),
    remainingPills: row.remaining_pills ?? undefined,
    refillThreshold: row.refill_threshold ?? undefined
  };
}

function mapDeviceRow(row: DeviceRow): Device {
  return {
    id: row.id,
    userId: row.user_id,
    ipAddress: row.ip_address,
    status: row.status,
    currentSlot: row.current_slot,
    firmwareVersion: row.firmware_version,
    requiresFingerprint: row.requires_fingerprint,
    lastSeen: row.last_seen,
    lastActivity: row.last_activity
  };
}

function mapSlotRow(row: SlotRow): Slot {
  return {
    id: row.slot_number,
    recordId: row.id,
    deviceId: row.device_id,
    type: row.type,
    medicines: asStringArray(row.medicines),
    capacity: row.capacity,
    remaining: row.remaining,
    rotationAngle: row.rotation_angle
  };
}

function mapLogRow(row: LogRow): DoseLog {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    status: row.status,
    source: row.source,
    timestamp: row.timestamp,
    notes: row.notes ?? undefined
  };
}

function mapHardwareLogRow(row: HardwareLogRow): HardwareLog {
  return {
    id: row.id,
    deviceId: row.device_id,
    slotRecordId: row.slot_id,
    slotId: row.slots?.slot_number ?? 0,
    event: row.event,
    timestamp: row.timestamp,
    details: row.details ?? undefined
  };
}

function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function buildRefillItems(medications: Medication[]) {
  return medications
    .filter((medication) => (medication.remainingPills ?? Number.MAX_SAFE_INTEGER) <= (medication.refillThreshold ?? 5))
    .map((medication) => ({
      name: medication.name,
      remaining: medication.remainingPills ?? 0
    }));
}

function buildAlerts(input: {
  refillItems: Array<{ name: string; remaining: number }>;
  logs: DoseLog[];
  device: Device | null;
}) {
  const alerts: AlertEvent[] = [];

  if (input.device?.status === "offline") {
    alerts.push(buildHardwareAlert("offline"));
  }

  const recentMisses = input.logs.filter((log) => log.status === "missed").length;

  if (recentMisses >= 2) {
    alerts.push(buildHardwareAlert("missed"));
  }

  if (input.refillItems.length) {
    const first = input.refillItems[0];
    alerts.push({
      id: `alert-refill-${first.name.toLowerCase()}`,
      severity: "warning",
      channel: ["push", "sms", "caregiver"],
      message: `${first.name} is down to ${first.remaining} pills. Refill before the next 2-day window closes.`,
      createdAt: new Date().toISOString(),
      acknowledged: false
    });
  }

  return alerts;
}

function buildDaypartSummary(logs: DoseLog[]) {
  const dayparts = [
    { label: "Morning", startHour: 5, endHour: 11 },
    { label: "Afternoon", startHour: 12, endHour: 16 },
    { label: "Evening", startHour: 17, endHour: 20 },
    { label: "Night", startHour: 21, endHour: 23 }
  ];

  return dayparts.map((part) => {
    const entries = logs.filter((log) => {
      const hour = new Date(log.timestamp).getHours();
      return hour >= part.startHour && hour <= part.endHour;
    });
    const taken = entries.filter((log) => log.status === "taken").length;
    const total = entries.length || 1;

    return {
      label: part.label,
      score: Math.round((taken / total) * 100),
      note:
        entries.length === 0
          ? "Not enough events yet to score this daypart."
          : taken / total >= 0.85
            ? "Stable pattern."
            : taken / total >= 0.6
              ? "Needs reminder support."
              : "Highest intervention risk right now."
    };
  });
}

function resolveBundleStatus(rows: ScheduleRow[], logs: DoseLog[]) {
  const scheduleIds = rows.map((row) => row.id);
  const matchingLogs = logs
    .filter((log) => scheduleIds.includes(log.scheduleId))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));

  if (matchingLogs.some((log) => log.status === "taken")) {
    return {
      status: "taken" as const,
      actualTimestamp: matchingLogs.find((log) => log.status === "taken")?.timestamp
    };
  }

  if (matchingLogs.some((log) => log.status === "missed")) {
    return {
      status: "missed" as const,
      actualTimestamp: matchingLogs.find((log) => log.status === "missed")?.timestamp
    };
  }

  if (matchingLogs.some((log) => log.status === "delayed")) {
    return {
      status: "delayed" as const,
      actualTimestamp: matchingLogs.find((log) => log.status === "delayed")?.timestamp
    };
  }

  const fallbackRow = rows[0];
  const scheduledForToday = fallbackRow.scheduled_for === getTodayIsoDate();

  return {
    status: scheduledForToday ? getScheduleStatus(fallbackRow.time.slice(0, 5)) : fallbackRow.status,
    actualTimestamp: undefined
  };
}

function groupScheduleRows(rows: ScheduleRow[], logs: DoseLog[]) {
  const grouped = new Map<string, ScheduleRow[]>();

  rows.forEach((row) => {
    const key = row.bundle_key ?? `${row.scheduled_for}-${row.time.slice(0, 5)}-slot-${row.slots?.slot_number ?? 0}`;
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  });

  return Array.from(grouped.entries())
    .map(([bundleKey, entryRows]) => {
      const medicines = uniqueValues(
        asStringArray(entryRows[0]?.bundle_medicines).length
          ? asStringArray(entryRows[0]?.bundle_medicines)
          : entryRows
              .map((row) => row.medications?.name)
              .filter((name): name is string => Boolean(name))
      );
      const bundleStatus = resolveBundleStatus(entryRows, logs);
      const maxFrequency = Math.max(...entryRows.map((row) => row.medications?.frequency ?? 1));

      return {
        id: bundleKey,
        medicationIds: entryRows.map((row) => row.medication_id),
        sourceScheduleIds: entryRows.map((row) => row.id),
        slotId: entryRows[0]?.slots?.slot_number ?? 0,
        time: entryRows[0]?.time.slice(0, 5) ?? "09:00",
        medicines,
        status: bundleStatus.status,
        scheduledFor: entryRows[0]?.scheduled_for ?? getTodayIsoDate(),
        safeGapHours: maxFrequency >= 2 ? 6 : 12,
        actualTimestamp: bundleStatus.actualTimestamp
      } satisfies ScheduleItem;
    })
    .sort((left, right) => {
      if (left.scheduledFor === right.scheduledFor) {
        return left.time.localeCompare(right.time);
      }

      return left.scheduledFor.localeCompare(right.scheduledFor);
    });
}

async function resolvePatientAccess(session: SessionUser, requestedPatientId?: string | null) {
  if (session.role === "patient") {
    return {
      activePatient: mapProfileRow({
        id: session.id,
        auth_user_id: session.authUserId,
        name: session.name,
        role: session.role,
        phone: session.phone ?? null,
        locale: session.locale
      }),
      linkedPatients: [] as PatientOption[]
    };
  }

  const linkedPatients = await getLinkedPatients(session.id);
  const activePatient =
    linkedPatients.find((patient) => patient.id === requestedPatientId) ??
    linkedPatients[0] ??
    null;

  return {
    activePatient,
    linkedPatients: linkedPatients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      role: patient.role,
      locale: patient.locale
    }))
  };
}

export async function ensurePatientAccess(session: SessionUser, patientId: string) {
  if (session.role === "patient") {
    return session.id === patientId ? mapProfileRow({
      id: session.id,
      auth_user_id: session.authUserId,
      name: session.name,
      role: session.role,
      phone: session.phone ?? null,
      locale: session.locale
    }) : null;
  }

  const linkedPatients = await getLinkedPatients(session.id);
  return (
    linkedPatients.find((patient) => patient.id === patientId) ?? null
  );
}

async function loadBaseCareContext(session: SessionUser, requestedPatientId?: string | null): Promise<BaseCareContext> {
  const service = createServiceRoleSupabaseClient();
  const { activePatient, linkedPatients } = await resolvePatientAccess(session, requestedPatientId);

  if (!service || !activePatient) {
    return {
      session,
      activePatient,
      linkedPatients,
      linkedCaregivers: [],
      medications: [],
      schedules: [],
      logs: [],
      slots: [],
      device: null,
      hardwareLogs: [],
      todaySchedules: [],
      adherence: calculateAdherence([], 0),
      predictions: generatePredictionSignals([], [], []),
      risks: detectMedicationRisks([], [], []),
      refillItems: [],
      alerts: [],
      weeklyTimeline: []
    };
  }

  const linkedCaregiversPromise = getLinkedCaregivers(activePatient.id);
  const medicationsPromise = service
    .from("medications")
    .select("id, user_id, name, dosage, frequency, duration, timing, remaining_pills, refill_threshold, instructions")
    .eq("user_id", activePatient.id)
    .order("created_at", { ascending: true });
  const devicePromise = service
    .from("devices")
    .select("id, user_id, ip_address, status, current_slot, firmware_version, requires_fingerprint, last_seen, last_activity")
    .eq("user_id", activePatient.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const fromDate = getTodayIsoDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
  const toDate = getTodayIsoDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [caregiverData, { data: medicationRows }, { data: deviceRow }] = await Promise.all([
    linkedCaregiversPromise,
    medicationsPromise,
    devicePromise
  ]);

  const medications = (medicationRows ?? []).map((row) => mapMedicationRow(row as MedicationRow));
  const device = deviceRow ? mapDeviceRow(deviceRow as DeviceRow) : null;
  const medicationIds = (medicationRows ?? []).map((row) => row.id);
  const { data: scheduleRows } =
    medicationIds.length > 0
      ? await service
          .from("schedules")
          .select(
            `
              id,
              medication_id,
              slot_id,
              bundle_key,
              bundle_medicines,
              scheduled_for,
              time,
              status,
              medications (
                id,
                name,
                dosage,
                frequency,
                timing,
                instructions
              ),
              slots (
                slot_number
              )
            `
          )
          .in("medication_id", medicationIds)
          .gte("scheduled_for", fromDate)
          .lte("scheduled_for", toDate)
          .order("scheduled_for", { ascending: true })
          .order("time", { ascending: true })
      : { data: [] };

  const [slotResponse, hardwareResponse] = device
    ? await Promise.all([
        service
          .from("slots")
          .select("id, device_id, slot_number, type, medicines, capacity, remaining, rotation_angle")
          .eq("device_id", device.id)
          .order("slot_number", { ascending: true }),
        service
          .from("hardware_logs")
          .select(
            `
              id,
              device_id,
              slot_id,
              event,
              timestamp,
              details,
              slots (
                slot_number
              )
            `
          )
          .eq("device_id", device.id)
          .order("timestamp", { ascending: false })
          .limit(20)
      ])
    : [{ data: [] }, { data: [] }];

  const scheduleIdList = (scheduleRows ?? []).map((row) => row.id);
  const logResponse =
    scheduleIdList.length > 0
      ? await service
          .from("logs")
          .select("id, schedule_id, status, source, timestamp, notes")
          .in("schedule_id", scheduleIdList)
          .order("timestamp", { ascending: false })
      : { data: [] };

  const slots = (slotResponse.data ?? []).map((row) => mapSlotRow(row as SlotRow));
  const logs = (logResponse.data ?? []).map((row) => mapLogRow(row as LogRow));
  const schedules = groupScheduleRows((scheduleRows ?? []) as unknown as ScheduleRow[], logs);
  const todaySchedules = schedules.filter((schedule) => schedule.scheduledFor === getTodayIsoDate());
  const hardwareLogs = (hardwareResponse.data ?? []).map((row) => mapHardwareLogRow(row as unknown as HardwareLogRow));
  const adherence = calculateAdherence(logs, (scheduleRows ?? []).length);
  const refillItems = buildRefillItems(medications);
  const alerts = buildAlerts({
    refillItems,
    logs,
    device
  });

  return {
    session,
    activePatient,
    linkedPatients,
    linkedCaregivers: (caregiverData ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      phone: row.phone,
      locale: row.locale
    })),
    medications,
    schedules,
    logs,
    slots,
    device: device ? summarizeDevice(device, hardwareLogs) : null,
    hardwareLogs,
    todaySchedules,
    adherence,
    predictions: generatePredictionSignals(logs, schedules, medications),
    risks: detectMedicationRisks(medications, schedules, logs),
    refillItems,
    alerts,
    weeklyTimeline: buildDailyTimeline(logs)
  };
}

function getNextDose(schedules: ScheduleItem[]) {
  return schedules.find((schedule) => schedule.status !== "taken" && schedule.status !== "missed") ?? null;
}

export async function getPatientDashboardState(session: SessionUser) {
  const context = await loadBaseCareContext(session, session.id);
  const nextDose = getNextDose(context.todaySchedules);
  const completedToday = context.todaySchedules.filter((schedule) => schedule.status === "taken").length;
  const missedToday = context.todaySchedules.filter((schedule) => schedule.status === "missed").length;
  const remainingToday = context.todaySchedules.length - completedToday;

  return {
    ...context,
    greeting: `${getTimeGreeting()}, ${session.name.split(" ")[0] ?? session.name}`,
    patient: context.activePatient,
    caregiver: context.linkedCaregivers[0] ?? null,
    nextDose,
    completedToday,
    missedToday,
    remainingToday,
    comfortMessage:
      nextDose && nextDose.status === "due_soon"
        ? `Your ${nextDose.medicines.join(" + ")} dose is almost due. We will guide you one step at a time.`
        : "You can rely on this home screen for the next medicine step, refill warnings, and quick support.",
    supportActions: [
      {
        id: "chat",
        title: "Ask the assistant",
        description: "Get simple help if you forgot a dose or feel unsure.",
        href: "/chat"
      },
      {
        id: "caregiver",
        title: "Manage care circle",
        description: context.linkedCaregivers.length
          ? `${context.linkedCaregivers[0]?.name} is linked to your account.`
          : "Link a caregiver so they can support you remotely.",
        href: "/connections"
      },
      {
        id: "device",
        title: "Check device",
        description: context.device ? "See whether the dispenser is ready before your next dose." : "Set up your dispenser so schedules can run on hardware.",
        href: "/device"
      }
    ],
    healthCards: [
      {
        label: "Today completed",
        value: `${completedToday}/${context.todaySchedules.length || 0}`,
        hint: missedToday ? "A missed dose needs follow-up." : "Today's completion count updates from real logs."
      },
      {
        label: "Current adherence",
        value: `${context.adherence.score}%`,
        hint: context.adherence.trendLabel
      },
      {
        label: "Low stock warning",
        value: context.refillItems[0]?.name ?? "All stocked",
        hint: context.refillItems.length
          ? `${context.refillItems[0]?.remaining} pills left.`
          : "No refill action needed right now."
      }
    ],
    reminders: [
      "Keep the dispenser on a stable surface before dispensing.",
      "Use the fingerprint scan if your device asks for it.",
      "Do not take a double dose without clinician advice."
    ]
  };
}

export async function getCaregiverDashboardState(session: SessionUser, patientId?: string | null) {
  const context = await loadBaseCareContext(session, patientId);
  const criticalAlerts = context.alerts.filter((alert) => alert.severity === "critical");
  const openTasks = [
    ...(context.refillItems.length
      ? [
          {
            id: "task-refill",
            title: `Refill ${context.refillItems[0]?.name}`,
            description: `${context.refillItems[0]?.remaining} pills remain. Refill before the next dosing gap tightens.`,
            urgency: "high" as const
          }
        ]
      : []),
    ...(context.predictions
      .filter((prediction) => prediction.severity !== "info")
      .map((prediction, index) => ({
        id: `task-prediction-${index}`,
        title: prediction.label,
        description: prediction.recommendation,
        urgency: prediction.severity === "critical" ? ("high" as const) : ("medium" as const)
      }))),
    {
      id: "task-device",
      title: context.device ? "Check device readiness" : "Register patient device",
      description: context.device
        ? "Confirm the dispenser is online and reachable before the next supervised dose."
        : "The patient needs a dispenser record before hardware-linked schedules can execute.",
      urgency: "low" as const
    }
  ];

  return {
    ...context,
    caregiver: session,
    patient: context.activePatient,
    criticalAlerts,
    openTasks,
    patientSummary: {
      ageBand: "Flexible",
      carePlan: context.medications.length
        ? `${context.medications.length} active medications linked to ${context.todaySchedules.length} dose bundles today.`
        : "No medications have been imported yet.",
      lastConfirmedPickup:
        context.hardwareLogs.find((log) => log.event === "pickup_confirmed")?.timestamp ?? null
    },
    quickActions: [
      "Trigger a remote dispense only when the patient is physically present.",
      "Use the assistant before rescheduling a missed dose.",
      "Keep refill risk and device status visible together."
    ]
  };
}

export async function getAnalyticsState(session: SessionUser, patientId?: string | null) {
  const context = await loadBaseCareContext(session, patientId);

  return {
    ...context,
    adherence: context.adherence,
    timeline: context.weeklyTimeline,
    predictions: context.predictions,
    risks: context.risks,
    refill: context.refillItems,
    daypartSummary: buildDaypartSummary(context.logs)
  };
}

export async function getDeviceState(session: SessionUser, patientId?: string | null) {
  const context = await loadBaseCareContext(session, patientId);

  return {
    ...context,
    role: session.role,
    patient: context.activePatient,
    caregiver: session.role === "caregiver" ? session : context.linkedCaregivers[0] ?? null,
    patientFriendlyText:
      session.role === "patient"
        ? "This page keeps the device simple: ready status, slot contents, and recent machine activity."
        : "This console shows real device readiness, slot inventory, and hardware events for the active patient."
  };
}

export async function getChatState(session: SessionUser, patientId?: string | null) {
  const context = await loadBaseCareContext(session, patientId);

  return {
    ...context,
    role: session.role,
    promptStarters:
      session.role === "patient"
        ? [
            "Can I take my medicine now?",
            "I missed my evening dose. What should I do?",
            "How many pills are left in my plan?"
          ]
        : [
            "Why is this patient missing evening doses?",
            "Which medicine needs refill first?",
            "Is it safe to reschedule tonight's missed dose?"
          ]
  };
}

export async function getSchedulePageState(session: SessionUser, patientId?: string | null) {
  const context = await loadBaseCareContext(session, patientId);

  return {
    ...context,
    hasDevice: Boolean(context.device),
    recommendations: context.schedules.map((schedule) => ({
      scheduleId: schedule.id,
      ...suggestReschedule(schedule, context.logs)
    }))
  };
}

export async function getUploadPageState(session: SessionUser, patientId?: string | null) {
  const context = await loadBaseCareContext(session, patientId);

  return {
    ...context,
    canImportToPatient: Boolean(context.activePatient)
  };
}

interface ExpandedScheduleRow {
  medication_id: string;
  slot_id: string;
  bundle_key: string;
  bundle_medicines: string[];
  scheduled_for: string;
  time: string;
  status: "pending";
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function expandScheduleRows(input: {
  schedules: ScheduleItem[];
  medications: Medication[];
  slots: Slot[];
}) {
  const medicationById = new Map(input.medications.map((medication) => [medication.id, medication]));
  const medicationByName = new Map(
    input.medications.map((medication) => [normalizeName(medication.name), medication])
  );
  const slotByNumber = new Map(input.slots.map((slot) => [slot.id, slot]));
  const expanded: ExpandedScheduleRow[] = [];

  input.schedules.forEach((schedule) => {
    const slot = slotByNumber.get(schedule.slotId);

    if (!slot?.recordId) {
      return;
    }

    const bundleKey = `${schedule.scheduledFor}-${schedule.time}-slot-${schedule.slotId}`;
    const medications = schedule.medicationIds.length
      ? schedule.medicationIds
          .map((medicationId) => medicationById.get(medicationId))
          .filter((medication): medication is Medication => Boolean(medication))
      : schedule.medicines
          .map((medicineName) => medicationByName.get(normalizeName(medicineName)))
          .filter((medication): medication is Medication => Boolean(medication));

    medications.forEach((medication) => {
      expanded.push({
        medication_id: medication.id,
        slot_id: slot.recordId as string,
        bundle_key: bundleKey,
        bundle_medicines: schedule.medicines,
        scheduled_for: schedule.scheduledFor,
        time: schedule.time,
        status: "pending"
      });
    });
  });

  return expanded;
}

export async function saveScheduleBundlesForPatient(input: {
  session: SessionUser;
  patientId: string;
  schedules: ScheduleItem[];
}) {
  const service = createServiceRoleSupabaseClient();
  const patient = await ensurePatientAccess(input.session, input.patientId);

  if (!service || !patient) {
    return {
      ok: false,
      reason: "Patient not accessible."
    };
  }

  const [{ data: medicationRows }, { data: slotRows }] = await Promise.all([
    service
      .from("medications")
      .select("id, user_id, name, dosage, frequency, duration, timing, remaining_pills, refill_threshold, instructions")
      .eq("user_id", patient.id),
    service
      .from("devices")
      .select(
        `
          id,
          slots (
            id,
            device_id,
            slot_number,
            type,
            medicines,
            capacity,
            remaining,
            rotation_angle
          )
        `
      )
      .eq("user_id", patient.id)
      .limit(1)
      .maybeSingle()
  ]);

  const medications = (medicationRows ?? []).map((row) => mapMedicationRow(row as MedicationRow));
  const slots = (((slotRows?.slots as unknown[]) ?? []).map((row) => mapSlotRow(row as SlotRow)));
  const dates = uniqueValues(input.schedules.map((schedule) => schedule.scheduledFor));
  const desiredRows = expandScheduleRows({
    schedules: input.schedules,
    medications,
    slots
  });

  if (!desiredRows.length) {
    return {
      ok: false,
      reason: "No schedule rows could be generated. Register slots first."
    };
  }

  const medicationIds = medications.map((medication) => medication.id);
  const { data: existingRows } = await service
    .from("schedules")
    .select("id, medication_id, slot_id, bundle_key, bundle_medicines, scheduled_for, time, status")
    .in("medication_id", medicationIds)
    .in("scheduled_for", dates)
    .order("scheduled_for", { ascending: true })
    .order("time", { ascending: true });

  const existingIds = (existingRows ?? []).map((row) => row.id);
  const { data: existingLogs } =
    existingIds.length > 0
      ? await service.from("logs").select("id, schedule_id").in("schedule_id", existingIds)
      : { data: [] };

  const loggedScheduleIds = new Set((existingLogs ?? []).map((row) => row.schedule_id));
  const updatable = (existingRows ?? []).filter((row) => !loggedScheduleIds.has(row.id));

  const desiredByKey = new Map<string, ExpandedScheduleRow[]>();
  desiredRows.forEach((row) => {
    const key = `${row.medication_id}|${row.scheduled_for}`;
    const current = desiredByKey.get(key) ?? [];
    current.push(row);
    desiredByKey.set(key, current);
  });
  desiredByKey.forEach((rows) => rows.sort((left, right) => left.time.localeCompare(right.time)));

  const existingByKey = new Map<string, typeof updatable>();
  updatable.forEach((row) => {
    const key = `${row.medication_id}|${row.scheduled_for}`;
    const current = existingByKey.get(key) ?? [];
    current.push(row);
    existingByKey.set(key, current);
  });
  existingByKey.forEach((rows) => rows.sort((left, right) => left.time.localeCompare(right.time)));

  const updates: Array<{ id: string } & ExpandedScheduleRow> = [];
  const inserts: ExpandedScheduleRow[] = [];
  const deletes: string[] = [];

  uniqueValues([...desiredByKey.keys(), ...existingByKey.keys()]).forEach((key) => {
    const desired = desiredByKey.get(key) ?? [];
    const existing = existingByKey.get(key) ?? [];
    const pairs = Math.min(desired.length, existing.length);

    for (let index = 0; index < pairs; index += 1) {
      updates.push({
        id: existing[index]?.id as string,
        ...desired[index]
      });
    }

    if (desired.length > pairs) {
      inserts.push(...desired.slice(pairs));
    }

    if (existing.length > pairs) {
      deletes.push(...existing.slice(pairs).map((row) => row.id));
    }
  });

  if (updates.length) {
    for (const row of updates) {
      const { error } = await service
        .from("schedules")
        .update({
          slot_id: row.slot_id,
          bundle_key: row.bundle_key,
          bundle_medicines: row.bundle_medicines,
          scheduled_for: row.scheduled_for,
          time: row.time,
          status: row.status
        })
        .eq("id", row.id);

      if (error) {
        return {
          ok: false,
          reason: `Schedule update failed: ${error.message}`
        };
      }
    }
  }

  if (inserts.length) {
    const { error } = await service.from("schedules").insert(inserts);
    if (error) {
      return {
        ok: false,
        reason: `Schedule insert failed: ${error.message}`
      };
    }
  }

  if (deletes.length) {
    const { error } = await service.from("schedules").delete().in("id", deletes);
    if (error) {
      return {
        ok: false,
        reason: `Schedule delete failed: ${error.message}`
      };
    }
  }

  return {
    ok: true,
    inserted: inserts.length,
    updated: updates.length,
    deleted: deletes.length
  };
}

export async function createOrUpdateMedicationPlan(input: {
  session: SessionUser;
  patientId: string;
  medications: ParsedPrescriptionMedication[];
}) {
  const service = createServiceRoleSupabaseClient();
  const patient = await ensurePatientAccess(input.session, input.patientId);

  if (!service || !patient) {
    return {
      ok: false,
      reason: "Patient not accessible."
    };
  }

  const { data: existingRows } = await service
    .from("medications")
    .select("id, user_id, name, dosage, frequency, duration, timing, remaining_pills, refill_threshold, instructions")
    .eq("user_id", patient.id);

  const existingByName = new Map(
    (existingRows ?? []).map((row) => [normalizeName(row.name), row as MedicationRow])
  );
  let inserted = 0;
  let updated = 0;

  for (const medication of input.medications) {
    const existing = existingByName.get(normalizeName(medication.name));
    const payload = {
      user_id: patient.id,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.durationDays,
      timing: medication.timing,
      instructions: medication.instructions
    };

    if (existing) {
      await service.from("medications").update(payload).eq("id", existing.id);
      updated += 1;
      continue;
    }

    await service.from("medications").insert(payload);
    inserted += 1;
  }

  let refreshedContext = await loadBaseCareContext(input.session, patient.id);

  if (!refreshedContext.device) {
    await registerOrUpdateDevice({
      session: input.session,
      patientId: patient.id,
      ipAddress: "0.0.0.0",
      requiresFingerprint: false
    });
    refreshedContext = await loadBaseCareContext(input.session, patient.id);
  } else if (refreshedContext.slots.length === 0) {
    // Device exists but no slots found. Auto-create default slots.
    const defaultSlots = [
      { slot_number: 1, type: "single", medicines: [], capacity: 1, remaining: 0, rotation_angle: 72 },
      { slot_number: 2, type: "single", medicines: [], capacity: 1, remaining: 0, rotation_angle: 144 },
      { slot_number: 3, type: "single", medicines: [], capacity: 1, remaining: 0, rotation_angle: 216 },
      { slot_number: 4, type: "dual", medicines: [], capacity: 2, remaining: 0, rotation_angle: 288 },
      { slot_number: 5, type: "dual", medicines: [], capacity: 2, remaining: 0, rotation_angle: 360 }
    ];

    await service.from("slots").insert(
      defaultSlots.map((slot) => ({
        device_id: refreshedContext.device!.id,
        ...slot
      }))
    );
    refreshedContext = await loadBaseCareContext(input.session, patient.id);
  }

  if (refreshedContext.medications.length && refreshedContext.slots.length) {
    // Build a map of medicine names to user-assigned slot IDs (1-5)
    const slotAssignments: Record<string, number> = {};
    for (const med of input.medications) {
      if (med.slotId !== undefined) {
        slotAssignments[med.name] = med.slotId;
      }
    }

    // Persist the assigned medicines into the actual slot records in the DB
    for (const slot of refreshedContext.slots) {
      const assignedMedsForThisSlot = Object.keys(slotAssignments).filter(
        (name) => slotAssignments[name] === slot.id
      );

      if (assignedMedsForThisSlot.length > 0) {
        const existingMeds = Array.isArray(slot.medicines) ? slot.medicines as string[] : [];
        const newMeds = uniqueValues([...existingMeds, ...assignedMedsForThisSlot]);

        await service
          .from("slots")
          .update({ medicines: newMeds })
          .eq("id", slot.recordId as string);
      }
    }

    const generatedSchedules = generateScheduleFromMedications(refreshedContext.medications, refreshedContext.slots, {
      scheduledDate: getTodayIsoDate(),
      slotAssignments
    });

    await saveScheduleBundlesForPatient({
      session: input.session,
      patientId: patient.id,
      schedules: generatedSchedules
    });
  }

  return {
    ok: true,
    inserted,
    updated
  };
}

export async function registerOrUpdateDevice(input: {
  session: SessionUser;
  patientId: string;
  ipAddress: string;
  firmwareVersion?: string;
  requiresFingerprint: boolean;
}) {
  const service = createServiceRoleSupabaseClient();
  const patient = await ensurePatientAccess(input.session, input.patientId);

  if (!service || !patient) {
    return {
      ok: false,
      reason: "Patient not accessible."
    };
  }

  const { data: existingDevice } = await service
    .from("devices")
    .select("id")
    .eq("user_id", patient.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const devicePayload = {
    user_id: patient.id,
    ip_address: input.ipAddress,
    firmware_version: input.firmwareVersion ?? "v1.0.0",
    status: "offline" as const,
    current_slot: 1,
    requires_fingerprint: input.requiresFingerprint,
    last_seen: null,
    last_activity: null
  };

  const { data: device, error } = existingDevice
    ? await service
        .from("devices")
        .update(devicePayload)
        .eq("id", existingDevice.id)
        .select("id, user_id, ip_address, status, current_slot, firmware_version, requires_fingerprint, last_seen, last_activity")
        .single()
    : await service
        .from("devices")
        .insert(devicePayload)
        .select("id, user_id, ip_address, status, current_slot, firmware_version, requires_fingerprint, last_seen, last_activity")
        .single();

  if (error || !device) {
    return {
      ok: false,
      reason: error?.message ?? "Unable to save device."
    };
  }

  const { data: existingSlots } = await service
    .from("slots")
    .select("id, slot_number")
    .eq("device_id", device.id);

  const existingNumbers = new Set((existingSlots ?? []).map((slot) => slot.slot_number));
  const defaultSlots = [
    { slot_number: 1, type: "single" as const, medicines: [], capacity: 1, remaining: 0, rotation_angle: 72 },
    { slot_number: 2, type: "single" as const, medicines: [], capacity: 1, remaining: 0, rotation_angle: 144 },
    { slot_number: 3, type: "single" as const, medicines: [], capacity: 1, remaining: 0, rotation_angle: 216 },
    { slot_number: 4, type: "dual" as const, medicines: [], capacity: 2, remaining: 0, rotation_angle: 288 },
    { slot_number: 5, type: "dual" as const, medicines: [], capacity: 2, remaining: 0, rotation_angle: 360 }
  ];

  const missingSlots = defaultSlots
    .filter((slot) => !existingNumbers.has(slot.slot_number))
    .map((slot) => ({
      device_id: device.id,
      ...slot
    }));

  if (missingSlots.length) {
    await service.from("slots").insert(missingSlots);
  }

  return {
    ok: true,
    device: mapDeviceRow(device as DeviceRow)
  };
}

function getDeviceStatusForHardwareEvent(event: HardwareEvent): Device["status"] {
  if (event === "offline") {
    return "offline";
  }

  if (event === "unauthorized" || event === "stuck_retry") {
    return "alert";
  }

  if (event === "dispense_requested" || event === "dispensed") {
    return "dispensing";
  }

  return "online";
}

export async function recordHardwareEvent(input: {
  deviceId: string;
  event: HardwareEvent;
  slotNumber?: number;
  details?: string;
  timestamp?: string;
  scheduleIds?: string[];
  ipAddress?: string;
}) {
  const service = createServiceRoleSupabaseClient();

  if (!service) {
    return {
      ok: false,
      reason: "Supabase service role key is missing."
    };
  }

  const eventTimestamp = input.timestamp ?? new Date().toISOString();

  const { data: slot } =
    typeof input.slotNumber === "number"
      ? await service
          .from("slots")
          .select("id, slot_number")
          .eq("device_id", input.deviceId)
          .eq("slot_number", input.slotNumber)
          .maybeSingle()
      : { data: null };

  const deviceUpdatePayload: {
    status: Device["status"];
    last_seen: string;
    last_activity: string;
    current_slot?: number;
    ip_address?: string;
  } = {
    status: getDeviceStatusForHardwareEvent(input.event),
    last_seen: eventTimestamp,
    last_activity: eventTimestamp
  };

  if (typeof input.slotNumber === "number") {
    deviceUpdatePayload.current_slot = input.slotNumber;
  }

  if (input.ipAddress) {
    deviceUpdatePayload.ip_address = input.ipAddress;
  }

  await service.from("devices").update(deviceUpdatePayload).eq("id", input.deviceId);

  await service.from("hardware_logs").insert({
    device_id: input.deviceId,
    slot_id: slot?.id ?? null,
    event: input.event,
    timestamp: eventTimestamp,
    details: input.details ?? null
  });

  if (input.scheduleIds?.length && (input.event === "pickup_confirmed" || input.event === "missed")) {
    const status = input.event === "pickup_confirmed" ? "taken" : "missed";
    await service.from("logs").insert(
      input.scheduleIds.map((scheduleId) => ({
        schedule_id: scheduleId,
        status,
        source: input.event === "pickup_confirmed" ? "sensor" : "system",
        timestamp: eventTimestamp,
        notes: input.details ?? null
      }))
    );
  }

  return {
    ok: true
  };
}

export async function logDoseForSchedules(input: {
  scheduleIds: string[];
  status: DoseLog["status"];
  source?: DoseLog["source"];
  notes?: string;
  timestamp?: string;
}) {
  const service = createServiceRoleSupabaseClient();

  if (!service || !input.scheduleIds.length) {
    return {
      ok: false,
      reason: "No schedules to log."
    };
  }

  await service.from("logs").insert(
    input.scheduleIds.map((scheduleId) => ({
      schedule_id: scheduleId,
      status: input.status,
      source: input.source ?? "manual",
      timestamp: input.timestamp ?? new Date().toISOString(),
      notes: input.notes ?? null
    }))
  );

  const { data: allRows } = await service
    .from("logs")
    .select("id, schedule_id, status, source, timestamp, notes")
    .in("schedule_id", input.scheduleIds);

  const logs = (allRows ?? []).map((row) => mapLogRow(row as LogRow));

  return {
    ok: true,
    logs,
    adherence: calculateAdherence(logs, input.scheduleIds.length)
  };
}
