"use client";

import { useState } from "react";
import { Bell, Download, FileJson, FileSpreadsheet, Activity, Check, X } from "lucide-react";

interface QuickActionsProps {
  patientId?: string;
  showNotifications?: boolean;
  showExport?: boolean;
}

type ExportFormat = "json" | "csv" | "fhir";

interface NotificationPrefs {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export function QuickActions({ patientId, showNotifications = true, showExport = true }: QuickActionsProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportSuccess, setExportSuccess] = useState<ExportFormat | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email: true,
    push: true,
    sms: false
  });
  const [notifExpanded, setNotifExpanded] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    setExportSuccess(null);

    try {
      const url = patientId
        ? `/api/export?format=${format}&patient=${patientId}`
        : `/api/export?format=${format}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `medication-data.${format === "fhir" ? "json" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setExportSuccess(format);
      setTimeout(() => setExportSuccess(null), 2000);
    } catch {
      // Silent fail for demo
    } finally {
      setExporting(null);
    }
  };

  const toggleNotifPref = (key: keyof NotificationPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {showNotifications && (
        <div className="rounded-[28px] border border-slate-100 bg-white p-5">
          <button
            type="button"
            onClick={() => setNotifExpanded(!notifExpanded)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-sky-600" />
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
            </div>
            <span className="text-xs text-slate-500">
              {Object.values(notifPrefs).filter(Boolean).length} active
            </span>
          </button>

          {notifExpanded && (
            <div className="mt-4 space-y-3">
              {[
                { key: "email" as const, label: "Email Alerts", desc: "Get dose reminders via email" },
                { key: "push" as const, label: "Push Notifications", desc: "Browser & mobile alerts" },
                { key: "sms" as const, label: "SMS Messages", desc: "Text message reminders" }
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotifPref(item.key)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      notifPrefs[item.key]
                        ? "bg-sky-100 text-sky-600"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {notifPrefs[item.key] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export */}
      {showExport && (
        <div className="rounded-[28px] border border-slate-100 bg-white p-5">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-900">Export Data</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { format: "json" as ExportFormat, icon: FileJson, label: "JSON" },
              { format: "csv" as ExportFormat, icon: FileSpreadsheet, label: "CSV" },
              { format: "fhir" as ExportFormat, icon: Activity, label: "FHIR" }
            ].map((item) => (
              <button
                key={item.format}
                type="button"
                onClick={() => handleExport(item.format)}
                disabled={exporting !== null}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 text-sm transition ${
                  exportSuccess === item.format
                    ? "bg-emerald-100 text-emerald-700"
                    : exporting === item.format
                      ? "bg-slate-100 text-slate-400"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {exportSuccess === item.format ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <item.icon className={`h-5 w-5 ${exporting === item.format ? "animate-pulse" : ""}`} />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
