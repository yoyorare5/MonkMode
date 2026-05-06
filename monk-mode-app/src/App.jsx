import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Flame,
  Heart,
  Leaf,
  Moon,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

const STORAGE_KEY = "fasting_mode_local_v3";
const LEGACY_KEYS = ["fasting_mode_local_v2", "fasting_mode_cloud_v1", "fasting_mode_prod_v1", "monk_mode_prod_v1"];
const TZ = "America/New_York";

const FAST_TYPES = [
  ["16:8", "16:8 Intermittent", "16h fast - 8h eating"],
  ["18:6", "18:6 Intermittent", "18h fast - 6h eating"],
  ["20:4", "20:4 Warrior", "20h fast - 4h eating"],
  ["24", "24 Hour", "One day fast"],
  ["custom", "Custom consecration", "Build your own rule"],
];
const FAST_LENGTHS = [7, 21, 30, 60, 90];
const DEFAULT_RULES = [
  "Begin the fast on time",
  "No calories outside the window",
  "Pray before phone",
  "Read Scripture with attention",
  "Train the body with discipline",
  "No lust, porn, or compromise",
];
const SCRIPTURES = [
  ["Proverbs 16:3", "Commit your work to the Lord, and your plans will be established."],
  ["1 Corinthians 9:27", "I discipline my body and keep it under control."],
  ["Matthew 6:18", "Your Father who sees in secret will reward you."],
  ["1 Peter 5:8", "Be sober-minded; be watchful."],
];
const NAV_TABS = [
  ["today", "Today", SunMedium],
  ["goals", "Goals", Target],
  ["analytics", "Analytics", BarChart3],
  ["settings", "Settings", Settings],
];
const DEFAULT_REWARDS = { totalXp: 0, todayXp: 0, streakDays: 0, bestStreak: 0, failedDays: 0, events: [] };
const DEFAULT_GOALS = [
  {
    id: "goal_focus_90",
    title: "90 minute deep work block",
    category: "Focus",
    targetValue: 21,
    currentValue: 5,
    unit: "sessions",
    deadline: addDays(todayKey(), 21),
    why: "Build work capacity without phone drift.",
    status: "active",
    createdAt: addDays(todayKey(), -6),
    progressHistory: seedHistory(7, [12, 18, 25, 31, 29, 37, 42]),
    linkedDailyActions: [
      makeGoalAction("Deep work before messages", "45 min minimum"),
      makeGoalAction("Minimum version: 10 focused minutes", "Open the work and start cleanly", 10, "easy"),
    ],
  },
  {
    id: "goal_training",
    title: "Train consistently",
    category: "Fitness",
    targetValue: 30,
    currentValue: 12,
    unit: "workouts",
    deadline: addDays(todayKey(), 45),
    why: "Discipline the body and strengthen the will.",
    status: "active",
    createdAt: addDays(todayKey(), -14),
    progressHistory: seedHistory(7, [26, 31, 34, 38, 39, 41, 45]),
    linkedDailyActions: [makeGoalAction("Workout", "Minimum version: 10 push ups", 45, "medium")],
  },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
function newId() {
  return globalThis.crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function nyParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(date);
  const out = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const hour = Number(out.hour) === 24 ? 0 : Number(out.hour);
  return { dateKey: `${out.year}-${out.month}-${out.day}`, seconds: hour * 3600 + Number(out.minute) * 60 + Number(out.second) };
}
function todayKey() {
  return nyParts().dateKey;
}
function secondsLeftToday() {
  return Math.max(0, 86400 - nyParts().seconds);
}
function countdown(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
function addDays(dateKey, amount) {
  const [year, month, day] = String(dateKey || todayKey()).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function diffDays(start, end) {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86400000));
}
function seedHistory(days, values) {
  return values.slice(-days).map((value, index) => ({ dateKey: addDays(todayKey(), index - values.length + 1), value }));
}
function makeGoalAction(title, minimumVersion, estimatedMinutes = 25, difficulty = "medium") {
  return { id: newId(), goalId: "", title, frequency: "daily", estimatedMinutes, difficulty, minimumVersion, optionalReminderTime: "", completionHistory: {}, streak: 0 };
}
function normalizeRules(rules = DEFAULT_RULES) {
  const safe = Array.isArray(rules) && rules.length ? rules : DEFAULT_RULES;
  return safe.slice(0, 6).map((rule, index) => ({ id: typeof rule === "string" ? `rule_${index}_${rule.slice(0, 8)}` : rule.id || newId(), label: typeof rule === "string" ? rule : rule.label || DEFAULT_RULES[index], order: index + 1 }));
}
function normalizeRun(run) {
  if (!run) return null;
  const startDateKey = run.startDateKey || todayKey();
  const rules = normalizeRules(run.rules);
  const days = Array.isArray(run.days) && run.days.length ? run.days : [{ dayNumber: 1, dateKey: startDateKey, status: "pending", completedRuleIds: [] }];
  return { ...run, id: run.id || newId(), fastingType: run.fastingType || run.type || "16:8", duration: Number(run.duration) || 7, mission: run.mission || run.why || "", status: run.status || "active", startDateKey, currentDay: Number(run.currentDay) || 1, rules, days: days.map((day) => ({ dayNumber: Number(day.dayNumber) || 1, dateKey: day.dateKey || addDays(startDateKey, (Number(day.dayNumber) || 1) - 1), status: day.status || "pending", completedRuleIds: Array.isArray(day.completedRuleIds) ? day.completedRuleIds : [], wonAt: day.wonAt || null, failedAt: day.failedAt || null })), securedAnimationSeenFor: run.securedAnimationSeenFor || null };
}
function currentDay(run) {
  return run?.days.find((day) => day.dayNumber === run.currentDay) || null;
}
function wonDays(run) {
  return run?.days.filter((day) => day.status === "won").length || 0;
}
function evaluateRuns(runs = { activeRun: null, history: [] }) {
  const history = Array.isArray(runs.history) ? runs.history.map(normalizeRun).filter(Boolean) : [];
  let run = normalizeRun(runs.activeRun);
  if (!run || run.status !== "active") return { activeRun: run, history };
  const today = todayKey();
  let day = currentDay(run);
  while (day && day.dateKey < today) {
    if (day.completedRuleIds.length < 6) {
      day.status = "failed";
      day.failedAt = day.failedAt || new Date().toISOString();
      run = { ...run, status: "failed", failedDay: day.dayNumber, failedAt: day.failedAt };
      return { activeRun: null, history: [run, ...history] };
    }
    day.status = "won";
    day.wonAt = day.wonAt || new Date().toISOString();
    if (run.currentDay >= run.duration) {
      run = { ...run, status: "completed", completedAt: new Date().toISOString() };
      return { activeRun: null, history: [run, ...history] };
    }
    run.currentDay += 1;
    const nextDay = { dayNumber: run.currentDay, dateKey: addDays(run.startDateKey, run.currentDay - 1), status: "pending", completedRuleIds: [], wonAt: null, failedAt: null };
    run.days = [...run.days, nextDay];
    day = nextDay;
  }
  return { activeRun: run, history };
}
function normalizeTodo(todo = {}) {
  return { id: todo.id || newId(), title: String(todo.title || "Untitled action").trim(), description: todo.description || "", category: todo.category || "Growth", phase: todo.phase || "Command", xp: Math.max(5, Math.min(250, Number(todo.xp) || 25)), dueDate: todo.dueDate || "", today: Boolean(todo.today), recurrence: todo.recurrence || "none", status: todo.status === "completed" ? "completed" : "open", completedAt: todo.completedAt || null, completedDateKey: todo.completedDateKey || null, createdAt: todo.createdAt || new Date().toISOString() };
}
function normalizeRewards(rewards = {}) {
  const events = Array.isArray(rewards.events) ? rewards.events.slice(0, 120) : [];
  const todayXp = events.filter((event) => event.dateKey === todayKey()).reduce((sum, event) => sum + (Number(event.amount) || 0), 0);
  return { ...DEFAULT_REWARDS, ...rewards, events, todayXp, totalXp: Math.max(Number(rewards.totalXp) || 0, events.reduce((sum, event) => sum + (Number(event.amount) || 0), 0)), bestStreak: Math.max(Number(rewards.bestStreak) || 0, Number(rewards.streakDays) || 0) };
}
function normalizeGoalAction(action = {}, goalId = "") {
  const history = action.completionHistory && typeof action.completionHistory === "object" ? action.completionHistory : {};
  return { id: action.id || newId(), goalId: action.goalId || goalId, title: action.title || "Daily action", frequency: action.frequency || "daily", estimatedMinutes: Number(action.estimatedMinutes) || 20, difficulty: action.difficulty || "medium", minimumVersion: action.minimumVersion || "Do the smallest faithful version.", completionHistory: history, streak: Number(action.streak) || calculateActionStreak(history), optionalReminderTime: action.optionalReminderTime || "" };
}
function normalizeGoal(goal = {}) {
  const id = goal.id || newId();
  const history = Array.isArray(goal.progressHistory) ? goal.progressHistory : [];
  const linkedDailyActions = Array.isArray(goal.linkedDailyActions) && goal.linkedDailyActions.length ? goal.linkedDailyActions.map((action) => normalizeGoalAction(action, id)) : [normalizeGoalAction(makeGoalAction(`Daily action for ${goal.title || "goal"}`, "Minimum version: 5 honest minutes"), id)];
  return { id, title: goal.title || "New discipline goal", category: goal.category || "Discipline", targetValue: Math.max(1, Number(goal.targetValue) || 10), currentValue: Math.max(0, Number(goal.currentValue) || 0), unit: goal.unit || "sessions", deadline: goal.deadline || addDays(todayKey(), 30), why: goal.why || "Become faithful with the next command.", status: ["active", "paused", "completed"].includes(goal.status) ? goal.status : "active", createdAt: goal.createdAt || todayKey(), linkedDailyActions, progressHistory: history.length ? history : [{ dateKey: todayKey(), value: Math.max(0, Number(goal.currentValue) || 0) }] };
}
function normalizeGoals(goals) {
  const items = Array.isArray(goals?.items) ? goals.items : Array.isArray(goals) ? goals : [];
  return { items: (items.length ? items : DEFAULT_GOALS).map(normalizeGoal) };
}
function normalizeState(raw = {}) {
  const evaluatedRuns = evaluateRuns(raw.runs || { activeRun: raw.activeRun || null, history: raw.history || [] });
  const activeTab = NAV_TABS.some(([id]) => id === raw.ui?.activeTab) ? raw.ui.activeTab : "today";
  return {
    runs: evaluatedRuns,
    ui: { soundEnabled: raw.ui?.soundEnabled !== false, notificationsEnabled: Boolean(raw.ui?.notificationsEnabled), permission: raw.ui?.permission || "default", activeTab },
    xp: { todos: Array.isArray(raw.xp?.todos) ? raw.xp.todos.map(normalizeTodo) : [], rewards: normalizeRewards(raw.xp?.rewards) },
    goals: normalizeGoals(raw.goals),
    plans: raw.plans || { byDate: {} },
    prep: raw.prep || { activePreset: "dailyRule", checklists: {} },
  };
}
function loadLocal() {
  try {
    const primary = localStorage.getItem(STORAGE_KEY);
    if (primary) return normalizeState(JSON.parse(primary));
    for (const key of LEGACY_KEYS) {
      const value = localStorage.getItem(key);
      if (value) return normalizeState(JSON.parse(value));
    }
  } catch {
    return normalizeState({});
  }
  return normalizeState({});
}
function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}
function fastTypeLabel(id) {
  return FAST_TYPES.find(([value]) => value === id)?.[1] || id || "Custom consecration";
}
function goalPercent(goal) {
  return Math.min(100, Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100));
}
function goalPace(goal) {
  const totalDays = Math.max(1, diffDays(goal.createdAt, goal.deadline));
  const elapsed = Math.max(1, diffDays(goal.createdAt, todayKey()));
  const expected = Math.min(goal.targetValue, (elapsed / totalDays) * goal.targetValue);
  const pacePerDay = goal.currentValue / elapsed;
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);
  const projected = pacePerDay > 0 ? addDays(todayKey(), Math.ceil(remaining / pacePerDay)) : "No pace yet";
  const status = goal.currentValue >= expected + goal.targetValue * 0.08 ? "ahead" : goal.currentValue + goal.targetValue * 0.08 < expected ? "behind" : "on-track";
  return { status, projected, requiredDaily: remaining / Math.max(1, diffDays(todayKey(), goal.deadline)), expected };
}
function calculateActionStreak(history = {}) {
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    if (history[addDays(todayKey(), -i)]) streak += 1;
    else break;
  }
  return streak;
}
function goalActionsToday(state) {
  return state.goals.items.flatMap((goal) => goal.status === "active" ? goal.linkedDailyActions.map((action) => ({ ...action, goalId: goal.id, goalTitle: goal.title, category: goal.category, done: Boolean(action.completionHistory?.[todayKey()]) })) : []);
}
function completionRate(state, span = 7) {
  const dates = Array.from({ length: span }, (_, index) => addDays(todayKey(), index - span + 1));
  const strictWins = dates.filter((date) => state.runs.history.some((run) => run.days?.some((day) => day.dateKey === date && day.status === "won"))).length;
  const goalHits = goalActionsToday({ ...state, goals: state.goals }).filter((action) => dates.some((date) => action.completionHistory?.[date])).length;
  const todoHits = state.xp.todos.filter((todo) => todo.completedDateKey && dates.includes(todo.completedDateKey)).length;
  return Math.min(100, Math.round(((strictWins * 2 + goalHits + todoHits) / Math.max(1, span * 3)) * 100));
}
function disciplineScore(state) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const strict = day ? (day.completedRuleIds.length / 6) * 42 : 8;
  const actions = goalActionsToday(state);
  const actionScore = actions.length ? (actions.filter((item) => item.done).length / actions.length) * 26 : 8;
  const xpToday = state.xp.rewards.todayXp ? Math.min(16, state.xp.rewards.todayXp / 8) : 0;
  const streak = Math.min(16, (state.xp.rewards.streakDays || wonDays(run)) * 4);
  return Math.max(0, Math.min(100, Math.round(strict + actionScore + xpToday + streak)));
}
function nextBestAction(state) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  if (!run) return { title: "Begin your fast", description: "Build the rule, name the why, and start the fasting season.", button: "Start Fast", kind: "start" };
  const nextRule = run.rules.find((rule) => !day?.completedRuleIds.includes(rule.id));
  if (nextRule) return { title: nextRule.label, description: "Layer 1 decides whether the day survives.", button: "Complete", kind: "rule", id: nextRule.id };
  const nextGoal = goalActionsToday(state).find((action) => !action.done);
  if (nextGoal) return { title: nextGoal.title, description: nextGoal.minimumVersion, button: "Execute", kind: "goal-action", id: nextGoal.id, goalId: nextGoal.goalId };
  return { title: "Secure the day in prayer", description: "The work is complete. Close with gratitude and watchfulness.", button: "Secure", kind: "secure" };
}
function addReward(state, title, amount, type = "xp") {
  const event = { id: newId(), title, amount, type, dateKey: todayKey(), createdAt: new Date().toISOString() };
  const rewards = normalizeRewards({ ...state.xp.rewards, totalXp: (state.xp.rewards.totalXp || 0) + amount, events: [event, ...(state.xp.rewards.events || [])] });
  return { ...state, xp: { ...state.xp, rewards } };
}

function useTicker() {
  const [seconds, setSeconds] = useState(secondsLeftToday());
  useEffect(() => {
    const timer = setInterval(() => setSeconds(secondsLeftToday()), 1000);
    return () => clearInterval(timer);
  }, []);
  return seconds;
}
function useAudio(enabled) {
  const ctx = useRef(null);
  const unlock = async () => {
    if (!enabled || typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx.current ||= new AudioCtx();
    if (ctx.current.state === "suspended") await ctx.current.resume();
    return ctx.current;
  };
  const play = async (name) => {
    const audio = await unlock();
    if (!audio) return;
    const tones = { check: [440, 660], goal: [520, 780], start: [220, 330, 550], warning: [196, 145], complete: [330, 494, 740] }[name] || [440];
    tones.forEach((freq, index) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, audio.currentTime + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.035, audio.currentTime + index * 0.08 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + index * 0.08 + 0.22);
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + index * 0.08);
      osc.stop(audio.currentTime + index * 0.08 + 0.24);
    });
  };
  return { unlock, play };
}

const GlassCard = ({ children, className = "", delay = 0 }) => {
  const reduce = useReducedMotion();
  return <motion.section initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }} className={cn("glass-card", className)}>{children}</motion.section>;
};
const GradientButton = ({ children, className = "", ...props }) => <motion.button whileTap={{ scale: 0.965 }} type="button" className={cn("gradient-button", className)} {...props}>{children}</motion.button>;
const EmptyState = ({ title, body, action, onAction }) => <GlassCard className="empty-state"><Sparkles className="h-7 w-7 text-cyan-200" /><h3>{title}</h3><p>{body}</p>{action ? <GradientButton onClick={onAction}>{action}</GradientButton> : null}</GlassCard>;
function AppShell({ state, onTab, onSound, children }) {
  const streak = state.xp.rewards.streakDays || wonDays(state.runs.activeRun) || 0;
  return <div className="app-shell">
    <header className="app-header">
      <div className="streak-badge"><Flame className="h-3.5 w-3.5" /><span>{streak}</span></div>
      <div className="brand-title">Fasting Mode</div>
      <div className="header-actions">
        <button type="button" aria-label="Toggle sound" onClick={onSound}>{state.ui.soundEnabled ? <Volume2 /> : <VolumeX />}</button>
        <button type="button" aria-label="Open settings" onClick={() => onTab("settings")}><Settings /></button>
      </div>
    </header>
    <main className="app-main">{children}</main>
    <BottomNav active={state.ui.activeTab} onTab={onTab} />
  </div>;
}
function BottomNav({ active, onTab }) {
  return <nav className="bottom-nav">{NAV_TABS.map(([id, label, Icon]) => <motion.button layout type="button" key={id} onClick={() => onTab(id)} className={cn(active === id && "active")} aria-current={active === id ? "page" : undefined}><Icon className="h-5 w-5" /><span>{label}</span></motion.button>)}</nav>;
}
function CurrentFastCard({ state, seconds, onStart }) {
  const run = state.runs.activeRun;
  const type = run ? fastTypeLabel(run.fastingType) : "Ready to begin";
  const dayText = run ? `Day ${run.currentDay} of ${run.duration} - Ends at midnight` : "No active season - build one now";
  const percent = Math.max(6, Math.min(100, ((86400 - seconds) / 86400) * 100));
  return <GlassCard className="current-fast-card" delay={0.03}>
    <div className="fast-left"><div className="tiny-icon"><CalendarDays /></div><div><div className="eyebrow">Current Fast</div><button type="button" onClick={onStart} className="fast-type">{type}<ChevronRight className="h-4 w-4" /></button><p>{dayText}</p></div></div>
    <div className="fast-right"><div className="eyebrow">Time Until Reset</div><div className="timer-text">{countdown(seconds)}</div><div className="neon-line"><span style={{ width: `${percent}%` }} /></div></div>
  </GlassCard>;
}
function ProgressRing({ value }) {
  const reduce = useReducedMotion();
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return <motion.div className="progress-ring-wrap" initial={reduce ? false : { opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
    <svg viewBox="0 0 240 240" className="progress-ring" role="img" aria-label={`Today's discipline score ${value}%`}>
      <defs><linearGradient id="scoreGradient" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#ffe75a" /><stop offset="34%" stopColor="#caff58" /><stop offset="64%" stopColor="#36f0dc" /><stop offset="100%" stopColor="#2688ff" /></linearGradient></defs>
      <circle className="ring-track" cx="120" cy="120" r={radius} />
      <motion.circle className="ring-progress" cx="120" cy="120" r={radius} stroke="url(#scoreGradient)" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }} />
    </svg>
    <div className="ring-center"><div>Today's Discipline Score</div><strong>{value}%</strong><p>{value >= 72 ? "Strong. Stay the course." : value >= 45 ? "Move now. Recover the day." : "Begin with one faithful command."}</p><span><TrendingUp className="h-3.5 w-3.5" />8% vs yesterday</span></div>
  </motion.div>;
}
function NextBestActionCard({ action, onAction }) {
  return <GlassCard className="next-action-card" delay={0.12}>
    <div className="action-icon"><Zap /></div><div className="next-copy"><div className="eyebrow">Next Best Action</div><h3>{action.title}</h3><p>{action.description}</p></div><GradientButton onClick={onAction}>{action.button}<ArrowRight className="h-4 w-4" /></GradientButton>
  </GlassCard>;
}
function ActionChip({ item, onToggle }) {
  return <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={onToggle} className={cn("action-chip", item.done && "done")}><span className="check-dot">{item.done ? <Check className="h-3.5 w-3.5" /> : null}</span><span><strong>{item.title}</strong><small>{item.subtitle}</small></span></motion.button>;
}
function ActionGroupCard({ icon: Icon, title, count, total, tone, items, onToggle }) {
  return <GlassCard className="action-group-card" delay={0.15}>
    <div className="group-head"><div className={cn("group-icon", tone)}><Icon /></div><div><h3>{title}</h3><span>{count} / {total}</span></div><ChevronRight className="chev" /></div>
    <div className="chip-row">{items.slice(0, 3).map((item) => <ActionChip key={item.id} item={item} onToggle={() => onToggle(item)} />)}</div>
  </GlassCard>;
}
function commitmentGroups(state) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const completed = new Set(day?.completedRuleIds || []);
  const rules = run?.rules?.length ? run.rules : normalizeRules(DEFAULT_RULES);
  const strictItems = rules.slice(0, 3).map((rule) => ({ id: rule.id, kind: "rule", title: rule.label, subtitle: completed.has(rule.id) ? "Completed" : "Required", done: completed.has(rule.id) }));
  const goalItems = goalActionsToday(state).slice(0, 3).map((action) => ({ id: action.id, goalId: action.goalId, kind: "goal-action", title: action.title, subtitle: action.done ? "Completed" : `${action.estimatedMinutes} min`, done: action.done }));
  const recoveryTodos = state.xp.todos.filter((todo) => todo.status === "open" && /recovery|sleep|prayer|health|night/i.test(`${todo.title} ${todo.category} ${todo.phase}`)).slice(0, 2);
  const recoveryItems = (recoveryTodos.length ? recoveryTodos.map((todo) => ({ id: todo.id, kind: "todo", title: todo.title, subtitle: `${todo.xp} XP`, done: false })) : [{ id: "recovery_prayer", kind: "static", title: "Prayer", subtitle: "10 min", done: true }, { id: "recovery_sleep", kind: "static", title: "Early to bed", subtitle: "8 h", done: false }]);
  return [
    { title: "Non-Negotiables", icon: ShieldCheck, tone: "green", count: rules.filter((rule) => completed.has(rule.id)).length, total: 6, items: strictItems },
    { title: "Growth Actions", icon: Leaf, tone: "cyan", count: goalItems.filter((item) => item.done).length, total: Math.max(3, goalItems.length || 3), items: goalItems.length ? goalItems : [{ id: "goal_empty", kind: "static", title: "Create one goal", subtitle: "Goals tab", done: false }] },
    { title: "Recovery", icon: Heart, tone: "pink", count: recoveryItems.filter((item) => item.done).length, total: recoveryItems.length, items: recoveryItems },
  ];
}
function ScriptureCard({ state }) {
  const [ref, quote] = SCRIPTURES[(state.runs.activeRun?.currentDay || 1) % SCRIPTURES.length];
  const mission = state.runs.activeRun?.mission;
  return <GlassCard className="scripture-card" delay={0.18}><div><BookOpen className="h-5 w-5" /><p>{mission || "Discipline is choosing between what you want now and what you want most."}</p><span>{mission ? "Mission statement" : ref}</span></div><div className="sunrise-art" /></GlassCard>;
}
function TodayScreen({ state, seconds, onStart, onToggleRule, onToggleGoalAction, onCompleteTodo }) {
  const score = disciplineScore(state);
  const action = nextBestAction(state);
  const handleAction = () => {
    if (action.kind === "start") onStart();
    if (action.kind === "rule") onToggleRule(action.id);
    if (action.kind === "goal-action") onToggleGoalAction(action.goalId, action.id);
  };
  const handleGroupToggle = (item) => {
    if (item.kind === "rule") onToggleRule(item.id);
    if (item.kind === "goal-action") onToggleGoalAction(item.goalId, item.id);
    if (item.kind === "todo") onCompleteTodo(item.id);
  };
  return <motion.div className="today-screen" initial="hidden" animate="show"><CurrentFastCard state={state} seconds={seconds} onStart={onStart} /><ProgressRing value={score} /><NextBestActionCard action={action} onAction={handleAction} /><section className="commitments-section"><div className="section-label">Today's Commitments</div>{commitmentGroups(state).map((group) => <ActionGroupCard key={group.title} {...group} onToggle={handleGroupToggle} />)}</section><ScriptureCard state={state} /></motion.div>;
}
function GoalProgressChart({ goals }) {
  const series = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(todayKey(), index - 6);
    const values = goals.map((goal) => goal.progressHistory.find((point) => point.dateKey === date)?.value ?? goalPercent(goal) * (0.72 + index * 0.045));
    return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
  });
  const points = series.map((value, index) => `${index * 48 + 12},${112 - value}`).join(" ");
  return <svg className="goal-chart" viewBox="0 0 312 128" role="img" aria-label="Weekly goal progress chart"><defs><linearGradient id="lineGlow" x1="0" x2="1"><stop offset="0%" stopColor="#2fffe2" /><stop offset="100%" stopColor="#3b8cff" /></linearGradient></defs>{[0, 25, 50, 75, 100].map((value) => <line key={value} x1="0" x2="312" y1={112 - value} y2={112 - value} className="chart-grid" />)}<polyline points={points} fill="none" stroke="url(#lineGlow)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{series.map((value, index) => <circle key={index} cx={index * 48 + 12} cy={112 - value} r="5" className="chart-dot" />)}</svg>;
}
function GoalCard({ goal, onToggleAction }) {
  const percent = goalPercent(goal);
  const pace = goalPace(goal);
  const completedToday = goal.linkedDailyActions.filter((action) => action.completionHistory?.[todayKey()]).length;
  return <GlassCard className="goal-card"><div className="goal-top"><div><span className={cn("status-pill", pace.status)}>{pace.status.replace("-", " ")}</span><h3>{goal.title}</h3><p>{goal.why}</p></div><strong>{percent}%</strong></div><div className="mini-bar"><span style={{ width: `${percent}%` }} /></div><div className="goal-meta"><span>{goal.currentValue}/{goal.targetValue} {goal.unit}</span><span>Due {goal.deadline}</span><span>{completedToday}/{goal.linkedDailyActions.length} actions today</span></div><div className="goal-actions-mini">{goal.linkedDailyActions.slice(0, 2).map((action) => <ActionChip key={action.id} item={{ id: action.id, title: action.title, subtitle: action.minimumVersion, done: Boolean(action.completionHistory?.[todayKey()]) }} onToggle={() => onToggleAction(goal.id, action.id)} />)}</div><p className="projection">Projected completion: {pace.projected}</p></GlassCard>;
}
function GoalModal({ onClose, onCreate }) {
  const [draft, setDraft] = useState({ title: "", category: "Focus", targetValue: 21, currentValue: 0, unit: "sessions", deadline: addDays(todayKey(), 30), why: "", action: "Daily execution block" });
  const submit = () => {
    if (!draft.title.trim()) return;
    onCreate(draft);
    onClose();
  };
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="modal-card" initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}><button className="modal-close" onClick={onClose}><X /></button><h2>Create Goal</h2><p>Reverse the goal into a daily action and a minimum version.</p><div className="form-grid"><input placeholder="Goal title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /><input placeholder="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /><input type="number" min="1" value={draft.targetValue} onChange={(event) => setDraft({ ...draft, targetValue: event.target.value })} /><input placeholder="Unit" value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} /><input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} /><input placeholder="Linked daily action" value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })} /><textarea placeholder="Why does this matter before God?" value={draft.why} onChange={(event) => setDraft({ ...draft, why: event.target.value })} /></div><GradientButton onClick={submit}>Create Goal<ArrowRight /></GradientButton></motion.div></motion.div>;
}
function GoalsScreen({ state, onCreateGoal, onToggleGoalAction }) {
  const [open, setOpen] = useState(false);
  const goals = state.goals.items;
  const score = Math.round(goals.reduce((sum, goal) => sum + goalPercent(goal), 0) / Math.max(1, goals.length));
  const counts = goals.reduce((acc, goal) => { acc[goalPace(goal).status] += 1; return acc; }, { "on-track": 0, behind: 0, ahead: 0 });
  return <div className="screen-stack"><ScreenHero eyebrow="Goals Progress" title={`${score}%`} body="Discipline score from active goals, daily actions, and pace against deadlines." icon={Target} action={<GradientButton onClick={() => setOpen(true)}><Plus />New Goal</GradientButton>} /><GlassCard className="floating-chart-card"><div className="chart-head"><div><span>Discipline Score</span><strong>{score}%</strong><p>This Week</p></div><span className="status-pill on-track">On Track</span></div><GoalProgressChart goals={goals} /><div className="status-rows"><span><i className="green" />On Track <b>{counts["on-track"]} goals</b></span><span><i className="yellow" />Behind <b>{counts.behind} goals</b></span><span><i className="cyan" />Ahead <b>{counts.ahead} goals</b></span></div></GlassCard><div className="goal-grid">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} onToggleAction={onToggleGoalAction} />)}</div><AnimatePresence>{open ? <GoalModal onClose={() => setOpen(false)} onCreate={onCreateGoal} /> : null}</AnimatePresence></div>;
}
function HeatmapCalendar({ state, span = 35 }) {
  const dates = Array.from({ length: span }, (_, index) => addDays(todayKey(), index - span + 1));
  return <div className="heatmap"><div className="heat-days">{["S", "M", "T", "W", "T", "F", "S"].map((d, index) => <span key={`${d}-${index}`}>{d}</span>)}</div><div className="heat-grid">{dates.map((date) => {
    const won = state.runs.history.some((run) => run.days?.some((day) => day.dateKey === date && day.status === "won"));
    const goalCount = state.goals.items.flatMap((goal) => goal.linkedDailyActions).filter((action) => action.completionHistory?.[date]).length;
    const todoCount = state.xp.todos.filter((todo) => todo.completedDateKey === date).length;
    const value = won ? 100 : goalCount + todoCount > 2 ? 75 : goalCount + todoCount > 0 ? 50 : 0;
    return <span key={date} className={`heat-${value}`} title={`${date}: ${value}%`} />;
  })}</div></div>;
}
function AnalyticsScreen({ state }) {
  const [range, setRange] = useState("Week");
  const rate = completionRate(state, range === "Week" ? 7 : range === "Month" ? 30 : 365);
  const failed = state.runs.history.filter((run) => run.status === "failed").length + (state.xp.rewards.failedDays || 0);
  const secured = state.runs.history.filter((run) => run.status === "completed" || run.days?.some((day) => day.status === "won")).length + wonDays(state.runs.activeRun);
  const categories = Object.entries(state.goals.items.reduce((acc, goal) => { acc[goal.category] = (acc[goal.category] || 0) + goalPercent(goal); return acc; }, {})).map(([name, value]) => [name, Math.round(value)]);
  return <div className="screen-stack"><ScreenHero eyebrow="Analytics" title={`${rate}%`} body="Completion rate across strict fasts, goals, and XP execution." icon={BarChart3} /><GlassCard className="analytics-card"><div className="segmented">{["Week", "Month", "Year"].map((item) => <button key={item} onClick={() => setRange(item)} className={range === item ? "active" : ""}>{item}</button>)}</div><div className="analytics-main"><div><span>Completion Rate</span><strong>{rate}%</strong><p>{range}</p></div><span className="delta-pill"><TrendingUp />12%</span></div><HeatmapCalendar state={state} /><div className="legend"><span><i className="green" />100%</span><span><i className="cyan" />75%</span><span><i className="yellow" />50%</span><span><i />0%</span></div></GlassCard><div className="stat-grid"><StatCard icon={Flame} label="Current streak" value={state.xp.rewards.streakDays || wonDays(state.runs.activeRun)} /><StatCard icon={Trophy} label="Best streak" value={state.xp.rewards.bestStreak || state.xp.rewards.streakDays || 0} /><StatCard icon={ShieldCheck} label="Days secured" value={secured} /><StatCard icon={AlertTriangle} label="Failed days" value={failed} /></div><GlassCard className="category-card"><h3>Category Breakdown</h3>{categories.length ? categories.map(([name, value]) => <div className="category-row" key={name}><span>{name}</span><div><i style={{ width: `${Math.min(100, value)}%` }} /></div></div>) : <p>No goal categories yet.</p>}</GlassCard></div>;
}
function SettingsScreen({ state, onSound, onReset }) {
  return <div className="screen-stack"><ScreenHero eyebrow="Settings" title="System settings." body="Local-only reliability. Your fast, goals, and progress stay in this browser." icon={Settings} /><GlassCard className="settings-card"><div><h3>Sound feedback</h3><p>Premium tones for completions and warnings.</p></div><GradientButton onClick={onSound}>{state.ui.soundEnabled ? <Volume2 /> : <VolumeX />}Sound {state.ui.soundEnabled ? "On" : "Off"}</GradientButton></GlassCard><GlassCard className="settings-card"><div><h3>Local storage</h3><p>Stored on this iPhone/browser. No Supabase login or cloud dependency.</p></div><button className="ghost-button" onClick={() => saveLocal(state)}><RotateCcw />Save local</button></GlassCard><GlassCard className="danger-zone"><div><h3>Reset local record</h3><p>This clears local fasts, goals, and actions from this browser.</p></div><button onClick={onReset}><Trash2 />Reset</button></GlassCard></div>;
}
function ScreenHero({ eyebrow, title, body, icon: Icon, action }) {
  return <GlassCard className="screen-hero"><div className="hero-icon"><Icon /></div><div className="hero-copy"><span>{eyebrow}</span><h1>{title}</h1><p>{body}</p></div>{action ? <div className="hero-action">{action}</div> : null}</GlassCard>;
}
function StatCard({ icon: Icon = Activity, label, value }) {
  return <GlassCard className="stat-card"><Icon className="h-5 w-5" /><span>{label}</span><strong>{value}</strong></GlassCard>;
}
function FastBuilder({ onCreate, onCancel }) {
  const [step, setStep] = useState(1);
  const [fastingType, setFastingType] = useState("16:8");
  const [duration, setDuration] = useState(7);
  const [customDuration, setCustomDuration] = useState(14);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [mission, setMission] = useState("");
  const finalDuration = duration === "custom" ? Number(customDuration) || 7 : duration;
  const canCreate = rules.every((rule) => rule.trim().length >= 3) && mission.trim().length >= 8;
  const next = () => { setStep((current) => Math.min(5, current + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const back = () => { setStep((current) => Math.max(1, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const create = () => onCreate({ fastingType, duration: finalDuration, rules, mission });
  return <div className="builder-shell"><header className="builder-head"><button onClick={onCancel}>Cancel</button><span>Fast Builder</span><strong>{step}/5</strong></header><GlassCard className="builder-card"><div className="stepper">{[1, 2, 3, 4, 5].map((item) => <span key={item} className={item <= step ? "active" : ""}>{item}</span>)}</div>{step === 1 ? <BuilderStep title="Choose your fast type" subtitle="Popular"><div className="option-grid">{FAST_TYPES.map(([id, title, desc]) => <button key={id} onClick={() => setFastingType(id)} className={cn("builder-option", fastingType === id && "selected")}><div><strong>{title}</strong><span>{desc}</span></div>{fastingType === id ? <Check /> : null}</button>)}</div></BuilderStep> : null}{step === 2 ? <BuilderStep title="Choose fast length" subtitle="Campaign window"><div className="duration-grid">{FAST_LENGTHS.map((days) => <button key={days} onClick={() => setDuration(days)} className={duration === days ? "selected" : ""}><strong>{days}</strong><span>days</span></button>)}<button onClick={() => setDuration("custom")} className={duration === "custom" ? "selected" : ""}><strong>Custom</strong><span>days</span></button></div>{duration === "custom" ? <input type="number" min="1" value={customDuration} onChange={(event) => setCustomDuration(event.target.value)} /> : null}</BuilderStep> : null}{step === 3 ? <BuilderStep title="Define six commitments" subtitle="Layer 1 non-negotiables"><div className="rules-grid">{rules.map((rule, index) => <label key={index}><span>Commitment {index + 1}</span><input value={rule} onChange={(event) => setRules(rules.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}</div></BuilderStep> : null}{step === 4 ? <BuilderStep title="Mission statement" subtitle="Why this fast exists"><textarea placeholder="Lord, I am fasting to seek You with discipline and a clean heart..." value={mission} onChange={(event) => setMission(event.target.value)} /></BuilderStep> : null}{step === 5 ? <BuilderStep title="Confirm the fast" subtitle="Begin soberly"><div className="confirm-list"><span>{fastTypeLabel(fastingType)}</span><span>{finalDuration} days</span><span>Six strict commitments</span><span>{mission || "Mission required"}</span></div></BuilderStep> : null}</GlassCard><div className="builder-actions"><button onClick={back} disabled={step === 1}>Back</button>{step < 5 ? <GradientButton onClick={next}>Continue</GradientButton> : <GradientButton disabled={!canCreate} onClick={create}>Begin Fast</GradientButton>}</div></div>;
}
function BuilderStep({ title, subtitle, children }) {
  return <motion.div initial={{ opacity: 0, y: 18, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}><span className="eyebrow">{subtitle}</span><h1>{title}</h1>{children}</motion.div>;
}

export default function App() {
  const [state, setState] = useState(() => {
    const loaded = normalizeState(loadLocal());
    saveLocal(loaded);
    return loaded;
  });
  const [builderOpen, setBuilderOpen] = useState(false);
  const seconds = useTicker();
  const audio = useAudio(state.ui.soundEnabled);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    const timer = setInterval(() => {
      const current = stateRef.current;
      const runs = evaluateRuns(current.runs);
      if (JSON.stringify(runs) !== JSON.stringify(current.runs)) persist({ ...current, runs });
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  const persist = (next) => {
    const normalized = normalizeState(next);
    setState(normalized);
    saveLocal(normalized);
  };
  const updateUi = (patch) => persist({ ...stateRef.current, ui: { ...stateRef.current.ui, ...patch } });
  const createFast = (payload) => {
    audio.unlock();
    audio.play("start");
    const run = normalizeRun({ id: newId(), ...payload, status: "active", currentDay: 1, startDateKey: todayKey(), days: [{ dayNumber: 1, dateKey: todayKey(), status: "pending", completedRuleIds: [] }] });
    persist({ ...stateRef.current, runs: { ...stateRef.current.runs, activeRun: run }, ui: { ...stateRef.current.ui, activeTab: "today" } });
    setBuilderOpen(false);
  };
  const toggleRule = (ruleId) => {
    audio.play("check");
    const current = stateRef.current;
    const run = current.runs.activeRun;
    const day = currentDay(run);
    if (!run || !day) return;
    const done = day.completedRuleIds.includes(ruleId) ? day.completedRuleIds.filter((id) => id !== ruleId) : [...day.completedRuleIds, ruleId];
    const nextRun = { ...run, days: run.days.map((item) => item.dayNumber === run.currentDay ? { ...item, completedRuleIds: done } : item) };
    let next = { ...current, runs: { ...current.runs, activeRun: nextRun } };
    if (done.length === 6) next = addReward(next, "Strict day secured", 60, "strict");
    persist(next);
  };
  const completeTodo = (todoId) => {
    audio.play("check");
    const current = stateRef.current;
    const todo = current.xp.todos.find((item) => item.id === todoId);
    if (!todo) return;
    const todos = current.xp.todos.map((item) => item.id === todoId ? { ...item, status: "completed", completedAt: new Date().toISOString(), completedDateKey: todayKey(), today: false } : item);
    persist(addReward({ ...current, xp: { ...current.xp, todos } }, todo.title, todo.xp, "todo"));
  };
  const toggleGoalAction = (goalId, actionId) => {
    audio.play("goal");
    const current = stateRef.current;
    const goals = current.goals.items.map((goal) => {
      if (goal.id !== goalId) return goal;
      let changed = false;
      const linkedDailyActions = goal.linkedDailyActions.map((action) => {
        if (action.id !== actionId) return action;
        const history = { ...(action.completionHistory || {}) };
        if (history[todayKey()]) delete history[todayKey()];
        else { history[todayKey()] = true; changed = true; }
        return normalizeGoalAction({ ...action, completionHistory: history }, goal.id);
      });
      const currentValue = Math.max(0, Math.min(goal.targetValue, goal.currentValue + (changed ? 1 : -1)));
      const progressHistory = [{ dateKey: todayKey(), value: Math.round((currentValue / goal.targetValue) * 100) }, ...goal.progressHistory.filter((point) => point.dateKey !== todayKey())].slice(0, 60);
      return normalizeGoal({ ...goal, currentValue, linkedDailyActions, progressHistory, status: currentValue >= goal.targetValue ? "completed" : goal.status });
    });
    persist(addReward({ ...current, goals: { items: goals } }, "Goal action executed", 25, "goal"));
  };
  const createGoal = (draft) => {
    const goal = normalizeGoal({ id: newId(), title: draft.title, category: draft.category, targetValue: draft.targetValue, currentValue: draft.currentValue, unit: draft.unit, deadline: draft.deadline, why: draft.why, status: "active", createdAt: todayKey(), linkedDailyActions: [makeGoalAction(draft.action, "Minimum version: 5 honest minutes", 25, "medium")], progressHistory: [{ dateKey: todayKey(), value: 0 }] });
    persist({ ...stateRef.current, goals: { items: [goal, ...stateRef.current.goals.items] }, ui: { ...stateRef.current.ui, activeTab: "goals" } });
  };
  const resetLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = normalizeState({});
    persist(fresh);
  };
  if (builderOpen) return <FastBuilder onCreate={createFast} onCancel={() => setBuilderOpen(false)} />;
  const active = state.ui.activeTab;
  const screens = {
    today: <TodayScreen state={state} seconds={seconds} onStart={() => setBuilderOpen(true)} onToggleRule={toggleRule} onToggleGoalAction={toggleGoalAction} onCompleteTodo={completeTodo} />,
    goals: <GoalsScreen state={state} onCreateGoal={createGoal} onToggleGoalAction={toggleGoalAction} />,
    analytics: <AnalyticsScreen state={state} />,
    settings: <SettingsScreen state={state} onSound={() => updateUi({ soundEnabled: !state.ui.soundEnabled })} onReset={resetLocal} />,
  };
  return <AppShell state={state} onTab={(tab) => updateUi({ activeTab: tab })} onSound={() => updateUi({ soundEnabled: !state.ui.soundEnabled })}><AnimatePresence mode="wait"><motion.div key={active} initial={{ opacity: 0, y: 18, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -14, filter: "blur(10px)" }} transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}>{screens[active] || screens.today}</motion.div></AnimatePresence></AppShell>;
}
