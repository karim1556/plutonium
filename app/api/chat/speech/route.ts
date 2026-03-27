import { NextResponse } from "next/server";
import { generateEnhancedChatResponse, isOpenAIConfigured } from "@/lib/openai-service";
import { getCurrentSessionUser } from "@/lib/auth";
import { getChatState } from "@/lib/data";
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
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob | null;
    const question = formData.get("question") as string | null;
    const patientId = formData.get("patientId") as string | null;
    const patientName = formData.get("patientName") as string | null;
    
    // Parse arrays
    let schedules: ScheduleItem[] = [];
    let logs: DoseLog[] = [];
    let medications: Medication[] = [];
    let conversationHistory: any[] = [];
    
    try {
      const schedulesStr = formData.get("schedules") as string | null;
      if (schedulesStr) schedules = JSON.parse(schedulesStr);
      
      const logsStr = formData.get("logs") as string | null;
      if (logsStr) logs = JSON.parse(logsStr);
      
      const medsStr = formData.get("medications") as string | null;
      if (medsStr) medications = JSON.parse(medsStr);
      
      const histStr = formData.get("conversationHistory") as string | null;
      if (histStr) conversationHistory = JSON.parse(histStr);
    } catch (e) {
      console.error("Failed to parse JSON fields", e);
    }

    let transcribedText = question || "";
    let detectedLang = "en";

    if (audioBlob) {
      // 1. STT with Deepgram
      console.log("Transcribing audio with Deepgram...");
      const deepgramRes = await fetch("https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=multi&detect_language=true", {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": audioBlob.type || "audio/webm",
        },
        body: audioBlob,
      });
      
      if (!deepgramRes.ok) {
        const errorText = await deepgramRes.text();
        console.error("Deepgram Error:", errorText);
      } else {
        const dgData = await deepgramRes.json();
        transcribedText = dgData.results?.channels[0]?.alternatives[0]?.transcript || transcribedText;
        detectedLang = dgData.results?.channels[0]?.detected_language || "en";
      }
    }

    if (!transcribedText) {
      return NextResponse.json({ error: "No text or audio provided" }, { status: 400 });
    }

    console.log(`Transcribed/Question (${detectedLang}):`, transcribedText);

    // 2. Generate LLM Response
    const state = schedules.length && logs.length && medications.length
        ? { schedules, logs, medications }
        : await getChatState(session, patientId || undefined);

    let llmResponse = { answer: "I'm sorry, I couldn't process your request.", safety: "Please contact support." };
    let enhanced = false;

    if (isOpenAIConfigured() || process.env.GROQ_API_KEY) {
      try {
        llmResponse = await generateEnhancedChatResponse({
          question: transcribedText,
          schedules: state.schedules,
          logs: state.logs,
          medications: state.medications,
          conversationHistory,
          role: session.role,
          patientName: patientName || session.name,
          locale: detectedLang 
        });
        enhanced = true;
      } catch (error) {
        console.error("LLM Error:", error);
      }
    }

    // 3. TTS with ElevenLabs
    let audioBase64 = null;
    if (process.env.ELEVENLABS_API_KEY && llmResponse.answer) {
      try {
        console.log("Synthesizing speech with ElevenLabs...");
        // Using Rachel (English default) or a multilingual voice like Alice/Aria
        const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel 
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
          },
          body: JSON.stringify({
            text: llmResponse.answer,
            model_id: "eleven_multilingual_v2", // Important for Hindi/Marathi
            voice_settings: {
              similarity_boost: 0.75,
              stability: 0.5
            }
          })
        });

        if (ttsRes.ok) {
          const arrayBuffer = await ttsRes.arrayBuffer();
          audioBase64 = Buffer.from(arrayBuffer).toString('base64');
        } else {
          console.error("ElevenLabs error:", await ttsRes.text());
        }
      } catch (error) {
        console.error("TTS Error:", error);
      }
    }

    return NextResponse.json({
      question: transcribedText,
      answer: llmResponse.answer,
      safety: llmResponse.safety,
      enhanced,
      audioBase64,
      language: detectedLang,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Speech Chat API error:", error);
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
