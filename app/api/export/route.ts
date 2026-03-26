import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { getPatientDashboardState } from "@/lib/data";
import { format } from "date-fns";

// FHIR-compatible data export
export async function GET(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format") || "json";
    const includeHistory = searchParams.get("includeHistory") === "true";

    const state = await getPatientDashboardState(session);

    // Build export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportFormat: "MedAssist-v1",
      patient: {
        id: session.id,
        name: session.name
      },
      medications: state.medications.map((med) => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        timing: med.timing,
        instructions: med.instructions,
        remainingPills: med.remainingPills
      })),
      schedules: state.todaySchedules.map((schedule) => ({
        id: schedule.id,
        time: schedule.time,
        medicines: schedule.medicines,
        slotId: schedule.slotId,
        status: schedule.status
      })),
      adherence: {
        taken: state.adherence.taken,
        missed: state.adherence.missed,
        delayed: state.adherence.delayed,
        total: state.adherence.total,
        score: state.adherence.score
      },
      logs: includeHistory
        ? state.logs.map((log) => ({
            id: log.id,
            scheduleId: log.scheduleId,
            status: log.status,
            timestamp: log.timestamp,
            source: log.source
          }))
        : [],
      device: state.device
        ? {
            id: state.device.id,
            status: state.device.status,
            firmwareVersion: state.device.firmwareVersion
          }
        : null
    };

    // FHIR-compatible format
    if (formatType === "fhir") {
      const fhirBundle = convertToFHIR(exportData);
      return NextResponse.json(fhirBundle);
    }

    // CSV format
    if (formatType === "csv") {
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="medassist-export-${format(new Date(), "yyyy-MM-dd")}.csv"`
        }
      });
    }

    // Default JSON format
    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      {
        error: "Failed to export data",
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Convert to FHIR R4 format
function convertToFHIR(data: any) {
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: data.exportedAt,
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: data.patient.id
        }
      },
      ...data.medications.map((med: any) => ({
        resource: {
          resourceType: "MedicationRequest",
          id: med.id,
          status: "active",
          intent: "order",
          medicationCodeableConcept: {
            text: med.name
          },
          dosageInstruction: [
            {
              text: `${med.dosage} ${med.frequency}x daily`,
              timing: {
                repeat: {
                  frequency: med.frequency,
                  period: 1,
                  periodUnit: "d"
                }
              }
            }
          ]
        }
      })),
      ...data.logs.map((log: any) => ({
        resource: {
          resourceType: "MedicationAdministration",
          id: log.id,
          status: log.status === "taken" ? "completed" : "not-done",
          effectiveDateTime: log.timestamp
        }
      }))
    ]
  };
}

// Convert to CSV format
function convertToCSV(data: any) {
  const rows: string[] = [];
  rows.push("Type,ID,Name,Dosage,Frequency,Status,Timestamp");

  data.medications.forEach((med: any) => {
    rows.push(
      `Medication,${med.id},"${med.name}",${med.dosage},${med.frequency}x/day,Active,`
    );
  });

  data.schedules.forEach((schedule: any) => {
    rows.push(
      `Schedule,${schedule.id},"${schedule.medicines.join("; ")}",,,${schedule.status},${schedule.time}`
    );
  });

  data.logs.forEach((log: any) => {
    rows.push(`Log,${log.id},,,,${log.status},${log.timestamp}`);
  });

  return rows.join("\n");
}
