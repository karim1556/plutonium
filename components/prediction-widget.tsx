"use client";

import { useState, useEffect } from "react";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";

interface Prediction {
  date: string;
  probability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;
}

interface PredictionWidgetProps {
  patientId?: string;
  compact?: boolean;
}

export function PredictionWidget({ patientId, compact = false }: PredictionWidgetProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState<string>("low");
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");
  const [loading, setLoading] = useState(true);
  const [interventions, setInterventions] = useState<string[]>([]);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const params = new URLSearchParams();
        if (patientId) params.set("patientId", patientId);

        const response = await fetch(`/api/predictions?${params}`);
        if (response.ok) {
          const data = await response.json();
          setPredictions(data.predictions || []);
          setRiskScore(data.riskScore || 0);
          setRiskLevel(data.riskLevel || "low");
          setTrend(data.trend || "stable");
          setInterventions(data.interventions || []);
        }
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [patientId]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-amber-500";
      default: return "bg-emerald-500";
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-50 border-red-200";
      case "high": return "bg-orange-50 border-orange-200";
      case "medium": return "bg-amber-50 border-amber-200";
      default: return "bg-emerald-50 border-emerald-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "medium":
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    }
  };

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`rounded-[28px] border p-5 shadow-sm ${getRiskBgColor(riskLevel)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getRiskColor(riskLevel)}`}>
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Risk Score</h3>
              <p className="text-xs text-slate-500 capitalize">{riskLevel} risk level</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-slate-900">{riskScore}%</span>
            {trend === "up" && <TrendingUp className="h-5 w-5 text-red-500" />}
            {trend === "down" && <TrendingDown className="h-5 w-5 text-emerald-500" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">ML Predictions</h3>
            <p className="text-xs text-slate-500">7-day adherence forecast</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getRiskIcon(riskLevel)}
          <span className="text-sm font-medium capitalize text-slate-700">{riskLevel} Risk</span>
        </div>
      </div>

      {/* Risk Score Display */}
      <div className={`mt-4 rounded-xl border p-4 ${getRiskBgColor(riskLevel)}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Miss Probability</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-900">{riskScore}%</span>
            {trend === "up" && <TrendingUp className="h-4 w-4 text-red-500" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-emerald-500" />}
          </div>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${getRiskColor(riskLevel)}`}
            style={{ width: `${Math.min(riskScore, 100)}%` }}
          />
        </div>
      </div>

      {/* 7-Day Predictions */}
      {predictions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Next 7 Days</p>
          <div className="mt-2 flex gap-1">
            {predictions.slice(0, 7).map((pred, idx) => (
              <div
                key={idx}
                className="group relative flex-1"
              >
                <div
                  className={`h-8 rounded transition-all hover:scale-110 ${getRiskColor(pred.riskLevel)}`}
                  style={{ opacity: 0.3 + (pred.probability / 100) * 0.7 }}
                  title={`${new Date(pred.date).toLocaleDateString("en-US", { weekday: "short" })}: ${pred.probability}% risk`}
                />
                <span className="mt-1 block text-center text-[10px] text-slate-500">
                  {new Date(pred.date).toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intervention Suggestions */}
      {interventions.length > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-600">Suggested Interventions</p>
          <ul className="mt-2 space-y-1">
            {interventions.slice(0, 3).map((intervention, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                {intervention}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
