import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { getSchedulePageState, saveScheduleBundlesForPatient } from "@/lib/data";
import { generateScheduleFromMedications, suggestReschedule } from "@/lib/scheduler";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";
import type { Slot } from "@/types/slot";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session || session.role !== "caregiver") {
    return NextResponse.json({ error: "Caregiver session required." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    patientId?: string;
    medications?: Medication[];
    slots?: Slot[];
    logs?: DoseLog[];
    schedules?: ScheduleItem[];
    wakeTime?: string;
    scheduledDate?: string;
    persist?: boolean;
  };

  if (payload.persist) {
    if (!payload.patientId || !payload.schedules?.length) {
      return NextResponse.json({ error: "patientId and schedules are required to save." }, { status: 400 });
    }

    const saveResult = await saveScheduleBundlesForPatient({
      session,
      patientId: payload.patientId,
      schedules: payload.schedules
    });

    if (!saveResult.ok) {
      return NextResponse.json({ error: saveResult.reason }, { status: 400 });
    }

    const refreshed = await getSchedulePageState(session, payload.patientId);

    return NextResponse.json({
      message: `Schedule saved. ${saveResult.inserted} inserted, ${saveResult.updated} updated, ${saveResult.deleted} removed.`,
      schedules: refreshed.schedules,
      recommendations: refreshed.recommendations
    });
  }

  const state =
    payload.patientId && (!payload.medications?.length || !payload.slots?.length)
      ? await getSchedulePageState(session, payload.patientId)
      : null;

  const medications = payload.medications?.length ? payload.medications : state?.medications ?? [];
  const slots = payload.slots?.length ? payload.slots : state?.slots ?? [];
  const logs = payload.logs?.length ? payload.logs : state?.logs ?? [];

  if (!medications.length || !slots.length) {
    return NextResponse.json(
      {
        error: "Medications and slot records are required before a schedule can be generated."
      },
      { status: 400 }
    );
  }

  // Preserve any existing slot assignments before regenerating
  const slotAssignments: Record<string, number> = {};
  const currentSchedules = state?.schedules || payload.schedules || [];
  for (const schedule of currentSchedules) {
    for (const medicineName of schedule.medicines) {
      // Map each medicine name to its currently assigned slot
      slotAssignments[medicineName] = schedule.slotId;
    }
  }

  const schedules = generateScheduleFromMedications(medications, slots, {
    wakeTime: payload.wakeTime,
    scheduledDate: payload.scheduledDate,
    slotAssignments
  });

  const recommendations = schedules.map((schedule) => ({
    scheduleId: schedule.id,
    ...suggestReschedule(schedule, logs)
  }));

  return NextResponse.json({
    schedules,
    recommendations
  });
}
