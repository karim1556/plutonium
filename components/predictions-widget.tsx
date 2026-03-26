"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Brain, RefreshCw } from "lucide-react";

type RiskLevel = "low" | "medium" | "high" | "critical";

interface PredictionData {
  riskScore: number;
  riskLevel: RiskLevel;
  trend: "improving" | "stable" | "declining";
  predictions: Array<{ date: string; predicted: number; confidence: number }>;
  recommendations?: string[];
  factors?: Array<{ factor: string; impact: "positive" | "negative" | "neutral"; weight: number }>;
}

interface PredictionsWidgetProps {
  patientId?: string;
  variant?: "compact" | "detailed";
}

const riskColors: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" }
};

const riskIcons: Record<RiskLevel, typeof Shield> = {
  low: Shield,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: AlertTriangle
};

export function PredictionsWidget({ patientId, variant = "compact" }: PredictionsWidgetProps) {
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = patientId ? `/api/predictions?patient=${patientId}` : "/api/predictions";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch predictions");
      const data = await response.json();
      setPredictions(data);
    } catch {
      setError("Unable to load predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [patientId]);

  if (loading) {
    return (
      <div className={`rounded-[28px] border border-slate-100 bg-white p-5 ${variant === "compact" ? "" : "col-span-full"}`}>
        <div className="flex items-center justify-center gap-2 py-4">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Loading predictions...</span>
        </div>
      </div>
    );
  }

  if (error || !predictions) {
    return (
      <div className={`rounded-[28px] border border-slate-100 bg-white p-5 ${variant === "compact" ? "" : "col-span-full"}`}>
        <p className="text-sm text-slate-500">{error || "No predictions available"}</p>
      </div>
    );
  }

  const colors = riskColors[predictions.riskLevel] || riskColors.low;
  const RiskIcon = riskIcons[predictions.riskLevel] || Shield;
  const TrendIcon = predictions.trend === "improving" ? TrendingUp : predictions.trend === "declining" ? TrendingDown : TrendingUp;
  const trendColor = predictions.trend === "improving" ? "text-emerald-600" : predictions.trend === "declining" ? "text-red-600" : "text-slate-500";

  if (variant === "compact") {
    return (
      <div className={`rounded-[28px] border ${colors.border} ${colors.bg} p-5`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">AI Prediction</p>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
                <RiskIcon className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-2xl font-semibold ${colors.text}`}>{predictions.riskScore}%</p>
                <p className="text-xs text-slate-500 capitalize">{predictions.riskLevel} Risk</p>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-xs capitalize">{predictions.trend}</span>
          </div>
        </div>

        {predictions.recommendations && predictions.recommendations.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/60 p-3">
            <p className="text-xs text-slate-600">{predictions.recommendations[0]}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="col-span-full rounded-[34px] border border-slate-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-sky-600" />
          <p className="text-sm font-semibold text-slate-900">ML Adherence Predictions</p>
        </div>
        <button
          type="button"
          onClick={fetchPredictions}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Risk Score */}
        <div className={`rounded-[24px] ${colors.bg} p-4`}>
          <p className="text-xs font-semibold text-slate-500">Risk Score</p>
          <div className="mt-2 flex items-center gap-3">
            <RiskIcon className={`h-8 w-8 ${colors.text}`} />
            <div>
              <p className={`text-3xl font-bold ${colors.text}`}>{predictions.riskScore}%</p>
              <p className="text-sm capitalize text-slate-600">{predictions.riskLevel} Risk</p>
            </div>
          </div>
        </div>

        {/* Trend */}
        <div className="rounded-[24px] bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">7-Day Trend</p>
          <div className="mt-2 flex items-center gap-3">
            <TrendIcon className={`h-8 w-8 ${trendColor}`} />
            <div>
              <p className={`text-xl font-semibold capitalize ${trendColor}`}>{predictions.trend}</p>
              <p className="text-sm text-slate-600">
                {predictions.predictions.length > 0
                  ? `${predictions.predictions[0].confidence}% confidence`
                  : "Based on history"}
              </p>
            </div>
          </div>
        </div>

        {/* Top Factor */}
        {predictions.factors && predictions.factors.length > 0 && (
          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">Key Factor</p>
            <div className="mt-2">
              <p className="text-lg font-semibold text-slate-900">{predictions.factors[0].factor}</p>
              <p className={`text-sm capitalize ${
                predictions.factors[0].impact === "positive"
                  ? "text-emerald-600"
                  : predictions.factors[0].impact === "negative"
                    ? "text-red-600"
                    : "text-slate-500"
              }`}>
                {predictions.factors[0].impact} impact
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {predictions.recommendations && predictions.recommendations.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-slate-500">Recommendations</p>
          <div className="space-y-2">
            {predictions.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="rounded-xl bg-sky-50 px-4 py-2 text-sm text-slate-700">
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
