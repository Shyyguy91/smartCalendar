"use client";

import { CalendarDays, Copy, Utensils } from "lucide-react";
import { MealDay } from "@/types/dashboard";

interface MealPlannerProps {
  meals: Record<string, MealDay>;
  onChange: (day: string, meal: MealDay) => void;
  onDuplicateMonday: () => void;
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const inputs: Array<keyof Pick<MealDay, "breakfast" | "lunch" | "dinner" | "snacks">> = ["breakfast", "lunch", "dinner", "snacks"];

export default function MealPlanner({ meals, onChange, onDuplicateMonday }: MealPlannerProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"><div className="flex items-start gap-3"><span className="rounded-lg bg-amber-50 p-2 text-amber-700"><Utensils size={20} aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Prep once, decide less</p><h2 className="mt-1 text-2xl font-bold">Weekly meal planner</h2><p className="mt-2 text-sm text-slate-500">Your current day automatically appears in Today.</p></div></div><button type="button" onClick={onDuplicateMonday} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:border-amber-300 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"><Copy size={16} aria-hidden="true" />Duplicate Monday to weekdays</button></section>
      <div className="grid gap-4 xl:grid-cols-2">
        {days.map((day) => {
          const meal = meals[day];
          return <section key={day} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><CalendarDays size={17} className="text-amber-600" aria-hidden="true" />{day}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{meal.proteinTarget}g P</span></div><div className="grid gap-3 sm:grid-cols-2">{inputs.map((input) => <label key={input} className="block"><span className="mb-1 block text-xs font-bold capitalize text-slate-500">{input}</span><input value={meal[input]} onChange={(event) => onChange(day, { ...meal, [input]: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" /></label>)}</div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4"><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Protein target (g)</span><input type="number" min="0" value={meal.proteinTarget} onChange={(event) => onChange(day, { ...meal, proteinTarget: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400" /></label><label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Calorie target</span><input type="number" min="0" value={meal.calorieTarget} onChange={(event) => onChange(day, { ...meal, calorieTarget: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400" /></label></div></section>;
        })}
      </div>
    </div>
  );
}