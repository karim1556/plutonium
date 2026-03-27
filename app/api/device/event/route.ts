import { NextResponse } from "next/server";
import { recordHardwareEvent } from "@/lib/data";
import type { HardwareEvent } from "@/types/slot";

export async function POST(request: Request) {
  const deviceKey = request.headers.get("x-medassist-device-key");
  const expectedKey = process.env.MEDASSIST_DEVICE_SHARED_KEY;

  if (expectedKey && deviceKey !== expectedKey) {
    return NextResponse.json({ error: "Invalid device key." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    deviceId?: string;
    event?: HardwareEvent;
    slotNumber?: number;
    details?: string;
    timestamp?: string;
    scheduleIds?: string[];
  };

  if (!payload.deviceId || !payload.event) {
    return NextResponse.json({ error: "deviceId and event are required." }, { status: 400 });
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "Unknown";

  const result = await recordHardwareEvent({
    deviceId: payload.deviceId,
    event: payload.event,
    slotNumber: payload.slotNumber,
    details: payload.details,
    timestamp: payload.timestamp,
    scheduleIds: payload.scheduleIds,
    ipAddress: ipAddress !== "Unknown" ? ipAddress : undefined
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
