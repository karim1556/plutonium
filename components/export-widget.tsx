"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileHeart, Check, Loader2 } from "lucide-react";

interface ExportWidgetProps {
  patientId?: string;
  compact?: boolean;
}

type ExportFormat = "json" | "csv" | "fhir";

export function ExportWidget({ patientId, compact = false }: ExportWidgetProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const formats = [
    {
      id: "json" as ExportFormat,
      name: "JSON",
      icon: FileJson,
      description: "Native format for developers",
      color: "bg-amber-100 text-amber-600"
    },
    {
      id: "csv" as ExportFormat,
      name: "CSV",
      icon: FileSpreadsheet,
      description: "Open in Excel or Google Sheets",
      color: "bg-emerald-100 text-emerald-600"
    },
    {
      id: "fhir" as ExportFormat,
      name: "FHIR R4",
      icon: FileHeart,
      description: "HL7 healthcare standard",
      color: "bg-rose-100 text-rose-600"
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format: selectedFormat });
      if (patientId) params.set("patientId", patientId);

      const response = await fetch(`/api/export?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const extension = selectedFormat === "fhir" ? "json" : selectedFormat;
        const timestamp = new Date().toISOString().split("T")[0];
        a.download = `medassist-export-${timestamp}.${extension}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setLastExport(new Date().toLocaleTimeString());
      } else {
        alert("Export failed. Please try again.");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Please check your connection.");
    } finally {
      setIsExporting(false);
    }
  };

  if (compact) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Export Data</h3>
              <p className="text-xs text-slate-500">Download your health records</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-slate-400"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Export"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <Download className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Export Health Data</h3>
          <p className="text-xs text-slate-500">Download medications, schedules & logs</p>
        </div>
      </div>

      {/* Format Selection */}
      <div className="mt-4 space-y-2">
        {formats.map((format) => (
          <button
            key={format.id}
            onClick={() => setSelectedFormat(format.id)}
            className={`flex w-full items-center justify-between rounded-xl p-3 transition ${
              selectedFormat === format.id
                ? "bg-slate-100 ring-2 ring-blue-500"
                : "bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${format.color}`}>
                <format.icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">{format.name}</p>
                <p className="text-xs text-slate-400">{format.description}</p>
              </div>
            </div>
            {selectedFormat === format.id && (
              <Check className="h-5 w-5 text-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download {formats.find(f => f.id === selectedFormat)?.name}
          </>
        )}
      </button>

      {/* Last Export Info */}
      {lastExport && (
        <p className="mt-3 text-center text-xs text-slate-400">
          Last exported at {lastExport}
        </p>
      )}
    </div>
  );
}
