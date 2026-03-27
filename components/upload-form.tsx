"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileImage, Loader2, Sparkles } from "lucide-react";
import type { ParsedPrescriptionMedication } from "@/types/medication";
import { StatusPill } from "@/components/status-pill";

const TOTAL_SLOTS = 5;

interface ParseResponse {
  medications: ParsedPrescriptionMedication[];
  notes: string[];
}

interface UploadFormProps {
  patientId?: string | null;
  patientName?: string | null;
}

export function UploadForm({ patientId, patientName }: UploadFormProps) {
  const router = useRouter();
  const [ocrText, setOcrText] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageData, setImageData] = useState("");
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [slotAssignments, setSlotAssignments] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageData("");
      return;
    }

    setImageName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      const base64Data = value.includes(",") ? value.split(",")[1] ?? "" : value;
      setImageData(base64Data);
    };
    reader.onerror = () => {
      setError("Unable to read selected image file.");
      setImageData("");
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    setError(null);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/parse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            imageName,
            imageData,
            ocrText
          })
        });

        const payload = (await response.json()) as ParseResponse & { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Unable to parse prescription.");
          return;
        }

        // Default every medication to slot 1
        const defaults: Record<string, number> = {};
        for (const med of payload.medications) {
          defaults[med.name] = 1;
        }

        setSlotAssignments(defaults);
        setResult(payload);
      })();
    });
  };

  const assignSlot = (medName: string, slot: number) => {
    setSlotAssignments((current) => ({ ...current, [medName]: slot }));
  };

  const save = () => {
    if (!patientId || !result?.medications.length) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(() => {
      void (async () => {
        // Merge slot assignments into each medication
        const medicationsWithSlots = result.medications.map((med) => ({
          ...med,
          slotId: slotAssignments[med.name] ?? 1
        }));

        const response = await fetch("/api/medications/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            patientId,
            medications: medicationsWithSlots
          })
        });

        const payload = (await response.json()) as {
          error?: string;
          message?: string;
        };

        if (!response.ok) {
          setError(payload.error ?? "Unable to save medication plan.");
          return;
        }

        setMessage(payload.message ?? "Medication plan saved.");
        router.refresh();
      })();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="rounded-[34px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
            <FileImage className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Prescription Intake</p>
            <p className="text-sm text-slate-500">
              Parse OCR text now, then save the medication plan into the selected patient's live record.
            </p>
          </div>
        </div>

        <label className="mb-4 block text-sm font-medium text-slate-700">
          Upload prescription image
          <input
            type="file"
            accept="image/*"
            onChange={onImageSelected}
            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800 focus:border-ocean"
          />
        </label>

        <label className="mb-4 block text-sm font-medium text-slate-700">
          Image label
          <input
            type="text"
            value={imageName}
            onChange={(event) => setImageName(event.target.value)}
            placeholder="doctor-note-march-23.jpg"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-ocean"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          OCR text
          <textarea
            value={ocrText}
            onChange={(event) => setOcrText(event.target.value)}
            rows={10}
            placeholder="Example: Aspirin 75mg OD after food 30 days"
            className="mt-2 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-ocean"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Parse Prescription
          </button>

          <button
            type="button"
            onClick={save}
            disabled={isPending || !patientId || !result?.medications.length}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Save To {patientName ?? "Patient"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}
      </div>

      <div className="rounded-[34px] bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Parsed Preview</p>
        {result ? (
          <div className="mt-5 space-y-4">
            {result.medications.map((medication) => {
              const assigned = slotAssignments[medication.name] ?? 1;
              return (
                <article key={medication.name} className="rounded-[28px] bg-white/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{medication.name}</h3>
                      <p className="text-sm text-white/75">
                        {medication.dosage} • {medication.frequency}x/day • {medication.durationDays} days
                      </p>
                    </div>
                    <StatusPill value={medication.confidence > 0.8 ? "info" : "warning"} />
                  </div>
                  <p className="mt-2 text-sm text-white/80">
                    {medication.timing.partsOfDay.join(", ")} • {medication.timing.mealRelation.replaceAll("_", " ")}
                  </p>

                  {/* Slot Picker */}
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                      Assign to slot
                    </p>
                    <div className="flex gap-2">
                      {Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => assignSlot(medication.name, slot)}
                          className={`h-9 w-9 rounded-full text-sm font-bold transition ${
                            assigned === slot
                              ? "bg-white text-slate-900 shadow-md"
                              : "bg-white/15 text-white/70 hover:bg-white/25"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
            <div className="rounded-[28px] bg-white/10 p-4">
              <p className="text-sm font-semibold">Parser notes</p>
              <ul className="mt-3 space-y-2 text-sm text-white/75">
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[28px] bg-white/10 p-4 text-sm leading-6 text-white/80">
              {patientId
                ? `Saving will write these medicines into ${patientName ?? "the selected patient"}'s live plan using your chosen slot assignments.`
                : "Select a patient first so the parsed medicines can be saved into a live care plan."}
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-white/70">
            Parsed medications will appear here. You can assign each one to a hardware slot (1–5) before saving.
          </p>
        )}
      </div>
    </div>
  );
}


