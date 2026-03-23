import type { DoseLog, Medication, ParsedPrescriptionMedication, ScheduleItem } from "@/types/medication";

const ABBREVIATIONS: Record<string, number> = {
  od: 1,
  bd: 2,
  tid: 3,
  qid: 4
};

function guessPartsOfDay(frequency: number) {
  if (frequency === 1) {
    return ["morning"] as const;
  }

  if (frequency === 2) {
    return ["morning", "evening"] as const;
  }

  if (frequency === 3) {
    return ["morning", "afternoon", "night"] as const;
  }

  return ["morning", "afternoon", "evening", "night"] as const;
}

export function parsePrescriptionText(rawText: string) {
  const cleaned = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const medications: ParsedPrescriptionMedication[] = cleaned.map((line) => {
    const durationMatch = line.match(/(\d+)\s*(day|days|week|weeks)/i);
    const dosageMatch = line.match(/(\d+\s?(mg|ml|iu|mcg))/i);
    const tokens = line.split(/\s+/);
    const frequencyToken = tokens.find((token) => ABBREVIATIONS[token.toLowerCase()] || /^\d+x$/i.test(token));
    const frequency = frequencyToken
      ? ABBREVIATIONS[frequencyToken.toLowerCase()] ?? Number(frequencyToken.replace(/x/i, ""))
      : 1;
    const durationValue = durationMatch
      ? Number(durationMatch[1]) * (durationMatch[2].toLowerCase().startsWith("week") ? 7 : 1)
      : 30;
    const name =
      tokens
        .filter((token) => !token.match(/^\d/) && !ABBREVIATIONS[token.toLowerCase()])
        .slice(0, 2)
        .join(" ") || "Unknown medicine";
    const lower = line.toLowerCase();

    return {
      name,
      dosage: dosageMatch?.[1] ?? "Not specified",
      frequency,
      durationDays: durationValue,
      timing: {
        partsOfDay: [...guessPartsOfDay(frequency)],
        mealRelation: lower.includes("before food")
          ? "before_food"
          : lower.includes("after food")
            ? "after_food"
            : lower.includes("with food")
              ? "with_food"
              : "anytime",
        notes: [
          lower.includes("before food")
            ? "Take before meals."
            : lower.includes("after food")
              ? "Take after meals."
              : "Follow clinician guidance."
        ]
      },
      instructions: lower.includes("sos")
        ? ["Take only when required and with clinician advice."]
        : ["Confirm with the doctor if handwriting was unclear."],
      confidence: lower.length > 12 ? 0.88 : 0.64
    };
  });

  return {
    medications,
    notes: [
      "You can plug in Tesseract, Google Vision, or Azure OCR to convert uploaded images into text automatically.",
      "Abbreviations such as OD and BD are expanded into daily frequency automatically."
    ]
  };
}

export function buildMedicationContext(
  schedules: ScheduleItem[],
  logs: DoseLog[],
  medications: Medication[],
  now = new Date()
) {
  const currentHour = now.getHours();
  const nextDose = schedules.find((schedule) => Number(schedule.time.split(":")[0]) >= currentHour);
  const recentMiss = logs
    .filter((log) => log.status === "missed")
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];

  return {
    now: now.toISOString(),
    nextDose,
    recentMiss,
    medications: medications.map((medication) => ({
      name: medication.name,
      dosage: medication.dosage,
      instructions: medication.instructions
    }))
  };
}

export function generateSmartChatAnswer(input: {
  question: string;
  schedules: ScheduleItem[];
  logs: DoseLog[];
  medications: Medication[];
  now?: Date;
}) {
  const { question, schedules, logs, medications } = input;
  const now = input.now ?? new Date();
  const lowered = question.toLowerCase();
  const context = buildMedicationContext(schedules, logs, medications, now);

  if (lowered.includes("take now") || lowered.includes("can i take")) {
    const nextDose = context.nextDose;

    if (nextDose) {
      return {
        answer: `The next planned dose is at ${nextDose.time} from slot ${nextDose.slotId}. If you missed the previous dose, avoid doubling up and use the reschedule check before dispensing.`,
        safety: "Do not take two doses together unless a clinician told you to."
      };
    }
  }

  if (lowered.includes("miss") || lowered.includes("forgot")) {
    return {
      answer:
        "Log the dose as missed first, then check the safe-gap rule. If the next dose is close, skip the missed one and notify the caregiver instead of doubling.",
      safety: "When symptoms worsen or the medicine is high-risk, contact the doctor or pharmacist."
    };
  }

  if (lowered.includes("refill") || lowered.includes("left")) {
    const lowStock = medications.filter(
      (medication) => (medication.remainingPills ?? 99) <= (medication.refillThreshold ?? 5)
    );

    if (lowStock.length) {
      return {
        answer: `${lowStock.map((medication) => medication.name).join(", ")} are running low. Create a refill alert today so the device schedule does not break.`,
        safety: "Keep at least 3 days of buffer stock for bundled slots."
      };
    }
  }

  return {
    answer:
      "I can help with dose timing, missed-dose logic, refill tracking, and hardware status. Ask about the next dose, a missed dose, or device alerts for a context-based answer.",
    safety: "This assistant supports adherence decisions but does not replace clinician advice."
  };
}
