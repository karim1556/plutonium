import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

interface RiskFlag {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  description: string;
}

const DANGEROUS_COMBINATIONS = [
  {
    pair: ["aspirin", "ibuprofen"],
    message: "Possible bleeding risk when both medicines are used together without supervision."
  },
  {
    pair: ["warfarin", "metronidazole"],
    message: "Known interaction risk. This combination needs clinician review."
  },
  {
    pair: ["clopidogrel", "omeprazole"],
    message: "Can reduce antiplatelet effect. Consider a pharmacist review."
  }
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function detectMedicationRisks(
  medications: Medication[],
  schedules: ScheduleItem[],
  logs: DoseLog[]
) {
  const flags: RiskFlag[] = [];
  const names = medications.map((medication) => normalize(medication.name));
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

  if (duplicates.length) {
    flags.push({
      id: "duplicate-medicine",
      title: "Duplicate medicine detected",
      severity: "critical",
      description: `Multiple entries for ${Array.from(new Set(duplicates)).join(", ")} were found. Verify the prescription before dispensing.`
    });
  }

  DANGEROUS_COMBINATIONS.forEach((combination) => {
    if (combination.pair.every((medicine) => names.includes(medicine))) {
      flags.push({
        id: `combo-${combination.pair.join("-")}`,
        title: "Potential drug interaction",
        severity: "warning",
        description: combination.message
      });
    }
  });

  const doubleBookedSlots = schedules.filter((schedule) => schedule.medicines.length > 2);

  if (doubleBookedSlots.length) {
    flags.push({
      id: "slot-overflow",
      title: "Slot capacity risk",
      severity: "warning",
      description: "A schedule bundle exceeds the dual-slot capacity. Split this slot before using the hardware."
    });
  }

  const consecutiveMisses = logs
    .slice()
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
    .reduce(
      (state, log) => {
        if (log.status === "missed") {
          state.current += 1;
          state.max = Math.max(state.max, state.current);
        } else {
          state.current = 0;
        }
        return state;
      },
      { current: 0, max: 0 }
    ).max;

  if (consecutiveMisses >= 2) {
    flags.push({
      id: "consecutive-misses",
      title: "Repeat miss pattern",
      severity: "warning",
      description: "The patient has consecutive missed doses. Escalate to caregiver alerts and check device pickup validation."
    });
  }

  return flags;
}
