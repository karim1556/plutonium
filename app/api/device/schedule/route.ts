import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getTodayIsoDate } from "@/lib/utils";

export async function GET(request: Request) {
  const deviceKey = request.headers.get("x-medassist-device-key");
  const expectedKey = process.env.MEDASSIST_DEVICE_SHARED_KEY;

  if (expectedKey && deviceKey !== expectedKey) {
    return NextResponse.json({ error: "Invalid device key." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json({ error: "deviceId is required." }, { status: 400 });
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return NextResponse.json({ error: "Database not available." }, { status: 500 });
  }

  // 1. Get device owner
  const { data: device } = await service
    .from("devices")
    .select("user_id")
    .eq("id", deviceId)
    .single();

  if (!device) {
    return NextResponse.json([]);
  }

  // 2. Get user's medications
  const { data: medications } = await service
    .from("medications")
    .select("id")
    .eq("user_id", device.user_id);

  const medIds = medications?.map((m: any) => m.id) || [];
  if (medIds.length === 0) {
    return NextResponse.json([]);
  }

  // 3. Get pending schedules for today
  const today = getTodayIsoDate();
  const { data: schedules } = await service
    .from("schedules")
    .select(`
      id,
      time,
      status,
      slots ( slot_number )
    `)
    .in("medication_id", medIds)
    .eq("scheduled_for", today)
    .in("status", ["pending", "due_soon"]);

  if (!schedules) {
    return NextResponse.json([]);
  }

  // 4. Map to simple JSON format for ESP32
  const result = schedules
    .map((s: any) => {
      const slotMatch = Array.isArray(s.slots) ? s.slots[0] : s.slots;
      return {
        id: s.id,
        slot: slotMatch?.slot_number || 0,
        time: s.time.slice(0, 5) // "13:00:00" -> "13:00"
      };
    })
    .filter((s: any) => s.slot > 0);

  // Return a sorted array (earliest first)
  result.sort((a: any, b: any) => a.time.localeCompare(b.time));

  return NextResponse.json(result);
}
