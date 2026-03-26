import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";
import { checkDrugInteractions, type DrugInteractionCheck } from "@/lib/drug-interactions";

interface RiskFlag {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  description: string;
  details?: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function detectMedicationRisks(
  medications: Medication[],
  schedules: ScheduleItem[],
  logs: DoseLog[]
): {
  flags: RiskFlag[];
  interactionCheck: DrugInteractionCheck;
} {
  const flags: RiskFlag[] = [];
  const names = medications.map((medication) => normalize(medication.name));

  // Check for duplicate medicines
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

  if (duplicates.length) {
    flags.push({
      id: "duplicate-medicine",
      title: "Duplicate medicine detected",
      severity: "critical",
      description: `Multiple entries for ${Array.from(new Set(duplicates)).join(", ")} were found. Verify the prescription before dispensing.`
    });
  }

  // Check drug interactions using the comprehensive database
  const interactionCheck = checkDrugInteractions(medications.map((m) => m.name));

  if (interactionCheck.hasInteractions) {
    interactionCheck.interactions.forEach((interaction) => {
      const severity =
        interaction.severity === "contraindicated" || interaction.severity === "severe"
          ? "critical"
          : "warning";

      flags.push({
        id: `interaction-${interaction.drug1}-${interaction.drug2}`,
        title: `Drug interaction: ${interaction.drug1} + ${interaction.drug2}`,
        severity,
        description: interaction.effect,
        details: interaction.recommendation
      });
    });
  }

  // Check slot capacity
  const doubleBookedSlots = schedules.filter((schedule) => schedule.medicines.length > 2);

  if (doubleBookedSlots.length) {
    flags.push({
      id: "slot-overflow",
      title: "Slot capacity risk",
      severity: "warning",
      description:
        "A schedule bundle exceeds the dual-slot capacity. Split this slot before using the hardware."
    });
  }

  // Check for consecutive missed doses
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
      description:
        "The patient has consecutive missed doses. Escalate to caregiver alerts and check device pickup validation."
    });
  }

  // Check for refill warnings
  const lowStockMeds = medications.filter(
    (med) =>
      med.remainingPills !== undefined &&
      med.refillThreshold !== undefined &&
      med.remainingPills <= med.refillThreshold
  );

  if (lowStockMeds.length > 0) {
    flags.push({
      id: "low-stock",
      title: "Refill required",
      severity: "warning",
      description: `${lowStockMeds.map((m) => m.name).join(", ")} running low. Order refills soon.`
    });
  }

  return {
    flags,
    interactionCheck
  };
}
