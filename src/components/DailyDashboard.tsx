"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock3, DollarSign, Droplets, Dumbbell, Moon, Sparkles, Sun, Utensils } from "lucide-react";
import AiImportModal from "@/components/AiImportModal";
import ScheduleImportModal from "@/components/ScheduleImportModal";
import CurriculumTracker from "@/components/CurriculumTracker";
import DoorDashTracker from "@/components/DoorDashTracker";
import FinanceEngine from "@/components/FinanceEngine";
import MealPlanner from "@/components/MealPlanner";
import WeeklyOverview from "@/components/WeeklyOverview";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePersistentState } from "@/hooks/usePersistentState";
import { CurriculumTrack, DailySchedulePayload, defaultCurriculumTracks, defaultMeals, defaultState, DailyRecord, DailySchedule, getDefaultScheduleForDate, getWeekDates, MealDay, PersistedDashboardState, toIsoDate, WeeklyParsedPayload } from "@/types/dashboard";

const tabs = ["Today", "Weekly Overview", "Meal Planner", "Finances", "Curriculum Tracker"] as const;
type Tab = (typeof tabs)[number];
const stateKey = "smart-calendar-dashboard-state";

function emptyRecord(): DailyRecord { return { completedGoals: [], meals: { ...defaultMeals }, dailyNutrition: { calories: null, proteinGrams: null, carbsGrams: null, fatsGrams: null, loggedMealsSummary: [] }, workout: { isRestDay: false, sessionName: "", durationMinutes: null, exercises: [] }, hydration: 0, dashLogs: [] }; }

export default function DailyDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const [selectedDate, setSelectedDate] = useState(() => new Date(0));
  const [weekAnchor, setWeekAnchor] = useState(selectedDate);
  const [importOpen, setImportOpen] = useState(false);
  const [scheduleImportOpen, setScheduleImportOpen] = useState(false);
  const [curriculum, setCurriculum] = usePersistentState<CurriculumTrack[]>("personal-os-curriculum", defaultCurriculumTracks);
  const [globalState, setGlobalState] = useLocalStorage<PersistedDashboardState>(stateKey, defaultState);
  const [records, setRecords] = useLocalStorage<Record<string, DailyRecord>>("smart-calendar-daily-records", {});
  const dateKey = toIsoDate(selectedDate);
  const [schedule, setSchedule] = useLocalStorage<DailySchedule>(`schedule_${dateKey}`, useMemo(() => getDefaultScheduleForDate(selectedDate), [selectedDate]));
  const storedRecord = records[dateKey];
  const record: DailyRecord = { ...emptyRecord(), ...storedRecord, meals: { ...defaultMeals, ...storedRecord?.meals }, dailyNutrition: { ...emptyRecord().dailyNutrition, ...storedRecord?.dailyNutrition }, workout: { ...emptyRecord().workout, ...storedRecord?.workout } };
  const weekDates = getWeekDates(weekAnchor);
  const meals = useMemo<Record<string, MealDay>>(() => Object.fromEntries(weekDates.map((date) => [date.toLocaleDateString("en-US", { weekday: "long" }), records[toIsoDate(date)]?.meals ?? defaultMeals])), [records, weekDates]);

  useEffect(() => {
    const today = new Date();
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedDate(today);
    setWeekAnchor(today);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return; if (event.key === "ArrowLeft") moveDate(-1); if (event.key === "ArrowRight") moveDate(1); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); });
  function moveDate(days: number) { const next = new Date(selectedDate); next.setDate(next.getDate() + days); setSelectedDate(next); setWeekAnchor(next); }
  function updateRecord<K extends keyof DailyRecord>(key: K, value: DailyRecord[K], target = dateKey) { setRecords((current) => ({ ...current, [target]: { ...(current[target] ?? emptyRecord()), [key]: value } })); }
  function updateGlobal<K extends keyof PersistedDashboardState>(key: K, value: PersistedDashboardState[K]) { setGlobalState((current) => ({ ...current, [key]: value })); }
  function importParsedData(payload: WeeklyParsedPayload, weekStartDate: string) {
    const weekStart = new Date(`${weekStartDate}T12:00:00`);
    const week = getWeekDates(weekStart);
    const importedRecords = { ...records };
    const importedMeals = { ...globalState.meals };

    payload.weekDays.forEach((parsed) => {
      const explicitDate = /^\d{4}-\d{2}-\d{2}$/.test(parsed.dateOrDayName) ? parsed.dateOrDayName : null;
      const matchingDate = explicitDate
        ? new Date(`${explicitDate}T12:00:00`)
        : week.find((date) => date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === parsed.dateOrDayName.trim().toLowerCase());
      if (!matchingDate) return;

      const targetDate = toIsoDate(matchingDate);
      const target = importedRecords[targetDate] ?? emptyRecord();
      const mealsForDay = { ...target.meals, ...parsed.nutrition.meals, proteinTarget: parsed.nutrition.proteinGrams ?? target.meals.proteinTarget, calorieTarget: parsed.nutrition.calories ?? target.meals.calorieTarget };
      const gymDone = !parsed.workout.isRestDay && (parsed.workout.exercises.length > 0 || Boolean(parsed.workout.sessionName));
      const macrosDone = parsed.nutrition.proteinGrams !== null && parsed.nutrition.proteinGrams >= target.meals.proteinTarget;
      importedRecords[targetDate] = { ...target, meals: mealsForDay, dailyNutrition: { ...parsed.nutrition, loggedMealsSummary: Object.values(parsed.nutrition.meals).filter((meal): meal is string => Boolean(meal)) }, workout: parsed.workout, completedGoals: [...new Set([...target.completedGoals, ...(gymDone ? ["gym"] : []), ...(macrosDone ? ["macros"] : [])])] };
      importedMeals[matchingDate.toLocaleDateString("en-US", { weekday: "long" })] = mealsForDay;

      const baseSchedule = targetDate === dateKey ? schedule : getDefaultScheduleForDate(matchingDate);
      const workoutLabel = parsed.workout.exercises.map((exercise) => `${exercise.name} ${exercise.sets}×${exercise.reps}${exercise.weight ? ` @ ${exercise.weight}` : ""}`).join(", ");
      const importedSchedule = { ...baseSchedule, gym: parsed.workout.isRestDay ? "Rest day" : parsed.workout.sessionName || baseSchedule.gym, morning: baseSchedule.morning.map((item) => item.title.toLowerCase().includes("gym") && workoutLabel ? { ...item, title: `${item.title} · ${workoutLabel}` } : item) };
      window.localStorage.setItem(`schedule_${targetDate}`, JSON.stringify(importedSchedule));
      if (targetDate === dateKey) setSchedule(importedSchedule);
    });

    setRecords(importedRecords);
    setGlobalState((current) => ({ ...current, meals: importedMeals }));
  }

  function syncCurriculum(tracks: CurriculumTrack[]) {
    const pending = tracks.flatMap((track) => track.modules.flatMap((module) => module.lessons.filter((lesson) => lesson.status !== "Completed").map((lesson) => ({ lesson, title: `${track.platform} - ${lesson.title}` }))));
    const blocks = [{ day: 4, time: "7:00 PM", minutes: 60 }, { day: 6, time: "9:00 AM", minutes: 150 }, { day: 0, time: "8:15 PM", minutes: 75 }];
    getWeekDates(weekAnchor).forEach((date, index) => {
      const block = blocks.find((item) => item.day === date.getDay());
      const nextLesson = pending[index % Math.max(pending.length, 1)];
      if (!block || !nextLesson) return;
      const key = toIsoDate(date);
      const base = key === dateKey ? schedule : getDefaultScheduleForDate(date);
      window.localStorage.setItem(`schedule_${key}`, JSON.stringify({ ...base, evening: [...base.evening, { id: `curriculum-${nextLesson.lesson.id}-${key}`, time: block.time, title: `Study: ${nextLesson.title}`, category: "Curriculum" }] }));
    });
    window.location.reload();
  }

  function importSchedulePayloads(payloads: DailySchedulePayload[]) {
    payloads.forEach((payload) => {
      const targetDate = payload.date || dateKey;
      const target = new Date(`${targetDate}T12:00:00`);
      const base = targetDate === dateKey ? schedule : getDefaultScheduleForDate(target);
      const toItem = (event: DailySchedulePayload["events"][number]) => ({ id: event.id, time: event.time, title: event.title, category: event.category, completed: event.completed });
      const morning = payload.events.filter((event) => /AM|^0?([5-9]|10|11):/i.test(event.time)).map(toItem);
      const evening = payload.events.filter((event) => !morning.some((item) => item.id === event.id)).map(toItem);
      const imported = { ...base, morning, evening };
      window.localStorage.setItem(`user_schedule_${targetDate}`, JSON.stringify(payload));
      window.localStorage.setItem(`schedule_${targetDate}`, JSON.stringify(imported));
      if (targetDate === dateKey) setSchedule(imported);
    });
  }

  if (activeTab === "Curriculum Tracker") {
    return <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900"><div className="mx-auto max-w-6xl"><button type="button" onClick={() => setActiveTab("Today")} className="mb-6 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold">Back to Today</button><CurriculumTracker tracks={curriculum} onChange={setCurriculum} onSync={syncCurriculum} /><ScheduleImportModal isOpen={scheduleImportOpen} selectedDate={dateKey} onClose={() => setScheduleImportOpen(false)} onImport={importSchedulePayloads} /></div></main>;
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><header className="mb-5 border-b border-slate-200 pb-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Daily execution dashboard</p><div className="mt-2 flex items-center gap-2"><button type="button" aria-label="Previous day" onClick={() => moveDate(-1)} className="rounded-lg border border-slate-200 bg-white p-2"><ChevronLeft size={18} /></button><h1 className="text-3xl font-bold sm:text-4xl">{selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h1><button type="button" aria-label="Next day" onClick={() => moveDate(1)} className="rounded-lg border border-slate-200 bg-white p-2"><ChevronRight size={18} /></button></div><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">{schedule.theme}</span><button type="button" onClick={() => setSelectedDate(new Date())} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold"><CalendarDays size={14} />Today</button></div></div><div className="flex items-center gap-3"><button type="button" onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"><Sparkles size={15} />Smart Import</button><span className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 size={18} className="text-emerald-600" />{record.completedGoals.length} targets complete</span></div></div><div className="mt-5 flex items-center gap-2"><button type="button" aria-label="Previous week" onClick={() => { const date = new Date(weekAnchor); date.setDate(date.getDate() - 7); setWeekAnchor(date); setSelectedDate(date); }} className="rounded-lg border border-slate-200 bg-white p-2"><ChevronLeft size={18} /></button><div className="flex flex-1 gap-2 overflow-x-auto">{weekDates.map((date) => { const item = getDefaultScheduleForDate(date); const key = toIsoDate(date); return <button key={key} type="button" onClick={() => { setSelectedDate(date); setWeekAnchor(date); }} className={`min-w-24 flex-1 rounded-xl border p-2 text-left ${key === dateKey ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}><span className="block text-xs font-bold text-slate-500">{item.shortDate}</span><span className="mt-1 block truncate text-xs font-semibold">{item.status}</span></button>; })}</div><button type="button" aria-label="Next week" onClick={() => { const date = new Date(weekAnchor); date.setDate(date.getDate() + 7); setWeekAnchor(date); setSelectedDate(date); }} className="rounded-lg border border-slate-200 bg-white p-2"><ChevronRight size={18} /></button></div></header><nav className="mb-8 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">{tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-lg px-4 py-3 text-sm font-bold ${activeTab === tab ? "bg-slate-900 text-white" : "text-slate-500"}`}>{tab}</button>)}</nav>{activeTab === "Today" && <TodayView schedule={schedule} record={record} onUpdate={updateRecord} />} {activeTab === "Weekly Overview" && <WeeklyOverview goals={globalState.weeklyGoals} appliedGoals={globalState.appliedWeeklyGoals} onSave={(goals) => { updateGlobal("weeklyGoals", goals); updateGlobal("appliedWeeklyGoals", goals); }} />} {activeTab === "Meal Planner" && <MealPlanner meals={meals} onChange={(day, meal) => { const date = weekDates.find((item) => item.toLocaleDateString("en-US", { weekday: "long" }) === day); if (date) updateRecord("meals", meal, toIsoDate(date)); }} onDuplicateMonday={() => undefined} />} {activeTab === "Finances" && <div className="space-y-6"><DoorDashTracker logs={record.dashLogs} onChange={(logs) => updateRecord("dashLogs", logs)} /><FinanceEngine paycheck={globalState.paycheck} onChange={(paycheck) => updateGlobal("paycheck", paycheck)} dashLogs={record.dashLogs} advanceOffset={globalState.advanceOffset} onAdvanceToggle={() => updateGlobal("advanceOffset", !globalState.advanceOffset)} /></div>}<AiImportModal isOpen={importOpen} selectedDate={dateKey} onClose={() => setImportOpen(false)} onDataImported={importParsedData} /></div></main>;
}

function TodayView({ schedule, record, onUpdate }: { schedule: DailySchedule; record: DailyRecord; onUpdate: <K extends keyof DailyRecord>(key: K, value: DailyRecord[K]) => void }) { const toggle = (items: string[], id: string) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]; return <div className="space-y-6"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-3"><Dumbbell className="text-amber-500" /><h2 className="text-xl font-bold">Core targets</h2></div><div className="grid gap-3 md:grid-cols-2">{schedule.goals.map((goal) => { const complete = record.completedGoals.includes(goal.id); return <button key={goal.id} type="button" onClick={() => onUpdate("completedGoals", toggle(record.completedGoals, goal.id))} className={`flex items-center gap-3 rounded-lg border p-3 text-left ${complete ? "border-emerald-200 bg-emerald-50 line-through" : "border-slate-200"}`}>{complete ? <CheckCircle2 className="text-emerald-600" size={21} /> : <Circle className="text-slate-300" size={21} />}{goal.label}</button>; })}</div></section><div className="grid gap-6 lg:grid-cols-2"><Timeline title="Morning execution · AM" icon={<Sun size={20} />} items={schedule.morning} /><Timeline title="Afternoon / evening · PM" icon={<Moon size={20} />} items={schedule.evening} /></div><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-3"><Utensils className="text-amber-500" /><h2 className="text-xl font-bold">Meal &amp; macros</h2></div><div className="grid gap-3 sm:grid-cols-2"><Meal label="Breakfast" value={record.meals.breakfast} /><Meal label="Lunch" value={record.meals.lunch} /><Meal label="Dinner" value={record.meals.dinner} /><Meal label="Snacks" value={record.meals.snacks} /></div><p className="mt-4 text-sm font-semibold">{record.meals.proteinTarget}g protein · {record.meals.calorieTarget} calories</p><p className="mt-2 text-xs text-slate-500">Logged: {record.dailyNutrition.proteinGrams ?? "--"}g protein · {record.dailyNutrition.carbsGrams ?? "--"}g carbs · {record.dailyNutrition.fatsGrams ?? "--"}g fat</p><div className="mt-4 flex gap-3">{[0, 1, 2, 3].map((index) => <button key={index} type="button" aria-label={`Water serving ${index + 1}`} onClick={() => onUpdate("hydration", index < record.hydration && index === record.hydration - 1 ? index : index + 1)} className={`rounded-full border p-2 ${index < record.hydration ? "border-sky-200 bg-sky-100 text-sky-600" : "border-slate-200 text-slate-300"}`}><Droplets size={18} /></button>)}</div></section><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><DollarSign className="text-emerald-600" /><h2 className="text-xl font-bold">Rent Vault target</h2></div><p className="mt-4 text-sm text-slate-500">${schedule.dashTarget.toFixed(2)} planned Dash target</p></section></div></div>; }

function Timeline({ title, icon, items }: { title: string; icon: React.ReactNode; items: DailySchedule["morning"] }) { return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center gap-3"><span className="rounded-lg bg-amber-50 p-2 text-amber-700">{icon}</span><h2 className="font-semibold">{title}</h2></div><div className="space-y-4">{items.map((item) => <div key={`${item.time}-${item.title}`} className="grid grid-cols-[7rem_1fr] gap-3"><span className="text-xs font-bold text-slate-500"><Clock3 size={14} className="mr-1 inline" />{item.time}</span><p className="border-l border-slate-200 pl-3 text-sm font-semibold">{item.title}</p></div>)}</div></section>; }
function Meal({ label, value }: { label: string; value: string }) { return <details className="rounded-lg border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer list-none"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 whitespace-normal break-words text-sm font-semibold leading-5">{value}</p></summary><p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600">Prep note: portion this ahead and pack it where you will see it. For lunch, use 1 tuna packet (Sweet &amp; Spicy) plus 1 snack pack. For dinner, use 1 cup cooked lentils plus 1/2 cup quinoa or rice.</p></details>; }