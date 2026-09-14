"use client";

import { BookOpen, CalendarClock, Check, Circle, Clock3, Play, Target } from "lucide-react";
import type { CurriculumTrack, Lesson, LessonStatus } from "@/types/dashboard";

interface CurriculumTrackerProps {
  tracks: CurriculumTrack[];
  onChange: (tracks: CurriculumTrack[]) => void;
  onSync: (tracks: CurriculumTrack[]) => void;
}

const statusCycle: LessonStatus[] = ["Not Started", "In Progress", "Completed"];

export default function CurriculumTracker({ tracks, onChange, onSync }: CurriculumTrackerProps) {
  const lessons = tracks.flatMap((track) => track.modules.flatMap((module) => module.lessons));
  const completedMinutes = lessons.filter((lesson) => lesson.status === "Completed").reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0);
  const remainingMinutes = lessons.filter((lesson) => lesson.status !== "Completed").reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0);
  const nextLesson = lessons.find((lesson) => lesson.status !== "Completed");
  const completion = lessons.length ? Math.round((completedMinutes / (completedMinutes + remainingMinutes)) * 100) : 0;

  function toggleLesson(lessonId: string) {
    onChange(tracks.map((track) => ({ ...track, modules: track.modules.map((module) => ({ ...module, lessons: module.lessons.map((lesson) => { if (lesson.id !== lessonId) return lesson; const status = statusCycle[(statusCycle.indexOf(lesson.status) + 1) % statusCycle.length]; return { ...lesson, status }; }) })) })));
  }

  return <div className="space-y-6"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Curriculum &amp; tech career</p><h2 className="mt-1 text-2xl font-bold">Build the next skill</h2><p className="mt-2 text-sm text-slate-500">One lesson at a time, with the next action visible.</p></div><button type="button" onClick={() => onSync(tracks)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"><CalendarClock size={17} />Sync to weekly schedule</button></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Overall progress" value={`${completion}%`} /><Metric label="Completed" value={`${(completedMinutes / 60).toFixed(1)}h`} /><Metric label="Remaining" value={`${(remainingMinutes / 60).toFixed(1)}h`} /></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${completion}%` }} /></div>{nextLesson && <div className="mt-5 flex items-center gap-3 rounded-lg bg-amber-50 p-4"><Target className="shrink-0 text-amber-700" size={20} /><div><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Next up</p><p className="mt-1 text-sm font-bold text-amber-950">{nextLesson.title}</p><p className="mt-1 text-xs text-amber-900">{Math.round(nextLesson.estimatedMinutes)} minutes</p></div></div>}</section><div className="space-y-4">{tracks.map((track) => <section key={track.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-start gap-3"><span className="rounded-lg bg-sky-50 p-2 text-sky-700"><BookOpen size={20} /></span><div><p className="text-xs font-bold uppercase tracking-wide text-sky-700">{track.platform}</p><h3 className="mt-1 text-lg font-bold">{track.title}</h3></div></div><div className="space-y-4">{track.modules.map((module) => <div key={module.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4"><h4 className="font-bold text-slate-800">{module.title}</h4><div className="mt-3 space-y-2">{module.lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} onToggle={() => toggleLesson(lesson.id)} />)}</div></div>)}</div></section>)}</div></div>;
}

function LessonRow({ lesson, onToggle }: { lesson: Lesson; onToggle: () => void }) { const completed = lesson.status === "Completed"; const active = lesson.status === "In Progress"; return <button type="button" onClick={onToggle} aria-pressed={completed} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${completed ? "border-emerald-200 bg-emerald-50" : active ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white hover:border-amber-300"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${completed ? "bg-emerald-500 text-white" : active ? "bg-amber-500 text-white" : "border border-slate-300 text-transparent"}`}>{completed ? <Check size={14} /> : active ? <Play size={12} /> : <Circle size={12} />}</span><span className={completed ? "min-w-0 flex-1 text-sm text-slate-500 line-through" : "min-w-0 flex-1 text-sm font-semibold"}>{lesson.title}</span><span className="flex shrink-0 items-center gap-1 text-xs text-slate-500"><Clock3 size={13} />{lesson.estimatedMinutes}m</span></button>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }