"use client";

import { AlertCircle, Check, ClipboardPaste, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import type { ParsedDailyLog } from "@/types/dashboard";

interface AIParserProps {
  onApply: (parsedLog: ParsedDailyLog) => void;
}

const exampleInput = `MyFitnessPal
Breakfast: protein shake, 420 calories, 35g protein, 42g carbs, 10g fat

Hevy
Completed Push & Core, 30 minutes
DB Incline Bench Press: 3 sets x 8 reps @ 45 lb`;

export default function AIParser({ onApply }: AIParserProps) {
  const [rawInput, setRawInput] = useState("");
  const [parsedLog, setParsedLog] = useState<ParsedDailyLog | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function parseInput() {
    if (!rawInput.trim()) {
      setError("Paste a MyFitnessPal or Hevy entry first.");
      return;
    }

    setIsParsing(true);
    setError(null);
    setParsedLog(null);
    try {
      const response = await fetch("/api/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput }),
      });
      const data = (await response.json()) as ParsedDailyLog | { error?: string };
      if (!response.ok) throw new Error("error" in data && data.error ? data.error : "The parser could not read that entry.");
      setParsedLog(data as ParsedDailyLog);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "The parser could not read that entry.");
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-violet-50 p-2 text-violet-700"><Sparkles size={20} aria-hidden="true" /></span>
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">AI quick capture</p><h2 className="mt-1 text-xl font-bold">Paste your messy logs</h2><p className="mt-2 text-sm text-slate-500">Drop in MyFitnessPal or Hevy text and let the dashboard sort it.</p></div>
        </div>
        <button type="button" onClick={() => setRawInput(exampleInput)} className="hidden shrink-0 text-xs font-bold text-violet-700 hover:text-violet-900 sm:block">Use example</button>
      </div>
      <textarea value={rawInput} onChange={(event) => setRawInput(event.target.value)} placeholder="Paste nutrition, workout, or both..." rows={5} className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={parseInput} disabled={isParsing} className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">{isParsing ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : <ClipboardPaste size={16} aria-hidden="true" />}{isParsing ? "Parsing..." : "Parse with AI"}</button>
        <button type="button" onClick={() => setRawInput(exampleInput)} className="text-xs font-bold text-violet-700 hover:text-violet-900 sm:hidden">Use example</button>
        {error && <p role="alert" className="flex items-center gap-2 text-sm font-medium text-red-700"><AlertCircle size={16} aria-hidden="true" />{error}</p>}
      </div>
      {parsedLog && <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Parsed successfully</p><h3 className="mt-1 font-bold text-emerald-950">{parsedLog.workout.sessionName || "Daily log"}</h3><p className="mt-1 text-sm text-emerald-900">{parsedLog.nutrition.calories ?? "--"} calories · {parsedLog.nutrition.proteinGrams ?? "--"}g protein · {parsedLog.workout.durationMinutes ?? "--"} min workout</p></div><button type="button" onClick={() => onApply(parsedLog)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"><Check size={16} aria-hidden="true" />Apply to Today</button></div>{parsedLog.nutrition.loggedMealsSummary.length > 0 && <p className="mt-3 border-t border-emerald-200 pt-3 text-xs text-emerald-900">Meals: {parsedLog.nutrition.loggedMealsSummary.join(" · ")}</p>}{parsedLog.workout.exercises.length > 0 && <p className="mt-2 text-xs text-emerald-900">Exercises: {parsedLog.workout.exercises.map((exercise) => exercise.name).join(" · ")}</p>}</div>}
    </section>
  );
}