import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { ensurePatientAccess, recordHardwareEvent } from "@/lib/data";
import { buildHardwareAlert, triggerDispense } from "@/lib/hardware";
import { dispenseRequestSchema, formatValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = dispenseRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: formatValidationError(validation.error)
        },
        { status: 400 }
      );
    }

    const payload = validation.data;

    if (payload.patientId) {
      const patient = await ensurePatientAccess(session, payload.patientId);

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not accessible", code: "FORBIDDEN" },
          { status: 403 }
        );
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
  } catch (error) {
    console.error("Dispense API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
