import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { buildMedicationContext } from "@/lib/ai";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

// AI Chat API - Conversational Assistant with Context
// Supports: OpenAI, Anthropic, or fallback rule-based

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
  schedules?: ScheduleItem[];
  logs?: DoseLog[];
  medications?: Medication[];
  role?: string;
  locale?: string;
}

// Build system prompt based on role and context
function buildSystemPrompt(
  role: string,
  context: ReturnType<typeof buildMedicationContext>,
  locale: string
) {
  const basePrompt = `You are MedAssist AI, a friendly and knowledgeable medication assistant. You help ${role === "patient" ? "patients manage their medications" : "caregivers monitor patient medication adherence"}.

IMPORTANT GUIDELINES:
- Be warm, empathetic, and supportive
- Provide clear, simple explanations
- Always prioritize safety - recommend consulting healthcare providers for medical decisions
- Never diagnose conditions or recommend specific treatments
- If asked about emergencies, advise contacting emergency services immediately
- Keep responses concise but helpful (2-4 sentences for simple questions)
- Use the medication context provided to give personalized guidance`;

  const medicationContext = context.nextDose
    ? `\n\nCURRENT MEDICATION CONTEXT:
- Next scheduled dose: ${context.nextDose.time} (Slot ${context.nextDose.slotId})
- Medications in next dose: ${context.medications.map(m => m.name).join(", ")}
- Most recent missed dose: ${context.recentMiss ? `${context.recentMiss.timestamp}` : "None"}`
    : "\n\nNo active medication schedule found.";

  const roleSpecific = role === "patient"
    ? "\n\nFor this patient, focus on:\n- Medication timing and reminders\n- What to do if a dose is missed\n- Refill tracking\n- Simple health tips related to their medications"
    : "\n\nFor this caregiver, focus on:\n- Patient adherence patterns\n- Risk indicators and predictions\n- Intervention suggestions\n- Communication strategies with the patient";

  return basePrompt + medicationContext + roleSpecific;
}

// Generate AI response using OpenAI (if available) or fallback
async function generateAIResponse(
  message: string,
  conversationHistory: ConversationMessage[],
  systemPrompt: string
): Promise<string> {
  // Try OpenAI first if API key is available
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: "user", content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || generateFallbackResponse(message);
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
    }
  }

  // Try Anthropic if available
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            ...conversationHistory.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: "user", content: message }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.content[0]?.text || generateFallbackResponse(message);
      }
    } catch (error) {
      console.error("Anthropic API error:", error);
    }
  }

  // Fallback to intelligent rule-based response
  return generateFallbackResponse(message);
}

// Enhanced rule-based fallback with conversational context
function generateFallbackResponse(message: string): string {
  const lowered = message.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|namaste|namaskar)/i.test(lowered)) {
    const greetings = [
      "Hello! How can I help you with your medications today?",
      "Hi there! I'm here to help with any medication questions you have.",
      "Good to see you! What would you like to know about your medication schedule?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Thank you
  if (/thank|thanks|धन्यवाद|ధన్యవాదాలు|நன்றி/i.test(lowered)) {
    return "You're welcome! Remember, I'm always here if you have more questions about your medications. Take care!";
  }

  // Dose timing questions
  if (lowered.includes("take now") || lowered.includes("can i take")) {
    return "Before taking any medication outside your scheduled time, please check your next scheduled dose. If it's within 2 hours, it's usually better to wait. If you're unsure, please consult your doctor or pharmacist for guidance specific to your medication.";
  }

  // Missed dose
  if (lowered.includes("miss") || lowered.includes("forgot") || lowered.includes("skip")) {
    return "If you missed a dose, don't double up on your next dose. Check the time gap to your next scheduled dose. If it's been less than half the time between doses, you may take it now. For critical medications, please contact your healthcare provider for specific guidance.";
  }

  // Refill questions
  if (lowered.includes("refill") || lowered.includes("running out") || lowered.includes("left")) {
    return "I recommend checking your medication stock regularly. When you have about a week's supply left, it's time to arrange a refill. You can use the data export feature to share your medication history with your pharmacy or doctor.";
  }

  // Side effects
  if (lowered.includes("side effect") || lowered.includes("feeling") || lowered.includes("reaction")) {
    return "If you're experiencing side effects from your medication, please document them and contact your healthcare provider. For severe reactions like difficulty breathing, swelling, or chest pain, seek emergency medical care immediately.";
  }

  // Device questions
  if (lowered.includes("device") || lowered.includes("dispenser") || lowered.includes("slot")) {
    return "Your MedAssist dispenser helps manage your medications. Make sure it's connected to WiFi and the slots are properly loaded. If you're having issues, check the device status in your settings or contact support.";
  }

  // Schedule questions
  if (lowered.includes("schedule") || lowered.includes("when") || lowered.includes("next dose")) {
    return "Your medication schedule is shown on your dashboard. The next dose time and medications are displayed there. You can also check the full schedule in the Support section.";
  }

  // Adherence questions
  if (lowered.includes("adherence") || lowered.includes("compliance") || lowered.includes("tracking")) {
    return "Your adherence score tracks how consistently you take your medications on time. Regular adherence is important for medication effectiveness. Check your analytics to see your patterns and areas for improvement.";
  }

  // Emergency
  if (lowered.includes("emergency") || lowered.includes("overdose") || lowered.includes("poison")) {
    return "⚠️ For medical emergencies, please call emergency services immediately (911 in the US, 112 in India). Do not wait. If you suspect an overdose, contact Poison Control as well.";
  }

  // Default helpful response
  return "I'm here to help with medication timing, missed doses, refill tracking, and general guidance. Could you please tell me more specifically what you'd like to know? For medical advice, always consult your healthcare provider.";
}

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const {
      message,
      conversationHistory = [],
      schedules = [],
      logs = [],
      medications = [],
      role = session.role,
      locale = "en"
    } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Build medication context
    const context = buildMedicationContext(
      schedules as ScheduleItem[],
      logs as DoseLog[],
      medications as Medication[]
    );

    // Build system prompt
    const systemPrompt = buildSystemPrompt(role, context, locale);

    // Generate AI response
    const response = await generateAIResponse(
      message,
      conversationHistory,
      systemPrompt
    );

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      conversationId: session.id
    });
  } catch (error) {
    console.error("AI Chat API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "SERVER_ERROR",
        response: "I apologize, but I'm having trouble processing your request. Please try again."
      },
      { status: 500 }
    );
  }
}
