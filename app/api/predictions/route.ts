import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { getPatientDashboardState } from "@/lib/data";
import {
  generateAdherencePredictions,
  predictRefillDate,
  suggestInterventions
} from "@/lib/ml-predictions";

export async function GET() {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  try {
    const state = await getPatientDashboardState(session);

    // Generate ML predictions
    const predictions = generateAdherencePredictions(
      state.medications,
      state.todaySchedules,
      state.logs
    );

    // Generate refill predictions for each medication
    const refillPredictions = state.medications
      .filter((med) => med.remainingPills !== undefined)
      .map((med) => ({
        medication: med.name,
        ...predictRefillDate(med, med.frequency, med.remainingPills || 0)
      }));

    // Get intervention suggestions
    const interventions = suggestInterventions(predictions);

    return NextResponse.json({
      success: true,
      predictions,
      refillPredictions,
      interventions,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Predictions API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate predictions",
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
