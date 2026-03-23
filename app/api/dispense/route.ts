import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { ensurePatientAccess, recordHardwareEvent } from "@/lib/data";
import { buildHardwareAlert, triggerDispense } from "@/lib/hardware";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    slot?: number;
    deviceIP?: string;
    deviceId?: string;
    patientId?: string;
  };

  if (!payload.slot || !payload.deviceIP) {
    return NextResponse.json(
      {
        error: "slot and deviceIP are required."
      },
      { status: 400 }
    );
  }

  if (payload.patientId) {
    const patient = await ensurePatientAccess(session, payload.patientId);

    if (!patient) {
      return NextResponse.json({ error: "Patient not accessible." }, { status: 403 });
    }
  }

  if (payload.deviceId) {
    await recordHardwareEvent({
      deviceId: payload.deviceId,
      event: "dispense_requested",
      slotNumber: payload.slot,
      details: `${session.name} initiated a supervised dispense from the web app.`
    });
  }

  const result = await triggerDispense(payload.deviceIP, payload.slot);

  if (payload.deviceId) {
    await recordHardwareEvent({
      deviceId: payload.deviceId,
      event: result.ok ? "dispensed" : "offline",
      slotNumber: payload.slot,
      details: result.message
    });
  }

  return NextResponse.json({
    ...result,
    alert: result.ok ? null : buildHardwareAlert("offline")
  });
}
