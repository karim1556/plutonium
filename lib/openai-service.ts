import OpenAI from 'openai';
import { buildMedicationContext } from './ai';
import type { DoseLog, Medication, ScheduleItem } from '@/types/medication';

// Lazy initialize OpenAI client only when needed
let aiModel = 'gpt-4o';

function getOpenAIClient(): OpenAI | null {
  if (process.env.GROQ_API_KEY) {
    aiModel = 'llama-3.3-70b-versatile';
    return new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  aiModel = 'gpt-4o';
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface EnhancedChatRequest {
  question: string;
  schedules: ScheduleItem[];
  logs: DoseLog[];
  medications: Medication[];
  conversationHistory?: ChatMessage[];
  role: 'patient' | 'caregiver';
  patientName?: string;
  locale?: string;
}

/**
 * Enhanced AI Chat Service using OpenAI GPT-4
 * Provides conversational, context-aware responses for medication management
 */
export async function generateEnhancedChatResponse({
  question,
  schedules,
  logs,
  medications,
  conversationHistory = [],
  role,
  patientName,
  locale = 'en'
}: EnhancedChatRequest): Promise<{ answer: string; safety: string }> {

  // Build medication context
  const context = buildMedicationContext(schedules, logs, medications);

  // Create role-specific system prompt
  const systemMessage = createSystemMessage(role, context, patientName, locale);

  // Prepare conversation messages for OpenAI
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemMessage },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user', content: question }
  ];

  try {
    // Get OpenAI client (lazy initialization)
    const openai = getOpenAIClient();
    if (!openai) {
      throw new Error('OpenAI client not available - no API key configured');
    }

    // Call OpenAI/Groq
    const completion = await openai.chat.completions.create({
      model: aiModel,
      messages,
      max_tokens: 300,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0.2,
      presence_penalty: 0.1,
    });

    const response = completion.choices[0]?.message?.content ||
      'I apologize, but I cannot generate a response right now. Please try again.';

    // Extract safety message if included
    const parts = response.split('[SAFETY]');
    const answer = parts[0].trim();
    const safety = parts[1]?.trim() || 'Always consult your healthcare provider for medical decisions.';

    return { answer, safety };

  } catch (error) {
    console.error('OpenAI API error:', error);

    // Fallback to rule-based system if OpenAI fails
    const { generateSmartChatAnswer } = await import('./ai');
    return generateSmartChatAnswer({
      question,
      schedules,
      logs,
      medications
    });
  }
}

/**
 * Creates role-specific system message for OpenAI
 */
function createSystemMessage(
  role: 'patient' | 'caregiver',
  context: ReturnType<typeof buildMedicationContext>,
  patientName?: string,
  locale: string = 'en'
): string {

  const basePersonality = `You are MedAssist AI, a warm, empathetic, and knowledgeable medication management assistant.

PERSONALITY:
- Be supportive, understanding, and patient-focused
- Use simple, clear language (avoid medical jargon)
- Show empathy for medication challenges
- Be encouraging about adherence
- Keep responses concise but helpful (2-4 sentences)

CRITICAL SAFETY RULES:
- Never diagnose conditions or recommend specific treatments
- Always encourage consulting healthcare providers for medical decisions
- If emergency symptoms mentioned, immediately advise contacting emergency services
- For missed doses, emphasize checking with doctor/pharmacist
- Include a [SAFETY] section at the end of each response with relevant safety advice`;

  // Build medication context summary
  const medicationSummary = context.medications.length > 0
    ? `Current medications: ${context.medications.map(m => `${m.name} ${m.dosage}`).join(', ')}.`
    : 'No medications currently tracked.';

  const nextDoseSummary = context.nextDose
    ? `Next scheduled dose: ${context.nextDose.time} (Slot ${context.nextDose.slotId}) - ${context.nextDose.medicines.join(' + ')}.`
    : 'No upcoming doses scheduled.';

  const recentMissSummary = context.recentMiss
    ? `Recent missed dose: ${new Date(context.recentMiss.timestamp).toLocaleDateString()}.`
    : 'No recent missed doses.';

  // Role-specific instructions
  const roleSpecific = role === 'patient'
    ? `You're helping ${patientName || 'a patient'} with their personal medication management.

FOCUS ON:
- Medication timing and reminders
- What to do if doses are missed
- Refill tracking and reminders
- Device troubleshooting
- Simple health tips related to their medications
- Encouraging adherence with positive reinforcement

TONE: Personal, supportive, talking directly to the patient ("your medication", "your next dose")`

    : `You're helping a caregiver monitor ${patientName || 'their patient'}'s medication adherence.

FOCUS ON:
- Patient adherence patterns and trends
- Risk indicators and early warnings
- Intervention suggestions and timing
- Communication strategies with the patient
- Caregiver guidance and support
- Professional insights for care decisions

TONE: Professional but warm, talking to the caregiver ("the patient", "their medication")`;

  // Language-specific adjustments
  const languageNote = locale !== 'en'
    ? `\nIf the user prefers ${locale}, respond in that language while maintaining the same safety standards.`
    : '';

  return `${basePersonality}

CURRENT CONTEXT:
${medicationSummary}
${nextDoseSummary}
${recentMissSummary}

${roleSpecific}${languageNote}

RESPONSE FORMAT:
Provide your main response naturally, then add a [SAFETY] section with relevant safety advice.

Remember: You are a supportive assistant that helps with medication adherence, NOT a medical replacement.`;
}

/**
 * Fallback function when OpenAI is not available or fails
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Quick health check for OpenAI connectivity
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return false;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    });
    return !!response.choices[0]?.message?.content;
  } catch {
    return false;
  }
}