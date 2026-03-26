import { NextResponse } from "next/server";
import { generateSmartChatAnswer } from "@/lib/ai";
import { generateEnhancedChatResponse, isOpenAIConfigured } from "@/lib/openai-service";
import { getCurrentSessionUser } from "@/lib/auth";
import { getChatState } from "@/lib/data";
import { chatRequestSchema, formatValidationError } from "@/lib/validation";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

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
    const validation = chatRequestSchema.safeParse(body);

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

    const state =
      payload.schedules?.length && payload.logs?.length && payload.medications?.length
        ? {
            schedules: payload.schedules as ScheduleItem[],
            logs: payload.logs as DoseLog[],
            medications: payload.medications as Medication[]
          }
        : await getChatState(session, payload.patientId);

    let response;

    // Use enhanced OpenAI service if configured, otherwise fallback to rule-based
    if (isOpenAIConfigured()) {
      try {
        response = await generateEnhancedChatResponse({
          question: payload.question,
          schedules: state.schedules,
          logs: state.logs,
          medications: state.medications,
          conversationHistory: payload.conversationHistory || [],
          role: session.role,
          patientName: payload.patientName || session.name,
          locale: session.locale || 'en'
        });
      } catch (openaiError) {
        console.warn('OpenAI service failed, falling back to rule-based:', openaiError);
        // Fallback to rule-based system
        response = generateSmartChatAnswer({
          question: payload.question,
          schedules: state.schedules,
          logs: state.logs,
          medications: state.medications
        });
      }
    } else {
      // Use rule-based system if OpenAI not configured
      response = generateSmartChatAnswer({
        question: payload.question,
        schedules: state.schedules,
        logs: state.logs,
        medications: state.medications
      });
    }

    return NextResponse.json({
      ...response,
      enhanced: isOpenAIConfigured(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Chat API error:", error);
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
