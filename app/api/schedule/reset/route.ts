import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const sessionUser = await getCurrentSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patient") || sessionUser.id;
    const supabase = createServerSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection error" }, { status: 500 });
    }

    // Since medications table handles ON DELETE CASCADE for schedules,
    // and both slots and devices are linked, we can run simpler queries.
    
    // First, wipe all medications (which cascadingly deletes schedules and logs)
    const { error: medError } = await supabase
      .from("medications")
      .delete()
      .eq("user_id", patientId);

    console.log("Deleted medications:", medError ? medError.message : "Success");

    // Second, find devices and clear slots based on those device IDs
    const { data: devices } = await supabase
      .from("devices")
      .select("id")
      .eq("user_id", patientId);
      
    if (devices && devices.length > 0) {
      const deviceIds = devices.map(d => d.id);
      
      const { error: slotError } = await supabase
        .from("slots")
        .delete()
        .in("device_id", deviceIds);
        
      console.log("Deleted slots:", slotError ? slotError.message : "Success");
    }

    return NextResponse.json({ success: true, message: "All data cleared successfully." });
  } catch (error) {
    console.error("Reset API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
