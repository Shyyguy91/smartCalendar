import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import type { PaystubExtraction } from "@/types/dashboard";

export const runtime = "nodejs";

const paystubSchema = {
  type: Type.OBJECT,
  properties: {
    grossPay: { type: Type.NUMBER },
    netPay: { type: Type.NUMBER },
    totalHours: { type: Type.NUMBER },
    overtimeHours: { type: Type.NUMBER },
    totalTaxesAndDeductions: { type: Type.NUMBER },
    lineItemDeductions: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.NUMBER } }, required: ["name", "amount"] },
    },
  },
  required: ["grossPay", "netPay", "totalHours", "overtimeHours", "totalTaxesAndDeductions", "lineItemDeductions"],
} as const;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const base64Image = formData.get("base64Image");
    let inlineData: { mimeType: string; data: string } | null = null;

    if (file instanceof File) {
      inlineData = { mimeType: file.type || "image/jpeg", data: Buffer.from(await file.arrayBuffer()).toString("base64") };
    } else if (typeof base64Image === "string" && base64Image.length > 0) {
      const match = base64Image.match(/^data:(.*?);base64,(.*)$/);
      inlineData = { mimeType: match?.[1] || "image/jpeg", data: match?.[2] || base64Image };
    }
    if (!inlineData) return NextResponse.json({ error: "Upload a paystub image or provide base64Image." }, { status: 400 });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const config = { responseMimeType: "application/json", responseSchema: paystubSchema };
    let response;
    try {
      response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ inlineData }, { text: "Extract the paystub values. Use numeric dollars and hours. Include every visible tax or deduction line item." }], config });
    } catch (error) {
      const providerError = error as { status?: number; message?: string };
      if (providerError.status !== 404 && !providerError.message?.includes("no longer available")) throw error;
      response = await ai.models.generateContent({ model: "gemini-3.6-flash", contents: [{ inlineData }, { text: "Extract the paystub values. Use numeric dollars and hours. Include every visible tax or deduction line item." }], config });
    }
    if (!response.text) return NextResponse.json({ error: "Gemini returned an empty paystub response." }, { status: 502 });
    const extracted = JSON.parse(response.text) as Omit<PaystubExtraction, "effectiveWithholdingRate" | "withholdingRate">;
    const effectiveWithholdingRate = extracted.grossPay > 0 ? extracted.totalTaxesAndDeductions / extracted.grossPay : 0;
    return NextResponse.json({ ...extracted, effectiveWithholdingRate } satisfies PaystubExtraction);
  } catch (error) {
    console.error("Paystub OCR failed", error);
    return NextResponse.json({ error: "Unable to extract the paystub." }, { status: 502 });
  }
}