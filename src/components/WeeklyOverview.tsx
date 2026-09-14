"use client";

import { Check, Flag, Target, Trophy } from "lucide-react";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import CurriculumTracker from "@/components/CurriculumTracker";
import ScheduleImportModal from "@/components/ScheduleImportModal";
import { usePersistentState } from "@/hooks/usePersistentState";
import { CurriculumTrack, DailyRecord, DailySchedule, defaultCurriculumTracks, getDefaultScheduleForDate, getWeekDates, toIsoDate, WeeklyGoals } from "@/types/dashboard";

interface WeeklyOverviewProps {
  goals: WeeklyGoals;
  appliedGoals: WeeklyGoals;
  onSave: (goals: WeeklyGoals) => void;
  records?: Record<string, DailyRecord>;
}

const fields: Array<{ key: keyof WeeklyGoals; label: string; placeholder: string }> = [
  { key: "financial", label: "Primary financial goal", placeholder: "Clear Advance & Launch October Rent Vault" },
  { key: "gym", label: "Weekly gym target", placeholder: "5 sessions logged at Idaho Fitness Factory" },
  { key: "coding", label: "Tech / coding target", placeholder: "5 hours across Odin Project / JS" },
  { key: "personal", label: "Personal / routine goal", placeholder: "Daily dog walks & meal prep consistency" },
];

export default function WeeklyOverview({ goals, appliedGoals, onSave, records: suppliedRecords }: WeeklyOverviewProps) {
  const [draft, setDraft] = useState(goals);
  const [scheduleImportOpen, setScheduleImportOpen] = useState(false);
  const [storedRecords] = useLocalStorage<Record<string, DailyRecord>>("smart-calendar-daily-records", {});
  const records = suppliedRecords ?? storedRecords;
  const [curriculum, setCurriculum] = usePersistentState<CurriculumTrack[]>("personal-os-curriculum", defaultCurriculumTracks);
  const weekStatus = getWeekDates(new Date()).map((date) => {
    const record = records[toIsoDate(date)];
    const isFuture = toIsoDate(date) > toIsoDate(new Date());
    const completed = record?.completedGoals ?? [];
    const done = completed.length > 0;
    return { day: date.toLocaleDateString("en-US", { weekday: "short" }), status: isFuture && !done ? "Upcoming" : done ? `${completed.length} logged` : "Planned", done };
  });

  function update(key: keyof WeeklyGoals, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function syncCurriculum(tracks: CurriculumTrack[]) {
    const pending = tracks.flatMap((track) => track.modules.flatMap((module) => module.lessons.filter((lesson) => lesson.status !== "Completed").map((lesson) => `${track.platform} - ${lesson.title}`)));
    const blocks = [{ day: 4, time: "7:00 PM" }, { day: 6, time: "9:00 AM" }, { day: 0, time: "8:15 PM" }];
    let index = 0;
    getWeekDates(new Date()).forEach((date) => {
      const block = blocks.find((item) => item.day === date.getDay());
      const lessonTitle = pending[index];
      if (!block || !lessonTitle) return;
      const key = toIsoDate(date);
      const schedule = getDefaultScheduleForDate(date);
      window.localStorage.setItem(`schedule_${key}`, JSON.stringify({ ...schedule, evening: [...schedule.evening, { id: `curriculum-${key}-${index}`, time: block.time, title: `Study: ${lessonTitle}`, category: "Curriculum" }] }));
      index += 1;
    });
    window.location.reload();
  }

  function importSchedule(payloads: Array<{ date: string; events: Array<{ id: string; time: string; title: string; category: string; completed: boolean }> }>) { payloads.forEach((payload) => { const date = new Date(`${payload.date}T12:00:00`); const base = getDefaultScheduleForDate(date); const morning = payload.events.filter((event) => /AM|^0?([5-9]|10|11):/i.test(event.time)); const imported: DailySchedule = { ...base, morning: morning.map((event) => ({ ...event, category: event.category })), evening: payload.events.filter((event) => !morning.includes(event)).map((event) => ({ ...event, category: event.category })) }; window.localStorage.setItem(`user_schedule_${payload.date}`, JSON.stringify(payload)); window.localStorage.setItem(`schedule_${payload.date}`, JSON.stringify(imported)); }); window.location.reload(); }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Plan the week</p><h2 className="mt-1 text-2xl font-bold">Weekly focus &amp; goal orchestrator</h2><p className="mt-2 text-sm text-slate-500">Four clear anchors. Everything else can wait its turn.</p></div>
          <Target className="shrink-0 text-amber-500" size={26} aria-hidden="true" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">{field.label}</span>
              <input value={draft[field.key]} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => onSave(draft)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"><Flag size={16} aria-hidden="true" />Apply weekly goals</button><button type="button" onClick={() => setScheduleImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 text-xs font-bold text-sky-700"><CalendarPlus size={15} />Import My Schedule</button></div>
        <p className="mt-3 text-xs text-slate-500">Applied goals feed the active Today checklist and its timeline focus.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Momentum, not perfection</p><h2 className="mt-1 text-xl font-bold">This week at a glance</h2></div><Trophy className="text-amber-500" size={24} aria-hidden="true" /></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {weekStatus.map(({ day, status, done }) => <div key={day} className={`rounded-lg border p-3 ${done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold text-slate-500">{day}</p><div className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-white">{done ? <Check size={16} className="text-emerald-600" aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}</div><p className="mt-3 min-h-8 text-xs font-semibold leading-4 text-slate-700">{status}</p></div>)}
        </div>
        <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-950"><span className="font-bold">Live focus: </span>{appliedGoals.financial}</div>
      </section>

      <CurriculumTracker tracks={curriculum} onChange={setCurriculum} onSync={syncCurriculum} /><ScheduleImportModal isOpen={scheduleImportOpen} selectedDate={toIsoDate(new Date())} onClose={() => setScheduleImportOpen(false)} onImport={importSchedule} />
    </div>
  );
}