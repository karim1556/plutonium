/**
 * ML-Powered Adherence Prediction Engine
 * Uses time-series analysis and pattern recognition
 * to predict medication adherence risks
 */

import { addDays, differenceInHours, parseISO, startOfDay } from "date-fns";
import type { DoseLog, Medication, ScheduleItem } from "@/types/medication";

// ============================================================================
// Types
// ============================================================================

export interface PredictionResult {
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  predictions: AdherencePrediction[];
  recommendations: string[];
  factors: RiskFactor[];
}

export interface AdherencePrediction {
  date: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  medication: string;
  missRisk: number; // 0-1
  confidence: number; // 0-1
  factors: string[];
}

export interface RiskFactor {
  factor: string;
  impact: number; // 0-1
  description: string;
}

export interface TimeSeriesData {
  timestamps: Date[];
  values: number[];
  trend: "improving" | "stable" | "declining";
  volatility: number;
}

// ============================================================================
// Time Series Analysis
// ============================================================================

function calculateMovingAverage(values: number[], window: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    const avg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
    result.push(avg);
  }

  return result;
}

function calculateTrend(values: number[]): "improving" | "stable" | "declining" {
  if (values.length < 3) return "stable";

  const recentValues = values.slice(-7); // Last 7 data points
  const firstHalf = recentValues.slice(0, Math.floor(recentValues.length / 2));
  const secondHalf = recentValues.slice(Math.floor(recentValues.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (change > 5) return "improving";
  if (change < -5) return "declining";
  return "stable";
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return Math.min(stdDev / mean, 1); // Normalize to 0-1
}

// ============================================================================
// Pattern Detection
// ============================================================================

function detectTimeOfDayPatterns(logs: DoseLog[], schedules: ScheduleItem[]) {
  const patterns: Record<string, { total: number; missed: number }> = {
    morning: { total: 0, missed: 0 },
    afternoon: { total: 0, missed: 0 },
    evening: { total: 0, missed: 0 },
    night: { total: 0, missed: 0 }
  };

  schedules.forEach((schedule) => {
    const hour = parseInt(schedule.time.split(":")[0]);
    let timeOfDay: keyof typeof patterns;

    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";
    else timeOfDay = "night";

    patterns[timeOfDay].total++;

    const missedLog = logs.find(
      (log) => log.scheduleId === schedule.id && log.status === "missed"
    );

    if (missedLog) {
      patterns[timeOfDay].missed++;
    }
  });

  return patterns;
}

function detectDayOfWeekPatterns(logs: DoseLog[]) {
  const patterns: Record<string, { total: number; missed: number }> = {
    weekday: { total: 0, missed: 0 },
    weekend: { total: 0, missed: 0 }
  };

  logs.forEach((log) => {
    const date = parseISO(log.timestamp);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const key = isWeekend ? "weekend" : "weekday";
    patterns[key].total++;

    if (log.status === "missed") {
      patterns[key].missed++;
    }
  });

  return patterns;
}

// ============================================================================
// Risk Calculation
// ============================================================================

function calculateHistoricalRisk(logs: DoseLog[]): number {
  if (logs.length === 0) return 0.5;

  const recent = logs.slice(-14); // Last 14 logs
  const missedCount = recent.filter((log) => log.status === "missed").length;

  return missedCount / recent.length;
}

function calculateConsistencyScore(logs: DoseLog[]): number {
  if (logs.length < 3) return 0.5;

  const timeDifferences: number[] = [];

  for (let i = 1; i < logs.length; i++) {
    const diff = differenceInHours(parseISO(logs[i].timestamp), parseISO(logs[i - 1].timestamp));
    timeDifferences.push(Math.abs(diff));
  }

  const volatility = calculateVolatility(timeDifferences);
  return 1 - volatility; // High volatility = low consistency
}

function calculateMedicationComplexity(medications: Medication[]): number {
  let complexity = 0;

  // More medications = higher complexity
  complexity += medications.length * 0.1;

  // Multiple daily doses = higher complexity
  const totalDoses = medications.reduce((sum, med) => sum + med.frequency, 0);
  complexity += totalDoses * 0.05;

  // Different timing requirements = higher complexity
  const uniqueTimings = new Set(
    medications.flatMap((med) => med.timing.partsOfDay)
  ).size;
  complexity += uniqueTimings * 0.15;

  return Math.min(complexity, 1);
}

// ============================================================================
// Main Prediction Engine
// ============================================================================

export function generateAdherencePredictions(
  medications: Medication[],
  schedules: ScheduleItem[],
  logs: DoseLog[]
): PredictionResult {
  const riskFactors: RiskFactor[] = [];
  const predictions: AdherencePrediction[] = [];
  const recommendations: string[] = [];

  // 1. Historical adherence analysis
  const historicalRisk = calculateHistoricalRisk(logs);
  riskFactors.push({
    factor: "Historical Adherence",
    impact: historicalRisk,
    description: `${Math.round((1 - historicalRisk) * 100)}% adherence in recent history`
  });

  // 2. Consistency analysis
  const consistencyScore = calculateConsistencyScore(logs);
  riskFactors.push({
    factor: "Timing Consistency",
    impact: 1 - consistencyScore,
    description: `${Math.round(consistencyScore * 100)}% consistent with scheduled times`
  });

  // 3. Medication complexity
  const complexityScore = calculateMedicationComplexity(medications);
  riskFactors.push({
    factor: "Regimen Complexity",
    impact: complexityScore,
    description: `${medications.length} medications, ${medications.reduce((s, m) => s + m.frequency, 0)} daily doses`
  });

  // 4. Time-of-day pattern detection
  const timePatterns = detectTimeOfDayPatterns(logs, schedules);
  Object.entries(timePatterns).forEach(([timeOfDay, data]) => {
    if (data.total > 0) {
      const missRate = data.missed / data.total;
      if (missRate > 0.3) {
        riskFactors.push({
          factor: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Doses`,
          impact: missRate,
          description: `${Math.round(missRate * 100)}% missed during ${timeOfDay}`
        });

        recommendations.push(
          `Consider rescheduling ${timeOfDay} medications to a more consistent time`
        );
      }
    }
  });

  // 5. Day-of-week patterns
  const dayPatterns = detectDayOfWeekPatterns(logs);
  const weekendRisk =
    dayPatterns.weekend.total > 0 ? dayPatterns.weekend.missed / dayPatterns.weekend.total : 0;
  const weekdayRisk =
    dayPatterns.weekday.total > 0 ? dayPatterns.weekday.missed / dayPatterns.weekday.total : 0;

  if (weekendRisk > weekdayRisk + 0.2) {
    riskFactors.push({
      factor: "Weekend Pattern",
      impact: weekendRisk - weekdayRisk,
      description: "Significantly lower adherence on weekends"
    });

    recommendations.push("Set up weekend-specific reminders or caregiver check-ins");
  }

  // 6. Generate predictions for next 7 days
  const today = startOfDay(new Date());

  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    schedules.forEach((schedule) => {
      const hour = parseInt(schedule.time.split(":")[0]);
      let timeOfDay: "morning" | "afternoon" | "evening" | "night";

      if (hour >= 5 && hour < 12) timeOfDay = "morning";
      else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 21) timeOfDay = "evening";
      else timeOfDay = "night";

      const timePattern = timePatterns[timeOfDay];
      const baseRisk = timePattern.total > 0 ? timePattern.missed / timePattern.total : 0.1;

      // Adjust for weekend
      const weekendAdjustment = isWeekend ? Math.max(weekendRisk - weekdayRisk, 0) : 0;

      // Adjust for consistency
      const consistencyAdjustment = (1 - consistencyScore) * 0.2;

      const missRisk = Math.min(baseRisk + weekendAdjustment + consistencyAdjustment, 1);

      predictions.push({
        date: date.toISOString().split("T")[0],
        timeOfDay,
        medication: schedule.medicines[0] || "Unknown",
        missRisk,
        confidence: Math.min(logs.length / 30, 0.9), // More data = higher confidence
        factors: [
          missRisk > 0.5 ? `High risk ${timeOfDay}` : `Normal ${timeOfDay}`,
          isWeekend ? "Weekend" : "Weekday"
        ]
      });
    });
  }

  // Calculate overall risk score
  const avgRiskImpact =
    riskFactors.reduce((sum, factor) => sum + factor.impact, 0) / riskFactors.length;

  const riskScore = Math.round(avgRiskImpact * 100);

  let riskLevel: PredictionResult["riskLevel"];
  if (riskScore < 25) riskLevel = "low";
  else if (riskScore < 50) riskLevel = "medium";
  else if (riskScore < 75) riskLevel = "high";
  else riskLevel = "critical";

  // Add general recommendations
  if (riskLevel === "high" || riskLevel === "critical") {
    recommendations.push("Consider enabling automated caregiver alerts");
    recommendations.push("Schedule a medication review with healthcare provider");
  }

  if (complexityScore > 0.5) {
    recommendations.push("Simplify regimen if possible - consolidate dose times");
  }

  if (consistencyScore < 0.7) {
    recommendations.push("Set daily reminders 15 minutes before each dose");
  }

  return {
    riskScore,
    riskLevel,
    predictions: predictions.slice(0, 21), // Next 7 days max 3 doses per day
    recommendations,
    factors: riskFactors
  };
}

// ============================================================================
// Refill Prediction
// ============================================================================

export function predictRefillDate(
  medication: Medication,
  dailyDoses: number,
  remainingPills: number
): { estimatedDays: number; refillDate: Date; urgency: "normal" | "soon" | "urgent" } {
  const daysRemaining = Math.floor(remainingPills / dailyDoses);
  const refillDate = addDays(new Date(), daysRemaining);

  let urgency: "normal" | "soon" | "urgent";
  if (daysRemaining <= 3) urgency = "urgent";
  else if (daysRemaining <= 7) urgency = "soon";
  else urgency = "normal";

  return {
    estimatedDays: daysRemaining,
    refillDate,
    urgency
  };
}

// ============================================================================
// Intervention Suggestions
// ============================================================================

export function suggestInterventions(prediction: PredictionResult): string[] {
  const interventions: string[] = [];

  // Based on risk factors
  prediction.factors.forEach((factor) => {
    if (factor.impact > 0.5) {
      switch (factor.factor) {
        case "Historical Adherence":
          interventions.push("Increase reminder frequency and caregiver monitoring");
          break;
        case "Timing Consistency":
          interventions.push("Enable location-based reminders or routine anchors");
          break;
        case "Regimen Complexity":
          interventions.push("Request medication review to simplify dosing schedule");
          break;
      }
    }
  });

  // Based on predictions
  const highRiskPredictions = prediction.predictions.filter((p) => p.missRisk > 0.6);

  if (highRiskPredictions.length > 0) {
    const riskTimes = new Set(highRiskPredictions.map((p) => p.timeOfDay));
    riskTimes.forEach((time) => {
      interventions.push(`Schedule caregiver check-in for ${time} doses`);
    });
  }

  return interventions;
}
