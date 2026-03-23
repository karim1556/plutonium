import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { registerOrUpdateDevice } from "@/lib/data";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    patientId?: string;
    ipAddress?: string;
    firmwareVersion?: string;
    requiresFingerprint?: boolean;
  };

  if (!payload.patientId || !payload.ipAddress?.trim()) {
    return NextResponse.json({ error: "patientId and ipAddress are required." }, { status: 400 });
  }

  const result = await registerOrUpdateDevice({
    session,
    patientId: payload.patientId,
    ipAddress: payload.ipAddress.trim(),
    firmwareVersion: payload.firmwareVersion?.trim(),
    requiresFingerprint: payload.requiresFingerprint ?? true
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    device: result.device,
    message: "Device saved and slot records are ready."
  });
}
