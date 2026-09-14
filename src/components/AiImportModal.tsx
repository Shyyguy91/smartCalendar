"use client";

import { AlertCircle, Check, ClipboardPaste, LoaderCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WeeklyParsedPayload } from "@/types/dashboard";

interface AiImportModalProps {
  isOpen: boolean;
  selectedDate: string;
  onClose: () => void;
  onDataImported: (parsedData: WeeklyParsedPayload, weekStartDate: string) => void;
}

const exampleInput = `MyFitnessPal
Breakfast: protein shake, 420 calories, 35g protein, 42g carbs, 10g fat

Hevy
Completed Push & Core, 30 minutes
DB Incline Bench Press: 3 sets x 8 reps @ 45 lb`;

export default function AiImportModal({ isOpen, selectedDate, onClose, onDataImported }: AiImportModalProps) {
  const [targetDate, setTargetDate] = useState(selectedDate);
  const [rawInput, setRawInput] = useState("");
  const [parsedData, setParsedData] = useState<WeeklyParsedPayload | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTargetDate(selectedDate);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  async function parseInput() {
    if (!rawInput.trim()) {
      setError("Paste a MyFitnessPal or Hevy entry first.");
      return;
    }
    setIsParsing(true);
    setError(null);
    setParsedData(null);
    try {
      const response = await fetch("/api/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput }),
      });
      const data = (await response.json()) as WeeklyParsedPayload | { error?: string };
      if (!response.ok) throw new Error("error" in data && data.error ? data.error : "The parser could not read that entry.");
      setParsedData(data as WeeklyParsedPayload);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "The parser could not read that entry.");
    } finally {
      setIsParsing(false);
    }
  }

  function applyImport() {
    if (!parsedData) return;
    onDataImported(parsedData, targetDate);
    onClose();
  }

  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="smart-import-title" className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5"><div className="flex items-start gap-3"><span className="rounded-lg bg-violet-50 p-2 text-violet-700"><Sparkles size={20} aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Smart Import</p><h2 id="smart-import-title" className="mt-1 text-2xl font-bold text-slate-950">Parse a full week</h2><p className="mt-2 text-sm text-slate-500">Paste multiple days from MyFitnessPal and Hevy at once.</p></div></div><button type="button" onClick={onClose} aria-label="Close Smart Import" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"><X size={20} aria-hidden="true" /></button></div><label className="mt-6 block"><span className="mb-2 block text-sm font-bold text-slate-700">Week start / fallback date</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label><div className="mt-5 flex items-center justify-between"><label className="text-sm font-bold text-slate-700" htmlFor="smart-import-input">Raw weekly MyFitnessPal / Hevy text</label><button type="button" onClick={() => setRawInput(exampleInput)} className="text-xs font-bold text-violet-700 hover:text-violet-900">Use example</button></div><textarea id="smart-import-input" value={rawInput} onChange={(event) => setRawInput(event.target.value)} placeholder="Paste Monday through Sunday nutrition and workout exports..." rows={10} className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100" /><div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={parseInput} disabled={isParsing} className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">{isParsing ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : <ClipboardPaste size={16} aria-hidden="true" />}{isParsing ? "Parsing..." : "Parse week with AI"}</button>{error && <p role="alert" className="flex items-center gap-2 text-sm font-medium text-red-700"><AlertCircle size={16} aria-hidden="true" />{error}</p>}</div>{parsedData && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Ready to import {parsedData.weekDays.length} day{parsedData.weekDays.length === 1 ? "" : "s"}</p><div className="mt-3 space-y-2">{parsedData.weekDays.map((day) => <div key={day.dateOrDayName} className="rounded-lg border border-emerald-200 bg-white/60 p-3 text-sm"><p className="font-bold text-emerald-950">{day.dateOrDayName}{day.workout.isRestDay ? " · Rest day" : day.workout.sessionName ? ` · ${day.workout.sessionName}` : ""}</p><p className="mt-1 text-emerald-900">{day.nutrition.calories ?? "--"} calories · {day.nutrition.proteinGrams ?? "--"}g protein · {day.workout.exercises.length} exercises</p></div>)}</div><button type="button" onClick={applyImport} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"><Check size={16} aria-hidden="true" />Apply week to dashboard</button></div>}</section></div>;
}