import { NextResponse } from "next/server";
import { generateSmartChatAnswer } from "@/lib/ai";
import { getCurrentSessionUser } from "@/lib/auth";
import { getChatState } from "@/lib/data";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    question?: string;
    patientId?: string;
    schedules?: ScheduleItem[];
    logs?: DoseLog[];
    medications?: Medication[];
  };

  if (!payload.question?.trim()) {
    return NextResponse.json(
      {
        error: "question is required."
      },
      { status: 400 }
    );
  }

  const state =
    payload.schedules?.length && payload.logs?.length && payload.medications?.length
      ? {
          schedules: payload.schedules,
          logs: payload.logs,
          medications: payload.medications
        }
      : await getChatState(session, payload.patientId);

  const response = generateSmartChatAnswer({
    question: payload.question,
    schedules: state.schedules,
    logs: state.logs,
    medications: state.medications
  });

  return NextResponse.json(response);
}
