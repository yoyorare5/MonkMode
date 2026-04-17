import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  Cloud,
  CloudOff,
  Database,
  Flame,
  Lock,
  LogOut,
  RotateCcw,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Trash2,
  User,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";

const STORAGE_KEY = "fasting_mode_cloud_v1";
const LEGACY_KEYS = ["fasting_mode_prod_v1", "monk_mode_prod_v1"];
const TZ = "America/New_York";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);
const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

const DEFAULT_RULES = [
  "Pray before the day begins",
  "Read Scripture with attention",
  "Keep the fasting window",
  "No lust, porn, or compromise",
  "Train the body with discipline",
  "Close the night in gratitude",
];
const DURATIONS = [7, 14, 21, 30, 40];
const FASTING_TYPES = [
  ["sunrise", "Sunrise fast", "Food is laid aside through the day for prayer, Scripture, and watchfulness."],
  ["daniel", "Daniel focus", "Simple food, sober appetite, and a clear heart before the Lord."],
  ["media", "Media abstinence", "Remove noise and distraction so prayer can become primary."],
  ["custom", "Custom consecration", "Define a fast with your pastor, conscience, and health in view."],
];
const SCRIPTURES = [
  ["Matthew 6:17-18", "When you fast, anoint your head and wash your face, that your fasting may not be seen by others but by your Father.", "Practice secrecy today. Let the Father see what no one else needs to applaud."],
  ["Joel 2:12", "Return to me with all your heart, with fasting, with weeping, and with mourning.", "Return with your whole heart. Do not treat the fast as performance."],
  ["Matthew 4:4", "Man shall not live by bread alone, but by every word that comes from the mouth of God.", "When hunger speaks, answer with the Word."],
  ["Isaiah 58:6", "Is not this the fast that I choose: to loose the bonds of wickedness?", "Ask the Lord to expose what must be broken, healed, or surrendered."],
];
const WARNING_LEVELS = [
  ["threeHours", 10800, "Three hours remain", "Return to prayer and close what is still open before midnight."],
  ["oneHour", 3600, "One hour remains", "Keep watch. Bring the remaining commitments before Christ now."],
  ["finalWarning", 900, "Final warning", "The day is nearly closed. Do not leave obedience unfinished."],
];
const DEFAULT_STATE = {
  runs: { activeRun: null, history: [] },
  ui: {
    soundEnabled: true,
    notificationsEnabled: false,
    permission: "default",
    installedPromptDismissed: false,
    sentWarnings: {},
  },
};

const cn = (...classes) => classes.filter(Boolean).join(" ");
const clone = (value) => JSON.parse(JSON.stringify(value));
const newId = () => globalThis.crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const fastType = (id) => FASTING_TYPES.find(([value]) => value === id) || FASTING_TYPES[0];
const maskEmail = (email = "") => (email.includes("@") ? `${email.slice(0, 2)}***@${email.split("@")[1]}` : email);
const vibrate = (pattern = [12]) => globalThis.navigator?.vibrate?.(pattern);

function nyParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const out = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return { dateKey: `${out.year}-${out.month}-${out.day}`, seconds: Number(out.hour) * 3600 + Number(out.minute) * 60 + Number(out.second) };
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
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function normalizeRules(rules = DEFAULT_RULES) {
  return rules.slice(0, 6).map((rule, index) => ({
    id: typeof rule === "string" ? newId() : rule.id || newId(),
    label: typeof rule === "string" ? rule : rule.label || DEFAULT_RULES[index],
    order: index + 1,
  }));
}
function normalizeRun(run) {
  if (!run) return null;
  const startDateKey = run.startDateKey || nyParts().dateKey;
  return {
    ...run,
    id: run.id || newId(),
    duration: Number(run.duration) || 21,
    fastingType: run.fastingType || "sunrise",
    mission: run.mission || "",
    status: run.status || "active",
    currentDay: Number(run.currentDay) || 1,
    startDateKey,
    startedAt: run.startedAt || new Date().toISOString(),
    completedAt: run.completedAt || null,
    failedAt: run.failedAt || null,
    failedDay: run.failedDay || null,
    securedAnimationSeenFor: run.securedAnimationSeenFor || null,
    rules: normalizeRules(run.rules),
    days: (run.days?.length ? run.days : [{ dayNumber: 1, dateKey: startDateKey, status: "pending", completedRuleIds: [] }]).map((day) => ({
      dayNumber: Number(day.dayNumber) || 1,
      dateKey: day.dateKey || startDateKey,
      status: day.status || "pending",
      completedRuleIds: Array.isArray(day.completedRuleIds) ? day.completedRuleIds : [],
      wonAt: day.wonAt || null,
      failedAt: day.failedAt || null,
    })),
  };
}
function normalizeState(raw) {
  const state = raw || DEFAULT_STATE;
  return {
    runs: {
      activeRun: normalizeRun(state.runs?.activeRun),
      history: Array.isArray(state.runs?.history) ? state.runs.history.map(normalizeRun).filter(Boolean) : [],
    },
    ui: {
      ...DEFAULT_STATE.ui,
      ...(state.ui || {}),
      soundEnabled: state.ui?.soundEnabled !== false,
      sentWarnings: state.ui?.sentWarnings || {},
    },
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
    return clone(DEFAULT_STATE);
  }
  return clone(DEFAULT_STATE);
}
function saveLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}
function currentDay(run) {
  return run?.days.find((day) => day.dayNumber === run.currentDay);
}
function wonDays(run) {
  return run?.days.filter((day) => day.status === "won").length || 0;
}
function scriptureFor(run) {
  return SCRIPTURES[((run?.currentDay || 1) - 1) % SCRIPTURES.length];
}
function makeRun({ duration, rules, mission, fastingType }) {
  const dateKey = nyParts().dateKey;
  return {
    id: newId(),
    duration,
    mission: mission.trim(),
    fastingType,
    status: "active",
    currentDay: 1,
    startDateKey: dateKey,
    startedAt: new Date().toISOString(),
    securedAnimationSeenFor: null,
    rules: normalizeRules(rules),
    days: [{ dayNumber: 1, dateKey, status: "pending", completedRuleIds: [] }],
  };
}
function evaluateRuns(runs) {
  if (!runs.activeRun || runs.activeRun.status !== "active") return runs;
  const today = nyParts().dateKey;
  const run = normalizeRun(runs.activeRun);
  let day = currentDay(run);
  while (day && day.dateKey < today) {
    if (day.completedRuleIds.length !== 6) {
      day.status = "failed";
      day.failedAt = new Date().toISOString();
      run.status = "failed";
      run.failedDay = day.dayNumber;
      run.failedAt = day.failedAt;
      return { activeRun: null, history: [run, ...runs.history] };
    }
    day.status = "won";
    day.wonAt ||= new Date().toISOString();
    if (run.currentDay >= run.duration) {
      run.status = "completed";
      run.completedAt = new Date().toISOString();
      return { activeRun: null, history: [run, ...runs.history] };
    }
    run.currentDay += 1;
    const next = { dayNumber: run.currentDay, dateKey: addDays(run.startDateKey, run.currentDay - 1), status: "pending", completedRuleIds: [] };
    if (!run.days.some((item) => item.dayNumber === next.dayNumber)) run.days.push(next);
    day = currentDay(run);
  }
  if (day?.completedRuleIds.length === 6 && day.status !== "won") {
    day.status = "won";
    day.wonAt ||= new Date().toISOString();
  }
  return { activeRun: run, history: runs.history };
}
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

function useAudio(enabled) {
  const ctx = useRef(null);
  const unlock = useCallback(async () => {
    if (!enabled || typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx.current ||= new AudioCtx();
    if (ctx.current.state === "suspended") await ctx.current.resume();
    return ctx.current;
  }, [enabled]);
  const play = useCallback(async (name) => {
    const audio = await unlock();
    if (!audio) return;
    const tones = {
      check: [[330, 0, 0.08], [494, 0.06, 0.12]],
      secured: [[247, 0, 0.16], [370, 0.1, 0.2], [554, 0.22, 0.26]],
      failure: [[196, 0, 0.22], [147, 0.18, 0.34]],
      completion: [[247, 0, 0.18], [330, 0.13, 0.2], [494, 0.28, 0.28], [659, 0.48, 0.4]],
    }[name] || [];
    const now = audio.currentTime;
    tones.forEach(([freq, offset, length]) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.032, now + offset + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + length);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(now + offset);
      osc.stop(now + offset + length + 0.03);
    });
  }, [unlock]);
  return useMemo(() => ({ unlock, play }), [play, unlock]);
}
async function registerWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}
async function showNotification(level) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const [, , title, body] = level;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: `fasting-${level[0]}`,
      requireInteraction: level[0] === "finalWarning",
      data: { url: "/" },
    });
  } catch {
    new Notification(title, { body });
  }
}

const Button = ({ className = "", children, ...props }) => (
  <button className={cn("inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50", className)} {...props}>{children}</button>
);
const Panel = ({ className = "", children }) => <div className={cn("rounded-[28px] border border-blue-400/15 bg-white/[0.055] shadow-[0_18px_80px_rgba(0,0,0,.42)] backdrop-blur-xl", className)}>{children}</div>;
const Badge = ({ className = "", children }) => <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", className)}>{children}</span>;
const Input = (props) => <input className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/40" {...props} />;
const Textarea = ({ className = "", ...props }) => <textarea className={cn("min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/40", className)} {...props} />;
function Shell({ children }) {
  return <div className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,.22),transparent_32%),linear-gradient(to_bottom,#02040a,#050916_48%,#02040a)]" /><div className="relative min-h-dvh px-[max(18px,env(safe-area-inset-left))] pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))]">{children}</div></div>;
}
function Brand() {
  return <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl border border-blue-300/20 bg-blue-500/10 text-blue-200"><Flame className="h-5 w-5" /></div><div><div className="text-sm font-semibold uppercase tracking-[.28em] text-blue-200">Fasting Mode</div><div className="text-xs text-slate-500">Synced consecration</div></div></div>;
}
function TopBar({ user, sync, ui, onSound, onSettings }) {
  const Icon = sync.status === "synced" ? Cloud : sync.status === "error" ? WifiOff : CloudOff;
  return <div className="sticky top-0 z-30 -mx-2 mb-4 rounded-b-[28px] border-b border-white/10 bg-[#02040a]/80 px-2 py-3 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Brand /><div className="flex items-center gap-2">{user ? <Badge className="hidden border border-white/10 bg-white/[.04] text-slate-300 sm:inline-flex"><Icon className="mr-2 h-3.5 w-3.5" />{sync.label}</Badge> : null}<button onClick={onSound} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300">{ui.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>{user ? <button onClick={onSettings} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300"><Settings className="h-4 w-4" /></button> : null}</div></div></div>;
}
function SectionTitle({ icon: Icon, title, subtitle }) {
  return <div className="flex items-start gap-3"><div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-3 text-blue-200"><Icon className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}</div></div>;
}

function Auth({ onSignIn, onSignUp, onLocal, loading, message, ui, onSound }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async () => {
    setError("");
    const result = mode === "signup" ? await onSignUp(form) : await onSignIn(form);
    if (result?.error) setError(result.error);
    if (result?.message) setError(result.message);
  };
  return <Shell><TopBar ui={ui} sync={{}} onSound={onSound} /><main className="mx-auto grid min-h-[calc(100dvh-96px)] max-w-6xl gap-8 py-5 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><section><Badge className="mb-5 border border-blue-300/20 bg-blue-500/10 text-blue-100">Real account and cloud sync</Badge><h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">Keep the fast before Christ on every device.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Supabase Auth carries your mission, commitments, history, settings, and reminder preferences across iPhone and desktop.</p></section><Panel className="p-5 sm:p-6"><div className="mb-6 flex rounded-2xl border border-white/10 bg-white/[.035] p-1">{[["signin", "Sign in"], ["signup", "Create account"]].map(([value, label]) => <button key={value} onClick={() => setMode(value)} className={cn("min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold", mode === value ? "bg-blue-600 text-white" : "text-slate-400")}>{label}</button>)}</div>{!supabaseReady ? <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify to enable real auth. Device-only mode still works.</div> : null}{mode === "signup" ? <label className="mb-4 block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Name</span><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label> : null}<label className="mb-4 block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Email</span><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Password</span><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{error || message ? <div className="mt-4 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm text-blue-100">{error || message}</div> : null}<Button onClick={submit} disabled={loading || !supabaseReady} className="mt-6 w-full bg-blue-600 text-white">{mode === "signup" ? "Create account" : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button><Button onClick={onLocal} className="mt-3 w-full border border-white/10 bg-white/[.04] text-slate-300">Continue on this device</Button></Panel></main></Shell>;
}
function Onboarding({ onCreate, onCancel }) {
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(21);
  const [fastingType, setFastingType] = useState("sunrise");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [mission, setMission] = useState("");
  const canCreate = mission.trim().length >= 12 && rules.every((rule) => rule.trim().length >= 3);
  return <Shell><main className="mx-auto max-w-4xl pb-28"><div className="mb-5 flex items-center justify-between"><Brand /><Button onClick={onCancel} className="border border-white/10 bg-white/[.04] text-slate-300">Cancel</Button></div><Panel className="p-5 sm:p-6"><SectionTitle icon={step === 1 ? CalendarDays : step === 2 ? Target : BookOpen} title={step === 1 ? "Choose the season" : step === 2 ? "Define six commitments" : "Write the reason"} subtitle="Keep the fast sober, concrete, and Christward." />{step === 1 ? <><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{DURATIONS.map((days) => <button key={days} onClick={() => setDuration(days)} className={cn("min-h-20 rounded-2xl border px-4 text-left", duration === days ? "border-blue-300/35 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><div className="text-2xl font-semibold">{days}</div><div className="text-xs uppercase tracking-[.2em] text-slate-500">days</div></button>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{FASTING_TYPES.map(([id, title, description]) => <button key={id} onClick={() => setFastingType(id)} className={cn("rounded-2xl border p-4 text-left", fastingType === id ? "border-blue-300/35 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><div className="font-semibold">{title}</div><div className="mt-2 text-sm leading-6 text-slate-400">{description}</div></button>)}</div></> : null}{step === 2 ? <div className="mt-6 grid gap-3">{rules.map((rule, index) => <label key={index}><span className="mb-2 block text-xs uppercase tracking-[.2em] text-slate-500">Commitment {index + 1}</span><Input value={rule} onChange={(event) => setRules(rules.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}</div> : null}{step === 3 ? <><Textarea value={mission} onChange={(event) => setMission(event.target.value)} className="mt-6" placeholder="Lord Jesus, I am fasting to seek You with an undivided heart..." /><div className="mt-4 rounded-2xl border border-blue-300/15 bg-blue-500/5 p-4 text-sm leading-6 text-slate-400">Name the fast before God. Do not make it performance.</div></> : null}</Panel><div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#02040a]/90 px-[max(18px,env(safe-area-inset-left))] pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"><div className="mx-auto flex max-w-4xl gap-3"><Button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="flex-1 border border-white/10 bg-white/[.04] text-slate-300">Back</Button>{step < 3 ? <Button onClick={() => setStep(step + 1)} className="flex-[1.4] bg-blue-600 text-white">Continue</Button> : <Button disabled={!canCreate} onClick={() => onCreate({ duration, rules, mission, fastingType })} className="flex-[1.4] bg-blue-600 text-white">Lock the Fast</Button>}</div></div></main></Shell>;
}
function HistoryPanel({ history }) {
  if (!history.length) return <Panel className="p-5"><SectionTitle icon={Database} title="History" subtitle="Completed and failed fasts will appear here." /><p className="mt-4 text-sm leading-6 text-slate-500">The record begins when a fast is secured, completed, or broken.</p></Panel>;
  return <Panel className="p-5"><SectionTitle icon={Database} title="History" subtitle="A sober record, not a scoreboard." /><div className="mt-5 grid gap-3">{history.slice(0, 4).map((run) => <div key={run.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center justify-between gap-3"><div className="font-semibold">{run.status === "completed" ? "Completed fast" : "Broken fast"}</div><Badge className={run.status === "completed" ? "border border-blue-300/20 bg-blue-500/10 text-blue-100" : "border border-red-400/20 bg-red-500/10 text-red-200"}>{run.duration} days</Badge></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{run.mission || "No mission recorded."}</p></div>)}</div></Panel>;
}
function SettingsModal({ user, state, sync, onClose, onSound, onNotify, onReset, onReload, onSignOut }) {
  const support = "Notification" in window && "serviceWorker" in navigator;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-md"><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#050816] p-5"><div className="mb-5 flex items-start justify-between"><div><div className="text-xs uppercase tracking-[.32em] text-blue-200/80">Settings</div><h2 className="mt-2 text-2xl font-semibold">Account and watchfulness</h2></div><button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.04]"><X className="h-4 w-4" /></button></div><div className="grid gap-4"><Panel className="p-5 shadow-none"><SectionTitle icon={ShieldCheck} title="Account" subtitle={user?.email || "Device-only mode"} /><div className="mt-4 flex items-center gap-2 text-sm leading-6 text-slate-400"><User className="h-4 w-4" />{sync.message}</div></Panel><Panel className="p-5 shadow-none"><SectionTitle icon={Bell} title="Reminders" subtitle="Warnings at three hours, one hour, and final warning." /><p className="mt-4 text-sm leading-6 text-slate-400">{support ? "iPhone push works best from the installed home-screen app. This pass stores standards-based push subscriptions for production delivery and also sends app-side warnings while the app is open." : "Notifications are not supported in this browser."}</p><Button disabled={!support} onClick={onNotify} className="mt-4 w-full bg-blue-600 text-white">{state.ui.notificationsEnabled ? "Disable reminders" : "Enable reminders"}</Button></Panel><Panel className="p-5 shadow-none"><SectionTitle icon={Database} title="Reliability" subtitle="Cloud sync with local cache fallback." /><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button onClick={onSound} className="border border-white/10 bg-white/[.04] text-slate-200">{state.ui.soundEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}Sound {state.ui.soundEnabled ? "on" : "off"}</Button><Button onClick={onReload} className="border border-white/10 bg-white/[.04] text-slate-200"><RotateCcw className="mr-2 h-4 w-4" />Reload cloud</Button><Button onClick={onReset} className="border border-white/10 bg-white/[.04] text-slate-200 sm:col-span-2"><Trash2 className="mr-2 h-4 w-4" />Reset local cache</Button></div></Panel><Button onClick={onSignOut} className="w-full border border-red-400/20 bg-red-500/10 text-red-200"><LogOut className="mr-2 h-4 w-4" />Sign out</Button></div></motion.div></div>;
}

function Dashboard({ user, state, sync, onStart, onUpdateRun, onUpdateUi, onSettings, audio }) {
  const run = state.runs.activeRun;
  const day = run ? currentDay(run) : null;
  const done = day?.completedRuleIds.length || 0;
  const complete = Boolean(run && day && done === 6);
  const [ref, verse, prompt] = run ? scriptureFor(run) : SCRIPTURES[0];
  const [, typeTitle] = run ? fastType(run.fastingType) : ["", "No active fast", ""];
  const [seconds, setSeconds] = useState(secondsLeftToday());
  const [secured, setSecured] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(secondsLeftToday()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!run || !day || !state.ui.notificationsEnabled || done >= 6) return;
    const sent = state.ui.sentWarnings[day.dateKey] || [];
    const due = [...WARNING_LEVELS].reverse().find(([id, threshold]) => seconds <= threshold && !sent.includes(id));
    if (!due) return;
    showNotification(due);
    onUpdateUi({ sentWarnings: { ...state.ui.sentWarnings, [day.dateKey]: [...sent, due[0]] } });
  }, [day, done, onUpdateUi, run, seconds, state.ui.notificationsEnabled, state.ui.sentWarnings]);
  useEffect(() => {
    if (!run || !day || !complete || run.securedAnimationSeenFor === day.dayNumber) return;
    setSecured(true);
    audio.play("secured");
    onUpdateRun({ ...run, securedAnimationSeenFor: day.dayNumber });
    const timer = setTimeout(() => setSecured(false), 2200);
    return () => clearTimeout(timer);
  }, [audio, complete, day, onUpdateRun, run]);
  const toggle = useCallback((ruleId) => {
    if (!run || !day || complete) return;
    audio.unlock();
    audio.play("check");
    vibrate();
    onUpdateRun({
      ...run,
      days: run.days.map((item) => item.dayNumber === run.currentDay
        ? { ...item, completedRuleIds: item.completedRuleIds.includes(ruleId) ? item.completedRuleIds.filter((id) => id !== ruleId) : [...item.completedRuleIds, ruleId] }
        : item),
    });
  }, [audio, complete, day, onUpdateRun, run]);

  if (!run) {
    return <Shell><TopBar user={user} sync={sync} ui={state.ui} onSound={() => onUpdateUi({ soundEnabled: !state.ui.soundEnabled })} onSettings={onSettings} /><main className="mx-auto grid min-h-[calc(100dvh-96px)] max-w-6xl items-center gap-8 py-5 lg:grid-cols-[1fr_.9fr]"><section><Badge className="mb-5 border border-blue-300/20 bg-blue-500/10 text-blue-100">Prayer. Fasting. Obedience.</Badge><h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">Begin a fast that stays synced, serious, and close at hand.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Choose a season, define six daily commitments, keep your reason visible, and receive warnings before the day closes.</p><Button onClick={onStart} className="mt-8 w-full bg-blue-600 text-white sm:w-auto">Start Fasting Mode<ArrowRight className="ml-2 h-4 w-4" /></Button></section><div className="space-y-5"><Panel className="p-5"><SectionTitle icon={Cloud} title="Synced record" subtitle={sync.message} /><div className="mt-5 grid grid-cols-3 gap-3">{[["Archived", state.runs.history.length], ["Completed", state.runs.history.filter((item) => item.status === "completed").length], ["Sound", state.ui.soundEnabled ? "On" : "Off"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs uppercase tracking-[.2em] text-slate-500">{label}</div><div className="mt-2 text-xl font-semibold">{value}</div></div>)}</div></Panel><HistoryPanel history={state.runs.history} /></div></main></Shell>;
  }

  return <Shell><TopBar user={user} sync={sync} ui={state.ui} onSound={() => onUpdateUi({ soundEnabled: !state.ui.soundEnabled })} onSettings={onSettings} /><main className="mx-auto max-w-6xl pb-6"><div className="mb-5 flex flex-wrap gap-2"><Badge className="border border-white/10 bg-white/[.045] text-slate-300">{user?.name}</Badge><Badge className="border border-blue-300/20 bg-blue-500/10 text-blue-100">{maskEmail(user?.email)}</Badge><Badge className="border border-white/10 bg-white/[.045] text-slate-300">{typeTitle}</Badge></div><div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]"><section className="space-y-5">{!state.ui.installedPromptDismissed ? <Panel className="p-4"><div className="flex items-start gap-3"><Smartphone className="mt-1 h-5 w-5 text-blue-200" /><div className="flex-1"><div className="text-sm font-semibold">Add Fasting Mode to your iPhone home screen.</div><p className="mt-1 text-sm leading-6 text-slate-400">Open Share, choose Add to Home Screen, and keep the fast one tap away.</p></div><button onClick={() => onUpdateUi({ installedPromptDismissed: true })} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.04]"><X className="h-4 w-4" /></button></div></Panel> : null}<Panel className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="text-xs uppercase tracking-[.32em] text-slate-500">Current fast</div><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Day {run.currentDay} of {run.duration}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{complete ? "The day is kept. Stay quiet, grateful, and watchful." : "Keep the commitments before midnight in New York."}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-right"><div className="text-xs uppercase tracking-[.26em] text-slate-500">Days kept</div><div className="mt-1 text-2xl font-semibold">{wonDays(run)}</div></div></div><div className="mt-7 rounded-[30px] border border-blue-300/15 bg-[#030712] p-5 text-center"><div className="text-xs uppercase tracking-[.34em] text-blue-200/80">Time left today</div><div className="mt-4 text-5xl font-semibold sm:text-7xl">{countdown(seconds)}</div><div className="mt-3 text-sm text-slate-500">Daily reset at midnight New York time</div></div><div className="mt-6 grid grid-cols-3 gap-3">{[["Today", `${done}/6`], ["Fast", `${Math.round(((run.currentDay - 1 + done / 6) / run.duration) * 100)}%`], ["Status", complete ? "Kept" : "Open"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-3"><div className="text-xs uppercase tracking-[.2em] text-slate-500">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>)}</div></Panel><Panel className="p-5 sm:p-6"><SectionTitle icon={Target} title="Today's commitments" subtitle="Clear all six before the day closes." /><div className="mt-6 grid gap-3">{run.rules.map((rule) => <button key={rule.id} onClick={() => toggle(rule.id)} className={cn("flex min-h-16 items-center justify-between rounded-2xl border p-4 text-left", day.completedRuleIds.includes(rule.id) ? "border-blue-300/25 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><span className="text-sm font-semibold leading-6">{rule.label}</span>{day.completedRuleIds.includes(rule.id) ? <Check className="h-5 w-5 text-blue-100" /> : <Lock className="h-5 w-5 text-slate-500" />}</button>)}</div></Panel></section><aside className="space-y-5"><Panel className="p-5"><SectionTitle icon={BookOpen} title="Scripture for the fast" subtitle={ref} /><blockquote className="mt-4 text-base leading-7 text-slate-200">"{verse}"</blockquote><div className="mt-4 rounded-2xl border border-blue-300/15 bg-blue-500/5 p-4 text-sm leading-6 text-slate-400">{prompt}</div></Panel><Panel className="p-5"><SectionTitle icon={Flame} title="Why I am fasting" subtitle={typeTitle} /><div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm leading-7 text-slate-300">{run.mission}</div></Panel><Panel className="p-5"><SectionTitle icon={CalendarDays} title="Fast timeline" subtitle="Kept, current, and unstarted days." /><div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-8">{Array.from({ length: run.duration }, (_, index) => index + 1).map((number) => { const item = run.days.find((entry) => entry.dayNumber === number); return <div key={number} className={cn("grid aspect-square place-items-center rounded-xl border text-xs font-semibold", item?.status === "won" && "border-blue-300/20 bg-blue-500/10 text-blue-200", item?.status === "failed" && "border-red-400/20 bg-red-500/10 text-red-300", number === run.currentDay && item?.status !== "won" && "border-white/20 bg-white/[.07]", !item && "border-white/10 bg-white/[.03] text-slate-500")}>{number}</div>; })}</div></Panel><HistoryPanel history={state.runs.history} /></aside></div></main><AnimatePresence>{secured ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-[#02040a]/74 p-4 backdrop-blur-md"><div className="rounded-[34px] border border-blue-300/20 bg-[#071022]/92 px-7 py-8 text-center"><Sparkles className="mx-auto h-10 w-10 text-blue-200" /><div className="mt-5 text-xs uppercase tracking-[.34em] text-blue-200/80">Day secured</div><div className="mt-2 text-3xl font-semibold">Kept before the Lord.</div></div></motion.div> : null}</AnimatePresence></Shell>;
}

export default function App() {
  const [state, setState] = useState(() => loadLocal());
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("loading");
  const [settings, setSettings] = useState(false);
  const [localMode, setLocalMode] = useState(!supabaseReady);
  const [sync, setSync] = useState({ status: supabaseReady ? "syncing" : "local", label: supabaseReady ? "Syncing" : "Device", message: supabaseReady ? "Connecting to Supabase." : "Device-only fallback." });
  const [authMessage, setAuthMessage] = useState("");
  const stateRef = useRef(state);
  const audio = useAudio(state.ui.soundEnabled);

  useEffect(() => { stateRef.current = state; }, [state]);
  const user = useMemo(() => {
    if (session?.user) return { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name || session.user.email?.split("@")[0] };
    if (localMode) return { id: "local", name: "Local device", email: "device mode" };
    return null;
  }, [localMode, session]);
  const persist = useCallback(async (next) => {
    const normalized = normalizeState(next);
    setState(normalized);
    saveLocal(normalized);
    if (!session?.user || !supabaseReady) {
      setSync({ status: "local", label: "Device", message: "Saved on this device." });
      return;
    }
    try {
      setSync({ status: "syncing", label: "Saving", message: "Syncing with Supabase." });
      const { error } = await supabase.from("fasting_state").upsert({ user_id: session.user.id, state: normalized, updated_at: new Date().toISOString() });
      if (error) throw error;
      setSync({ status: "synced", label: "Synced", message: "Cloud sync is current." });
    } catch (error) {
      setSync({ status: "error", label: "Offline", message: error.message || "Cloud sync failed. Local cache is preserved." });
    }
  }, [session]);
  const loadCloud = useCallback(async (nextSession) => {
    if (!nextSession?.user || !supabaseReady) {
      setScreen(localMode ? "app" : "auth");
      return;
    }
    try {
      setSync({ status: "syncing", label: "Loading", message: "Loading your cloud fast." });
      const { data, error } = await supabase.from("fasting_state").select("state").eq("user_id", nextSession.user.id).maybeSingle();
      if (error) throw error;
      const local = loadLocal();
      const cloud = data?.state ? normalizeState(data.state) : local;
      const evaluated = normalizeState({ ...cloud, runs: evaluateRuns(cloud.runs) });
      if (!data?.state) await supabase.from("fasting_state").upsert({ user_id: nextSession.user.id, state: evaluated, updated_at: new Date().toISOString() });
      setState(evaluated);
      saveLocal(evaluated);
      setScreen("app");
      setSync({ status: "synced", label: data?.state ? "Synced" : "Migrated", message: data?.state ? "Cloud sync is current." : "Local fast moved into cloud sync." });
    } catch (error) {
      setState(loadLocal());
      setScreen("app");
      setSync({ status: "error", label: "Offline", message: error.message || "Using local cache." });
    }
  }, [localMode]);

  useEffect(() => {
    registerWorker();
    if (!supabaseReady) {
      setScreen("app");
      return undefined;
    }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthMessage(error.message);
      setSession(data.session);
      loadCloud(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setLocalMode(false);
        loadCloud(nextSession);
      } else {
        setScreen("auth");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadCloud]);
  useEffect(() => {
    if (screen !== "app") return undefined;
    const timer = setInterval(() => {
      const current = stateRef.current;
      const before = current.runs.activeRun;
      const runs = evaluateRuns(current.runs);
      if (JSON.stringify(runs) === JSON.stringify(current.runs)) return;
      const archived = before && !runs.activeRun ? runs.history.find((run) => run.id === before.id) : null;
      if (archived?.status === "completed") audio.play("completion");
      if (archived?.status === "failed") audio.play("failure");
      persist({ ...current, runs });
    }, 30000);
    return () => clearInterval(timer);
  }, [audio, persist, screen]);

  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : { ok: true };
  };
  const signUp = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) return { error: error.message };
    if (!data.session) return { message: "Account created. Confirm your email if required, then sign in." };
    return { ok: true };
  };
  const updateUi = (patch) => persist({ ...stateRef.current, ui: { ...stateRef.current.ui, ...patch } });
  const toggleSound = () => {
    const enabled = !stateRef.current.ui.soundEnabled;
    if (enabled) audio.unlock();
    updateUi({ soundEnabled: enabled });
  };
  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    updateUi({ notificationsEnabled: enabled, permission });
    if (!enabled) return;
    await registerWorker();
    if (!session?.user || !supabaseReady || !VAPID_PUBLIC_KEY || !("PushManager" in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
      await supabase.from("push_subscriptions").upsert({ user_id: session.user.id, endpoint: subscription.endpoint, subscription: subscription.toJSON(), enabled: true, last_seen_at: new Date().toISOString() }, { onConflict: "endpoint" });
    } catch (error) {
      setSync({ status: "error", label: "Push saved locally", message: error.message || "Notification permission is on, but push subscription was not stored." });
    }
  };
  const disableNotifications = async () => {
    updateUi({ notificationsEnabled: false });
    if (session?.user && supabaseReady) await supabase.from("push_subscriptions").update({ enabled: false }).eq("user_id", session.user.id);
  };
  const create = (payload) => {
    audio.unlock();
    setScreen("app");
    persist({ ...stateRef.current, runs: { ...stateRef.current.runs, activeRun: makeRun(payload) } });
  };
  const updateRun = (run) => persist({ ...stateRef.current, runs: evaluateRuns({ activeRun: run, history: stateRef.current.runs.history }) });
  const resetLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(clone(DEFAULT_STATE));
    setSettings(false);
    setSync({ status: session?.user ? "synced" : "local", label: session?.user ? "Cloud kept" : "Device", message: session?.user ? "Local cache cleared. Cloud record remains available." : "Local cache cleared." });
  };

  if (screen === "loading") return <Shell><div className="grid min-h-dvh place-items-center text-slate-400">Loading Fasting Mode...</div></Shell>;
  if (screen === "auth" || !user) return <Auth onSignIn={signIn} onSignUp={signUp} onLocal={() => { setLocalMode(true); setScreen("app"); }} loading={false} message={authMessage} ui={state.ui} onSound={toggleSound} />;
  if (screen === "onboarding") return <Onboarding onCreate={create} onCancel={() => setScreen("app")} />;
  return <><Dashboard user={user} state={state} sync={sync} onStart={() => setScreen("onboarding")} onUpdateRun={updateRun} onUpdateUi={updateUi} onSettings={() => setSettings(true)} audio={audio} />{settings ? <SettingsModal user={user} state={state} sync={sync} onClose={() => setSettings(false)} onSound={toggleSound} onNotify={state.ui.notificationsEnabled ? disableNotifications : enableNotifications} onReset={resetLocal} onReload={() => loadCloud(session)} onSignOut={async () => { if (supabaseReady && session) await supabase.auth.signOut(); setSession(null); setLocalMode(!supabaseReady); setSettings(false); setScreen(supabaseReady ? "auth" : "app"); }} /> : null}</>;
}
