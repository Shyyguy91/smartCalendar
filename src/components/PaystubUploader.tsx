"use client";

import { FileUp, LoaderCircle, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { PaystubExtraction } from "@/types/dashboard";

interface PaystubUploaderProps { onApply: (extraction: PaystubExtraction) => void; }

export default function PaystubUploader({ onApply }: PaystubUploaderProps) {
  const [extraction, setExtraction] = useState<PaystubExtraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setLoading(true); setError(null); setExtraction(null);
    try {
      const formData = new FormData(); formData.append("file", file);
      const response = await fetch("/api/ai-parse-paystub", { method: "POST", body: formData });
      const data = (await response.json()) as PaystubExtraction | { error?: string };
      if (!response.ok) throw new Error("error" in data && data.error ? data.error : "Paystub extraction failed.");
      setExtraction(data as PaystubExtraction);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Paystub extraction failed."); }
    finally { setLoading(false); }
  }

  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300"><FileUp size={16} aria-hidden="true" />Upload Paystub Photo<input type="file" accept="image/*" className="sr-only" disabled={loading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>{loading && <span className="ml-3 inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />Reading paystub...</span>}{error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle size={16} />{error}</p>}{extraction && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-950">Extracted Net Pay: ${extraction.netPay.toFixed(2)}</p><p className="mt-1 text-sm text-emerald-900">Learned Tax/Deduction Rate: {(extraction.effectiveWithholdingRate * 100).toFixed(1)}%</p><button type="button" onClick={() => onApply(extraction)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white"><Check size={15} />Apply to Paycheck Model</button></div>}</div>;
}