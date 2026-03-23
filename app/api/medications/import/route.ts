import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { createOrUpdateMedicationPlan } from "@/lib/data";
import type { ParsedPrescriptionMedication } from "@/types/medication";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    patientId?: string;
    medications?: ParsedPrescriptionMedication[];
  };

  if (!payload.patientId || !payload.medications?.length) {
    return NextResponse.json({ error: "patientId and medications are required." }, { status: 400 });
  }

  const result = await createOrUpdateMedicationPlan({
    session,
    patientId: payload.patientId,
    medications: payload.medications
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({
    message: `Medication plan saved. ${result.inserted} inserted and ${result.updated} updated.`
  });
}
