import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import type { DailySchedulePayload } from "@/types/dashboard";

export const runtime = "nodejs";

const scheduleSchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          time: { type: Type.STRING },
          title: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["work", "gym", "dogs", "study", "errands", "rest"] },
          completed: { type: Type.BOOLEAN },
        },
        required: ["id", "time", "title", "category", "completed"],
      },
    },
  },
  required: ["date", "events"],
} as const;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const rawInput = typeof body === "object" && body !== null && "rawInput" in body ? (body as { rawInput?: unknown }).rawInput : undefined;
  if (typeof rawInput !== "string" || !rawInput.trim()) return NextResponse.json({ error: "rawInput must be a non-empty string." }, { status: 400 });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const config = { responseMimeType: "application/json", responseSchema: scheduleSchema };
    const prompt = `Convert this schedule into timestamped interactive events. Preserve every activity. Use category work, gym, dogs, study, errands, or rest. Return no commentary.\n\n${rawInput}`;
    let response;
    try { response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config }); } catch (error) {
      const providerError = error as { status?: number; message?: string };
      if (providerError.status !== 404 && !providerError.message?.includes("no longer available")) throw error;
      response = await ai.models.generateContent({ model: "gemini-3.6-flash", contents: prompt, config });
    }
    if (!response.text) return NextResponse.json({ error: "Gemini returned an empty schedule." }, { status: 502 });
    return NextResponse.json(JSON.parse(response.text) as DailySchedulePayload);
  } catch (error) {
    console.error("Schedule parsing failed", error);
    return NextResponse.json({ error: "Unable to parse the schedule." }, { status: 502 });
  }
}