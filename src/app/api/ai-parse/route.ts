import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import type { WeeklyParsedPayload } from "@/types/dashboard";

export const runtime = "nodejs";

const weeklyParsedPayloadSchema = {
  type: Type.OBJECT,
  properties: {
    weekDays: {
      type: Type.ARRAY,
      minItems: 1,
      maxItems: 7,
      items: {
        type: Type.OBJECT,
        properties: {
          dateOrDayName: { type: Type.STRING },
          nutrition: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER, nullable: true },
              proteinGrams: { type: Type.NUMBER, nullable: true },
              carbsGrams: { type: Type.NUMBER, nullable: true },
              fatsGrams: { type: Type.NUMBER, nullable: true },
              meals: {
                type: Type.OBJECT,
                properties: {
                  breakfast: { type: Type.STRING },
                  lunch: { type: Type.STRING },
                  dinner: { type: Type.STRING },
                  snacks: { type: Type.STRING },
                },
              },
            },
            required: ["calories", "proteinGrams", "carbsGrams", "fatsGrams", "meals"],
          },
          workout: {
            type: Type.OBJECT,
            properties: {
              isRestDay: { type: Type.BOOLEAN },
              sessionName: { type: Type.STRING },
              durationMinutes: { type: Type.NUMBER, nullable: true },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.NUMBER },
                    reps: { type: Type.STRING },
                    weight: { type: Type.STRING, nullable: true },
                  },
                  required: ["name", "sets", "reps", "weight"],
                },
              },
            },
            required: ["isRestDay", "sessionName", "durationMinutes", "exercises"],
          },
        },
        required: ["dateOrDayName", "nutrition", "workout"],
      },
    },
  },
  required: ["weekDays"],
} as const;

const parserInstructions = `You convert messy fitness app exports into a weekly plan.
Return one entry per day found in the input, up to seven entries. Use dateOrDayName as an explicit ISO date when present, otherwise use the weekday name (Monday through Sunday).
Use only facts present in the input. Normalize numeric nutrition values to numbers, and use null when a value is not present.
For nutrition meals, place text into breakfast, lunch, dinner, or snacks when the source identifies it; omit meal fields that are not present.
For workout exercises, preserve the exercise name, set count, rep range or count as a string, and weight as a string when present, otherwise null. Set isRestDay to true only when the source explicitly indicates a rest day; use an empty exercises array for rest days.
Return no commentary outside the required JSON object.`;

async function generateParsedLog(ai: GoogleGenAI, contents: string) {
  const config = {
    responseMimeType: "application/json",
    responseSchema: weeklyParsedPayloadSchema,
  };

  try {
    return await ai.models.generateContent({ model: process.env.GEMINI_MODEL || "gemini-3.6-flash", contents, config });
  } catch (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const rawInput = typeof body === "object" && body !== null && "rawInput" in body
    ? (body as { rawInput?: unknown }).rawInput
    : undefined;

  if (typeof rawInput !== "string" || rawInput.trim().length === 0) {
    return NextResponse.json({ error: "rawInput must be a non-empty string." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await generateParsedLog(ai, `${parserInstructions}\n\nRaw input:\n${rawInput}`);

    if (!response.text) {
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
    }

    const parsedPayload = JSON.parse(response.text) as WeeklyParsedPayload;
    return NextResponse.json(parsedPayload);
  } catch (error) {
    console.error("AI daily log parsing failed", error);
    const providerMessage = error instanceof Error ? error.message : "Unknown Gemini error";
    return NextResponse.json({ error: `Gemini parsing failed: ${providerMessage}` }, { status: 502 });
  }
}