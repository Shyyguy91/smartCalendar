export interface WeeklyGoals {
  financial: string;
  gym: string;
  coding: string;
  personal: string;
}

export type LessonStatus = "Not Started" | "In Progress" | "Completed";

export interface Lesson {
  id: string;
  title: string;
  estimatedMinutes: number;
  status: LessonStatus;
}

export interface CurriculumModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface CurriculumTrack {
  id: string;
  platform: string;
  title: string;
  modules: CurriculumModule[];
}

export interface StudySession {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  lessonId: string;
  title: string;
  completed: boolean;
}

export const defaultCurriculumTracks: CurriculumTrack[] = [
  {
    id: "odin",
    platform: "The Odin Project",
    title: "Full Stack JavaScript",
    modules: [
      { id: "odin-html-css", title: "Intermediate HTML & CSS", lessons: [{ id: "odin-grid", title: "CSS Grid and Flexbox layouts", estimatedMinutes: 60, status: "Not Started" }, { id: "odin-responsive", title: "Responsive design project", estimatedMinutes: 90, status: "Not Started" }] },
      { id: "odin-js", title: "JavaScript", lessons: [{ id: "odin-objects", title: "JavaScript Objects & Constructors", estimatedMinutes: 75, status: "Not Started" }, { id: "odin-array", title: "JavaScript Array Methods", estimatedMinutes: 60, status: "Not Started" }] },
      { id: "odin-react", title: "React", lessons: [{ id: "odin-hooks", title: "React Hooks Deep Dive", estimatedMinutes: 90, status: "Not Started" }] },
    ],
  },
  { id: "freecodecamp", platform: "freeCodeCamp", title: "Frontend Development", modules: [{ id: "fcc-algorithms", title: "JavaScript Algorithms", lessons: [{ id: "fcc-basics", title: "JavaScript basics practice", estimatedMinutes: 60, status: "Not Started" }] }] },
];

export interface BillItem {
  id: string;
  label: string;
  amount: number;
  dueLabel: string;
  urgency: "immediate" | "standard";
}

export interface PayrollProfile {
  withholdingRate: number | null;
  grossPay: number | null;
  netPay: number | null;
  totalHours: number | null;
  overtimeHours: number | null;
  totalTaxesAndDeductions: number | null;
  lineItemDeductions: Array<{ name: string; amount: number }>;
}

export interface PaystubExtraction {
  grossPay: number;
  netPay: number;
  totalHours: number;
  overtimeHours: number;
  totalTaxesAndDeductions: number;
  effectiveWithholdingRate: number;
  lineItemDeductions: Array<{ name: string; amount: number }>;
}

export interface DashLogEntry {
  id: string;
  date: string;
  shiftHours: number;
  grossEarnings: number;
  gasExpense: number;
  destination: "rent-vault" | "tire-fund";
}

export interface MealDay {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  proteinTarget: number;
  calorieTarget: number;
}

export interface DailyScheduleItem {
  id?: string;
  time: string;
  title: string;
  category?: string;
  detail?: string;
  completed?: boolean;
}

export type ImportedEventCategory = "work" | "gym" | "dogs" | "study" | "errands" | "rest";

export interface ImportedEvent {
  id: string;
  time: string;
  title: string;
  category: ImportedEventCategory;
  completed: boolean;
}

export interface DailySchedulePayload {
  date: string;
  events: ImportedEvent[];
}

export interface DailySchedule {
  date: string;
  day: string;
  shortDate: string;
  theme: string;
  status: string;
  goals: Array<{ id: string; label: string }>;
  morning: DailyScheduleItem[];
  evening: DailyScheduleItem[];
  gym: string;
  dashTarget: number;
}

export interface DailyRecord {
  completedGoals: string[];
  meals: MealDay;
  dailyNutrition: {
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatsGrams: number | null;
    loggedMealsSummary: string[];
  };
  workout: DailyImportData["workout"];
  hydration: number;
  dashLogs: DashLogEntry[];
}

export interface DailyImportData {
  dateOrDayName: string;
  nutrition: {
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatsGrams: number | null;
    meals: {
      breakfast?: string;
      lunch?: string;
      dinner?: string;
      snacks?: string;
    };
  };
  workout: {
    isRestDay: boolean;
    sessionName: string;
    durationMinutes: number | null;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      weight: string | null;
    }>;
  };
}

export interface WeeklyParsedPayload {
  weekDays: DailyImportData[];
}

export type WeeklyTemplate = Record<number, Omit<DailySchedule, "date" | "day" | "shortDate">>;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekDates(anchorDate: Date): Date[] {
  const monday = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

export function getDefaultScheduleForDate(date: Date): DailySchedule {
  const template = defaultWeeklyTemplate[date.getDay()] ?? defaultWeeklyTemplate[1];
  const isRentDue = date.getDate() === 15;
  const goals = template.goals.filter((goal) => isRentDue || goal.id !== "rent");
  return {
    ...template,
    theme: isRentDue ? template.theme : template.theme.replace("Rent Due Day & Therapy Split Shift", "Therapy Split Shift"),
    status: isRentDue ? template.status : template.status.replace(" / Rent", ""),
    date: toIsoDate(date),
    day: date.toLocaleDateString("en-US", { weekday: "long" }),
    shortDate: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
    goals: goals.map((goal) => ({ ...goal })),
    morning: template.morning.map((item, index) => ({ ...item, id: item.id ?? `${toIsoDate(date)}-am-${index}` })),
    evening: template.evening.map((item, index) => ({ ...item, id: item.id ?? `${toIsoDate(date)}-pm-${index}` })),
  };
}

export interface PaycheckSummary {
  baseRate: number;
  weekOneRegular: number;
  weekOneOvertime: number;
  weekTwoRegular: number;
  weekTwoOvertime: number;
  secondaryIncome: number;
  withholding: number;
  dashProfit: number;
  grossPay: number;
  netTakeHome: number;
}

export interface ParsedDailyLog {
  nutrition: {
    calories: number | null;
    proteinGrams: number | null;
    carbsGrams: number | null;
    fatsGrams: number | null;
    loggedMealsSummary: string[];
  };
  workout: {
    completed: boolean;
    sessionName: string;
    durationMinutes: number | null;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      weight: string | null;
    }>;
  };
  dailyGoalsChecked: {
    gymDone: boolean;
    macrosMet: boolean;
  };
}

export interface PersistedDashboardState {
  weeklyGoals: WeeklyGoals;
  appliedWeeklyGoals: WeeklyGoals;
  meals: Record<string, MealDay>;
  dashLogs: DashLogEntry[];
  paycheck: Omit<PaycheckSummary, "grossPay" | "netTakeHome" | "dashProfit">;
  advanceOffset: boolean;
  completedGoals: string[];
  paidBills: string[];
  hydration: number;
  payrollProfile: PayrollProfile;
  paidBillIds: string[];
}

export const defaultWeeklyGoals: WeeklyGoals = {
  financial: "Clear Advance & Launch October Rent Vault",
  gym: "5 sessions logged at Idaho Fitness Factory",
  coding: "5 hours across Odin Project / JS",
  personal: "Daily dog walks & meal prep consistency",
};

export const defaultMeals: MealDay = {
  breakfast: "Protein shake + fruit",
  lunch: "Chicken rice bowl",
  dinner: "Salmon, potatoes & greens",
  snacks: "Greek yogurt",
  proteinTarget: 160,
  calorieTarget: 2200,
};

export const weeklyScheduleData: DailySchedule[] = [
  { date: "2026-09-14", day: "Monday", shortDate: "Mon 14", theme: "Payroll Advance & Bill Reset", status: "Gym AM", goals: [{ id: "advance", label: "Request $1,600 advance at Caxton's" }, { id: "insurance", label: "Pay Car Insurance ($130)" }, { id: "storage", label: "Pay Storage ($130)" }, { id: "phone", label: "Pay Phone ($135)" }], morning: [{ time: "5:30 AM", title: "Wake + morning medications" }, { time: "6:00 AM", title: "Take dogs out" }, { time: "6:15 AM", title: "Gym: Push & Core @ Idaho Fitness Factory" }, { time: "7:00 AM", title: "Arrive at Caxton's" }], evening: [{ time: "6:00–6:30 PM", title: "Wrap shift" }, { time: "6:30 PM", title: "Dog decompression & dinner" }, { time: "7:15 PM", title: "Low-stress evening" }, { time: "9:30 PM", title: "Early sleep" }], gym: "30m Push & Core", dashTarget: 0 },
  { date: "2026-09-15", day: "Tuesday", shortDate: "Tue 15", theme: "Rent Due Day & Therapy Split Shift", status: "Therapy / Rent", goals: [{ id: "rent", label: "Pay Rent ($1,200)" }, { id: "therapy", label: "Attend 3:00 PM therapy" }, { id: "work", label: "Complete Caxton's shift" }, { id: "recovery", label: "Protect recovery night" }], morning: [{ time: "6:30 AM", title: "Wake, medications & dog walk" }, { time: "7:00 AM", title: "Caxton's morning block" }, { time: "2:30 PM", title: "Wrap morning block" }], evening: [{ time: "3:00 PM", title: "Therapy appointment" }, { time: "4:00–6:30 PM", title: "Caxton's return block" }, { time: "6:30 PM", title: "Post-work dog cuddles" }, { time: "7:30 PM", title: "Recovery / decompression night" }], gym: "Rest day", dashTarget: 0 },
  { date: "2026-09-16", day: "Wednesday", shortDate: "Wed 16", theme: "October Rent Dash Kickoff", status: "Dash Sprint", goals: [{ id: "gym", label: "Complete 30m gym session" }, { id: "macros", label: "Hit 160g protein" }, { id: "dash", label: "Kick off October Rent Engine ($45)" }, { id: "work", label: "Complete Caxton's shift" }], morning: [{ time: "5:30 AM", title: "Wake + morning medications" }, { time: "6:00 AM", title: "Take dogs out" }, { time: "6:15 AM", title: "Gym: Legs & Pull" }, { time: "7:00 AM", title: "Arrive at Caxton's" }], evening: [{ time: "6:00–6:30 PM", title: "Wrap Caxton's" }, { time: "6:30–7:30 PM", title: "Dog walk & dinner" }, { time: "7:45–9:45 PM", title: "Rent Dash · $45 target" }], gym: "30m Legs & Pull", dashTarget: 45 },
  { date: "2026-09-17", day: "Thursday", shortDate: "Thu 17", theme: "Mid-Week Tech Sprint & Rent Dash", status: "Tech + Dash", goals: [{ id: "gym", label: "Complete morning gym" }, { id: "coding", label: "Complete 1-hour Odin / JS sprint" }, { id: "dash", label: "Deposit $40 to Rent Vault" }, { id: "work", label: "Complete Caxton's shift" }], morning: [{ time: "5:30 AM", title: "Wake + morning medications" }, { time: "6:00 AM", title: "Take dogs out" }, { time: "6:15 AM", title: "Gym" }, { time: "7:00 AM", title: "Arrive at Caxton's" }], evening: [{ time: "6:00 PM", title: "Wrap Caxton's" }, { time: "6:30 PM", title: "Dogs & dinner" }, { time: "7:00–8:00 PM", title: "Coding study block" }, { time: "8:15–9:45 PM", title: "Rent Dash · $40 target" }], gym: "30m Morning session", dashTarget: 40 },
  { date: "2026-09-18", day: "Friday", shortDate: "Fri 18", theme: "Caxton's Payday & Half-Day Reset", status: "Payday / Rest", goals: [{ id: "advance", label: "Reconcile $1,600 advance deduction" }, { id: "tire", label: "Route ~$270 surplus to Tire Fund" }, { id: "gym", label: "Complete gym session" }, { id: "reset", label: "Take the half-day reset" }], morning: [{ time: "7:00 AM–1:00 PM", title: "Caxton's half-day" }, { time: "1:30–2:00 PM", title: "Gym session" }, { time: "2:30–4:00 PM", title: "Extended dog park / trail run" }], evening: [{ time: "4:00 PM+", title: "Off: social & rest night" }], gym: "30m Reset session", dashTarget: 0 },
  { date: "2026-09-19", day: "Saturday", shortDate: "Sat 19", theme: "Deep Work Coding & Peak Weekend Dash", status: "Deep Work", goals: [{ id: "coding", label: "Complete 2.5 hours deep work tech build" }, { id: "reptile", label: "Care for reptile habitat" }, { id: "dash", label: "Complete $105 weekend Rent Dash" }, { id: "dogs", label: "Take dogs on trail walk" }], morning: [{ time: "7:30 AM", title: "Trail walk with dogs" }, { time: "8:15 AM", title: "Gecko / vivarium care" }, { time: "9:00–11:30 AM", title: "Deep Work Coding Sprint · VS Code" }], evening: [{ time: "12:00–2:30 PM", title: "Lunch Rent Dash · $55" }, { time: "2:30 PM", title: "Afternoon reset" }, { time: "7:00–9:00 PM", title: "Dinner Rent Dash · $50" }], gym: "Active recovery / rest day", dashTarget: 105 },
  { date: "2026-09-20", day: "Sunday", shortDate: "Sun 20", theme: "Savers Shift, Gym & Weekly Closeout", status: "Savers", goals: [{ id: "savers", label: "Complete Savers shift" }, { id: "gym", label: "Complete afternoon gym" }, { id: "dash", label: "Complete $60 Rent Dash" }, { id: "review", label: "Weekly review & GitHub commit" }], morning: [{ time: "8:30 AM–12:30 PM", title: "Savers shift" }, { time: "1:30 PM", title: "Dog walk & rest" }, { time: "3:30–4:00 PM", title: "Gym session" }], evening: [{ time: "4:45–7:45 PM", title: "Dinner Rent Dash · $60 target" }, { time: "8:15–9:30 PM", title: "Study review & weekly planning" }], gym: "30m Afternoon session", dashTarget: 60 },
];

export const defaultWeeklyTemplate: WeeklyTemplate = Object.fromEntries(weeklyScheduleData.map((schedule) => {
  const weekday = new Date(`${schedule.date}T12:00:00`).getDay();
  return [weekday, {
    theme: schedule.theme,
    status: schedule.status,
    goals: schedule.goals,
    morning: schedule.morning,
    evening: schedule.evening,
    gym: schedule.gym,
    dashTarget: schedule.dashTarget,
  }];
})) as WeeklyTemplate;

export const defaultState: PersistedDashboardState = {
  weeklyGoals: defaultWeeklyGoals,
  appliedWeeklyGoals: defaultWeeklyGoals,
  meals: {},
  dashLogs: [],
  paycheck: {
    baseRate: 22,
    weekOneRegular: 40,
    weekOneOvertime: 0,
    weekTwoRegular: 40,
    weekTwoOvertime: 0,
    secondaryIncome: 0,
    withholding: 16,
  },
  advanceOffset: true,
  completedGoals: [],
  paidBills: [],
  hydration: 0,
  payrollProfile: { withholdingRate: null, grossPay: null, netPay: null, totalHours: null, overtimeHours: null, totalTaxesAndDeductions: null, lineItemDeductions: [] },
  paidBillIds: [],
};

export const billItems: BillItem[] = [
  { id: "rent", label: "Rent", amount: 1200, dueLabel: "Due on 15th", urgency: "immediate" },
  { id: "insurance", label: "Car Insurance", amount: 130, dueLabel: "Monthly", urgency: "immediate" },
  { id: "phone", label: "Phone Bill", amount: 135, dueLabel: "Monthly", urgency: "standard" },
  { id: "storage", label: "Storage Unit", amount: 130, dueLabel: "Monthly", urgency: "standard" },
  { id: "gym", label: "Idaho Fitness Factory + Hevy", amount: 34, dueLabel: "Monthly", urgency: "standard" },
  { id: "subscriptions", label: "Subscriptions (Spotify, Audible, HBO Max, Google)", amount: 69, dueLabel: "Monthly", urgency: "standard" },
];