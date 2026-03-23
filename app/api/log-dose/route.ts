import { NextResponse } from "next/server";
import { buildHardwareAlert } from "@/lib/hardware";
import { getCurrentSessionUser } from "@/lib/auth";
import { ensurePatientAccess, logDoseForSchedules } from "@/lib/data";
import type { DoseLog } from "@/types/medication";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    patientId?: string;
    scheduleId?: string;
    scheduleIds?: string[];
    status?: DoseLog["status"];
    source?: DoseLog["source"];
    notes?: string;
  };

  const scheduleIds = payload.scheduleIds?.length
    ? payload.scheduleIds
    : payload.scheduleId
      ? [payload.scheduleId]
      : [];

  if (!payload.patientId || !scheduleIds.length || !payload.status) {
    return NextResponse.json(
      {
        error: "patientId, scheduleId or scheduleIds, and status are required."
      },
      { status: 400 }
    );
  }

  const patient = await ensurePatientAccess(session, payload.patientId);

  if (!patient) {
    return NextResponse.json({ error: "Patient not accessible." }, { status: 403 });
  }

  const result = await logDoseForSchedules({
    scheduleIds,
    status: payload.status,
    source: payload.source,
    notes: payload.notes
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    logs: result.logs,
    adherence: result.adherence,
    alert: payload.status === "missed" ? buildHardwareAlert("missed") : null
  });
}
