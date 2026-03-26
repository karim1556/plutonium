/**
 * Drug Interaction Database
 * This is a starter database with common medication interactions.
 * For production, integrate with FDA API, RxNorm, or DrugBank.
 */

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "mild" | "moderate" | "severe" | "contraindicated";
  effect: string;
  recommendation: string;
}

export interface DrugInteractionCheck {
  hasInteractions: boolean;
  interactions: DrugInteraction[];
  riskLevel: "safe" | "caution" | "warning" | "danger";
}

// Common drug interactions database
const INTERACTION_DATABASE: DrugInteraction[] = [
  // NSAIDs + Blood Thinners
  {
    drug1: "aspirin",
    drug2: "warfarin",
    severity: "severe",
    effect: "Increased risk of bleeding",
    recommendation:
      "Avoid combination. If necessary, use with extreme caution and monitor INR closely."
  },
  {
    drug1: "ibuprofen",
    drug2: "aspirin",
    severity: "moderate",
    effect: "Reduced cardioprotective effect of aspirin",
    recommendation: "Take ibuprofen at least 8 hours before or 30 minutes after aspirin."
  },
  {
    drug1: "ibuprofen",
    drug2: "warfarin",
    severity: "severe",
    effect: "Increased risk of bleeding",
    recommendation: "Avoid combination or monitor closely for bleeding."
  },

  // Antibiotics + Oral Contraceptives
  {
    drug1: "amoxicillin",
    drug2: "contraceptive",
    severity: "moderate",
    effect: "May reduce effectiveness of oral contraceptives",
    recommendation: "Use additional contraceptive methods during antibiotic course."
  },

  // ACE Inhibitors + Potassium
  {
    drug1: "lisinopril",
    drug2: "potassium",
    severity: "moderate",
    effect: "Risk of hyperkalemia",
    recommendation: "Monitor potassium levels regularly."
  },

  // Diabetes medications
  {
    drug1: "metformin",
    drug2: "insulin",
    severity: "moderate",
    effect: "Increased risk of hypoglycemia",
    recommendation: "Monitor blood glucose closely and adjust doses as needed."
  },

  // Statins + Grapefruit
  {
    drug1: "atorvastatin",
    drug2: "grapefruit",
    severity: "moderate",
    effect: "Increased statin levels and risk of side effects",
    recommendation: "Avoid grapefruit juice. Use alternative citrus fruits."
  },
  {
    drug1: "simvastatin",
    drug2: "grapefruit",
    severity: "severe",
    effect: "Significantly increased statin levels",
    recommendation: "Strictly avoid grapefruit and grapefruit juice."
  },

  // MAO Inhibitors + SSRIs
  {
    drug1: "selegiline",
    drug2: "fluoxetine",
    severity: "contraindicated",
    effect: "Risk of serotonin syndrome",
    recommendation: "Do not combine. Wait at least 2 weeks between medications."
  },

  // Thyroid + Calcium/Iron
  {
    drug1: "levothyroxine",
    drug2: "calcium",
    severity: "moderate",
    effect: "Reduced absorption of levothyroxine",
    recommendation: "Take levothyroxine at least 4 hours before calcium supplements."
  },
  {
    drug1: "levothyroxine",
    drug2: "iron",
    severity: "moderate",
    effect: "Reduced absorption of levothyroxine",
    recommendation: "Take levothyroxine at least 4 hours before iron supplements."
  },

  // Alcohol interactions
  {
    drug1: "paracetamol",
    drug2: "alcohol",
    severity: "severe",
    effect: "Increased risk of liver damage",
    recommendation: "Avoid alcohol while taking paracetamol, especially high doses."
  },
  {
    drug1: "metronidazole",
    drug2: "alcohol",
    severity: "contraindicated",
    effect: "Severe nausea, vomiting, and other disulfiram-like reactions",
    recommendation: "Avoid alcohol completely during treatment and for 3 days after."
  },

  // PPIs + Clopidogrel
  {
    drug1: "omeprazole",
    drug2: "clopidogrel",
    severity: "moderate",
    effect: "Reduced effectiveness of clopidogrel",
    recommendation: "Use alternative PPI like pantoprazole or take at different times."
  }
];

// Generic name mappings (brand to generic)
const GENERIC_MAPPINGS: Record<string, string> = {
  tylenol: "paracetamol",
  advil: "ibuprofen",
  motrin: "ibuprofen",
  "aspirin protect": "aspirin",
  ecosprin: "aspirin",
  disprin: "aspirin",
  glycomet: "metformin",
  glucophage: "metformin",
  lipitor: "atorvastatin",
  zocor: "simvastatin",
  prozac: "fluoxetine",
  synthroid: "levothyroxine",
  eltroxin: "levothyroxine",
  plavix: "clopidogrel",
  prilosec: "omeprazole"
};

/**
 * Normalize drug name to generic name
 */
function normalizeDrugName(drugName: string): string {
  const normalized = drugName.toLowerCase().trim();
  return GENERIC_MAPPINGS[normalized] || normalized;
}

/**
 * Check if two drugs interact
 */
function checkInteractionPair(drug1: string, drug2: string): DrugInteraction | null {
  const norm1 = normalizeDrugName(drug1);
  const norm2 = normalizeDrugName(drug2);

  const interaction = INTERACTION_DATABASE.find(
    (item) =>
      (item.drug1 === norm1 && item.drug2 === norm2) ||
      (item.drug1 === norm2 && item.drug2 === norm1)
  );

  return interaction || null;
}

/**
 * Check interactions for a list of medications
 */
export function checkDrugInteractions(medications: string[]): DrugInteractionCheck {
  const interactions: DrugInteraction[] = [];

  // Check each pair of medications
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const interaction = checkInteractionPair(medications[i], medications[j]);
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }

  // Determine overall risk level
  let riskLevel: DrugInteractionCheck["riskLevel"] = "safe";

  if (interactions.length > 0) {
    const hasSevere = interactions.some((i) => i.severity === "severe");
    const hasContraindicated = interactions.some((i) => i.severity === "contraindicated");
    const hasModerate = interactions.some((i) => i.severity === "moderate");

    if (hasContraindicated) {
      riskLevel = "danger";
    } else if (hasSevere) {
      riskLevel = "warning";
    } else if (hasModerate) {
      riskLevel = "caution";
    }
  }

  return {
    hasInteractions: interactions.length > 0,
    interactions,
    riskLevel
  };
}

/**
 * Get drug information (stub for future API integration)
 */
export interface DrugInfo {
  name: string;
  genericName: string;
  category: string;
  commonSideEffects: string[];
  warnings: string[];
}

export function getDrugInfo(drugName: string): DrugInfo | null {
  const genericName = normalizeDrugName(drugName);

  // This is a stub. In production, integrate with RxNorm or DrugBank API
  const commonDrugs: Record<string, DrugInfo> = {
    paracetamol: {
      name: "Paracetamol",
      genericName: "paracetamol",
      category: "Analgesic/Antipyretic",
      commonSideEffects: ["Nausea", "Rash (rare)"],
      warnings: ["Liver damage with overdose", "Avoid alcohol"]
    },
    aspirin: {
      name: "Aspirin",
      genericName: "aspirin",
      category: "NSAID/Antiplatelet",
      commonSideEffects: ["Stomach upset", "Bleeding risk"],
      warnings: ["Avoid in children with viral infections", "Bleeding disorders"]
    },
    metformin: {
      name: "Metformin",
      genericName: "metformin",
      category: "Antidiabetic",
      commonSideEffects: ["Diarrhea", "Nausea", "Abdominal discomfort"],
      warnings: ["Lactic acidosis (rare)", "Kidney function monitoring"]
    }
  };

  return commonDrugs[genericName] || null;
}

/**
 * Export the interaction database for external use
 */
export function getAllInteractions(): DrugInteraction[] {
  return [...INTERACTION_DATABASE];
}

/**
 * Add custom interaction (for admin panel)
 */
export function addCustomInteraction(interaction: DrugInteraction): void {
  INTERACTION_DATABASE.push(interaction);
}
