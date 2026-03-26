"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Loader2, SendHorizonal, Mic, MicOff, Volume2, VolumeX, MessageCircle } from "lucide-react";
import type { AppRole } from "@/types/auth";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

interface VoiceChatPanelProps {
  schedules: ScheduleItem[];
  logs: DoseLog[];
  medications: Medication[];
  role: AppRole;
  promptStarters: string[];
  patientName?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  safety?: string;
  timestamp: Date;
}

export function VoiceChatPanel({ schedules, logs, medications, role, promptStarters, patientName }: VoiceChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        role === "patient"
          ? `Hello${patientName ? ` ${patientName}` : ""}! I'm your medication assistant. Ask me anything about your doses, schedule, or if you need help with your medicines.`
          : `Welcome! I'm here to help you monitor ${patientName || "your patient"}'s medication adherence. Ask me about doses, risks, or any concerns.`,
      safety:
        role === "patient"
          ? "I provide guidance based on your current medication plan. Always consult your doctor for medical decisions."
          : "Responses are based on current schedule, adherence history, and available data.",
      timestamp: new Date()
    }
  ]);
  const [isPending, startTransition] = useTransition();

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check for speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition && !!window.speechSynthesis);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Text-to-Speech function
  const speak = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text function
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onstart = () => setIsListening(true);

    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setQuestion(transcript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const send = () => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: question,
      timestamp: new Date()
    };

    setMessages((current) => [...current, userMessage]);
    const currentQuestion = question;
    setQuestion("");

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentQuestion,
            schedules,
            logs,
            medications
          })
        });

        const payload = (await response.json()) as { answer: string; safety: string };

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: payload.answer,
          safety: payload.safety,
          timestamp: new Date()
        };

        setMessages((current) => [...current, assistantMessage]);

        // Auto-speak the response if voice is enabled
        if (voiceEnabled) {
          speak(payload.answer);
        }
      })();
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* Main Chat Area */}
      <div className="flex flex-col rounded-[34px] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
              <MessageCircle className="h-5 w-5 text-sky-700" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">MedAssist Chat</p>
              <p className="text-xs text-slate-500">
                {role === "patient" ? "Your personal medication helper" : "Care monitoring assistant"}
              </p>
            </div>
          </div>

          {/* Voice Controls */}
          {speechSupported && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoice}
                className={`rounded-full p-2 transition ${
                  voiceEnabled ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
                }`}
                title={voiceEnabled ? "Disable voice responses" : "Enable voice responses"}
              >
                {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              {isSpeaking && (
                <span className="text-xs text-sky-600 animate-pulse">Speaking...</span>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[500px]">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] ${
                  message.role === "assistant"
                    ? "rounded-[24px] rounded-tl-lg bg-gradient-to-br from-sky-50 to-blue-50 p-4"
                    : "rounded-[24px] rounded-tr-lg bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white"
                }`}
              >
                <p className="text-sm leading-6">{message.content}</p>
                {message.safety && (
                  <p className={`mt-2 text-xs ${message.role === "user" ? "text-white/60" : "text-slate-500"}`}>
                    {message.safety}
                  </p>
                )}
                <p className={`mt-1 text-xs ${message.role === "user" ? "text-white/40" : "text-slate-400"}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex justify-start">
              <div className="rounded-[24px] rounded-tl-lg bg-sky-50 p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                  <span className="text-sm text-slate-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  role === "patient"
                    ? "Ask about your medication..."
                    : "Ask about patient adherence..."
                }
                rows={2}
                className="w-full resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="flex gap-2">
              {/* Voice Input Button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              )}

              {/* Send Button */}
              <button
                type="button"
                onClick={send}
                disabled={isPending || !question.trim()}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SendHorizonal className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {isListening && (
            <p className="mt-2 text-center text-sm text-red-500 animate-pulse">
              Listening... Speak now
            </p>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Quick Questions</p>
          <div className="mt-4 space-y-2">
            {promptStarters.slice(0, 4).map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => setQuestion(starter)}
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/20"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Guide */}
        {speechSupported && (
          <div className="rounded-[28px] border border-sky-100 bg-sky-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Voice Features</p>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <Mic className="h-3 w-3" /> Tap mic to speak your question
              </p>
              <p className="flex items-center gap-2">
                <Volume2 className="h-3 w-3" /> Responses are read aloud
              </p>
            </div>
          </div>
        )}

        {/* Context Info */}
        <div className="rounded-[28px] border border-slate-100 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Chat Context</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>{schedules.length} scheduled doses</p>
            <p>{logs.length} recent logs</p>
            <p>{medications.length} medications tracked</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
}
