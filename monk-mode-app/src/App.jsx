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
  ["dayStarted", 54000, "Nothing has moved", "The day has begun. Pray, choose the first command, and start before drift takes ground."],
  ["threeHours", 10800, "Three hours remain", "Return to prayer and close what is still open before midnight."],
  ["oneHour", 3600, "One hour remains", "Keep watch. Bring the remaining commitments before Christ now."],
  ["finalWarning", 900, "Final warning", "The day is nearly closed. Do not leave obedience unfinished."],
];
const COMMAND_TABS = [
  ["today", "Today", Target],
  ["inbox", "Inbox", Database],
  ["plan", "Plan", CalendarDays],
  ["rewards", "Rewards", Sparkles],
  ["settings", "Settings", Settings],
];
const PREP_PRESETS = [
  {
    id: "school",
    title: "School day",
    description: "Classes, study blocks, and phone discipline before pressure arrives.",
    night: ["Pack bag and clothes", "Set tomorrow's fasting window", "Choose study block and prayer time", "Charge phone outside the bed"],
    morning: ["Pray before checking phone", "Read the assigned Scripture", "Review the top three commands", "Leave with water and plan visible"],
    tasks: [
      ["Review class work", "School", 45],
      ["Complete one study block", "School", 55],
      ["Pack tomorrow before bed", "Prep", 25],
    ],
  },
  {
    id: "gym",
    title: "Gym day",
    description: "Train hard, stay sober, and keep appetite under obedience.",
    night: ["Lay out training clothes", "Plan meal boundaries", "Set water and electrolytes", "Name the weakest hour"],
    morning: ["Pray before training", "Warm up deliberately", "Keep music clean", "Close with gratitude"],
    tasks: [
      ["Complete training session", "Body", 60],
      ["Prepare clean food", "Discipline", 35],
      ["Walk ten minutes after dinner", "Body", 25],
    ],
  },
  {
    id: "church",
    title: "Church day",
    description: "Arrive prepared, serve quietly, and listen before speaking.",
    night: ["Prepare clothes and Bible", "Pray for pastor and church", "Set giving or service intention", "Sleep early"],
    morning: ["Read before leaving", "Serve one person quietly", "Take one sermon note to obey", "Protect the afternoon from noise"],
    tasks: [
      ["Pray for church leadership", "Prayer", 30],
      ["Write one sermon obedience point", "Faith", 35],
      ["Serve without being seen", "Service", 45],
    ],
  },
  {
    id: "outreach",
    title: "Outreach/work day",
    description: "Execute the work, keep your witness clean, and do not negotiate with distraction.",
    night: ["Define first work block", "Clear one distraction source", "Prepare outreach or work materials", "Set a check-in prayer"],
    morning: ["Start with prayer", "Open the first work block", "Send the needed message", "Refuse idle scrolling"],
    tasks: [
      ["Complete first work block", "Work", 60],
      ["Send the important message", "Execution", 35],
      ["Make one faithful contact", "Outreach", 45],
    ],
  },
  {
    id: "recovery",
    title: "Recovery/reset day",
    description: "Recover without compromise. Reset the room, the mind, and the schedule.",
    night: ["Write the reset reason", "Prepare a simple morning", "Remove one trigger", "Set sleep boundary"],
    morning: ["Pray slowly", "Clean one space", "Walk without phone", "Choose the first simple task"],
    tasks: [
      ["Clean one space", "Reset", 35],
      ["Walk without phone", "Body", 30],
      ["Write a sober reflection", "Reflection", 40],
    ],
  },
];
const ACHIEVEMENTS = [
  ["first_command", "First command executed", "One task obeyed without delay", (r) => r.events.some((event) => event.type === "todo")],
  ["watchman", "Watchman", "Three warning windows answered", (r) => r.events.filter((event) => event.type === "warning_ack").length >= 3],
  ["three_day_streak", "Three-day streak", "Three secured days in sequence", (r) => r.streakDays >= 3],
  ["one_thousand", "One thousand XP", "A serious body of work recorded", (r) => r.totalXp >= 1000],
  ["perfect_day", "Perfect day", "Strict commitments and top priorities completed", (r) => r.perfectDays >= 1],
];
const DEFAULT_REWARDS = {
  totalXp: 0,
  todayXp: 0,
  streakDays: 0,
  comboCount: 0,
  perfectDays: 0,
  achievements: [],
  events: [],
  lastCompletionAt: null,
  lastCompletionDayKey: null,
  lastSecuredDayKey: null,
  lastEarlyBonusDayKey: null,
  lastStreakDayKey: null,
  lastPerfectDayKey: null,
};
const DEFAULT_STATE = {
  runs: { activeRun: null, history: [] },
  ui: {
    soundEnabled: true,
    notificationsEnabled: false,
    permission: "default",
    installedPromptDismissed: false,
    sentWarnings: {},
    activeTab: "today",
    lastXpToast: null,
  },
  xp: { todos: [], rewards: DEFAULT_REWARDS },
  plans: { byDate: {} },
  prep: { activePreset: "school", checklists: {} },
};

const cn = (...classes) => classes.filter(Boolean).join(" ");
const clone = (value) => JSON.parse(JSON.stringify(value));
const newId = () => globalThis.crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const fastType = (id) => FASTING_TYPES.find(([value]) => value === id) || FASTING_TYPES[0];
const presetById = (id) => PREP_PRESETS.find((preset) => preset.id === id) || PREP_PRESETS[0];
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
const todayKey = () => nyParts().dateKey;
const secondsLeftToday = () => Math.max(0, 86400 - nyParts().seconds);
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
  const safe = Array.isArray(rules) && rules.length ? rules : DEFAULT_RULES;
  return safe.slice(0, 6).map((rule, index) => ({
    id: typeof rule === "string" ? newId() : rule.id || newId(),
    label: typeof rule === "string" ? rule : rule.label || DEFAULT_RULES[index] || `Commitment ${index + 1}`,
    order: index + 1,
  }));
}
function normalizeRun(run) {
  if (!run) return null;
  const startDateKey = run.startDateKey || todayKey();
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
function normalizeTodo(todo = {}) {
  const recurrence = ["none", "daily", "weekly"].includes(todo.recurrence) ? todo.recurrence : "none";
  return {
    id: todo.id || newId(),
    title: String(todo.title || "Untitled command").trim() || "Untitled command",
    description: todo.description || "",
    category: todo.category || "Command",
    xp: Math.max(5, Math.min(250, Number(todo.xp) || 35)),
    dueDate: todo.dueDate || "",
    today: Boolean(todo.today),
    recurrence,
    status: todo.status === "completed" ? "completed" : "open",
    createdAt: todo.createdAt || new Date().toISOString(),
    completedAt: todo.completedAt || null,
    completedDateKey: todo.completedDateKey || null,
    lastGeneratedFrom: todo.lastGeneratedFrom || null,
  };
}
function normalizeRewards(rewards = {}) {
  const events = Array.isArray(rewards.events) ? rewards.events.slice(0, 80).map((event) => ({
    id: event.id || newId(),
    type: event.type || "xp",
    title: event.title || "XP recorded",
    amount: Number(event.amount) || 0,
    dateKey: event.dateKey || todayKey(),
    createdAt: event.createdAt || new Date().toISOString(),
  })) : [];
  const achievements = Array.isArray(rewards.achievements) ? rewards.achievements.map((item) => ({
    id: typeof item === "string" ? item : item.id,
    title: typeof item === "string" ? (ACHIEVEMENTS.find(([id]) => id === item)?.[1] || item) : item.title,
    unlockedAt: typeof item === "string" ? new Date().toISOString() : item.unlockedAt || new Date().toISOString(),
  })).filter((item) => item.id) : [];
  const next = {
    ...DEFAULT_REWARDS,
    ...rewards,
    events,
    achievements,
    totalXp: Math.max(0, Number(rewards.totalXp) || events.reduce((sum, event) => sum + Math.max(0, event.amount), 0)),
    streakDays: Math.max(0, Number(rewards.streakDays) || 0),
    comboCount: Math.max(0, Number(rewards.comboCount) || 0),
    perfectDays: Math.max(0, Number(rewards.perfectDays) || 0),
  };
  next.todayXp = events.filter((event) => event.dateKey === todayKey()).reduce((sum, event) => sum + event.amount, 0);
  return resolveAchievements(next);
}
function normalizePlan(plan = {}, dateKey = todayKey()) {
  return {
    dateKey: plan.dateKey || dateKey,
    topTaskIds: Array.isArray(plan.topTaskIds) ? plan.topTaskIds.slice(0, 3).filter(Boolean) : [],
    firstTaskId: plan.firstTaskId || "",
    dangerPoint: plan.dangerPoint || "",
    intention: plan.intention || "",
    presetId: plan.presetId || "school",
    lockedAt: plan.lockedAt || null,
  };
}
function makeChecklist(presetId) {
  const preset = presetById(presetId);
  return {
    presetId: preset.id,
    night: preset.night.map((label) => ({ id: newId(), label, done: false })),
    morning: preset.morning.map((label) => ({ id: newId(), label, done: false })),
  };
}
function normalizeChecklist(checklist, presetId) {
  const fallback = makeChecklist(presetId);
  return {
    presetId: checklist?.presetId || fallback.presetId,
    night: (checklist?.night?.length ? checklist.night : fallback.night).map((item) => ({ id: item.id || newId(), label: item.label || "Prepare faithfully", done: Boolean(item.done) })),
    morning: (checklist?.morning?.length ? checklist.morning : fallback.morning).map((item) => ({ id: item.id || newId(), label: item.label || "Launch cleanly", done: Boolean(item.done) })),
  };
}
function normalizeState(raw) {
  const state = raw || DEFAULT_STATE;
  const checklists = Object.fromEntries(Object.entries(state.prep?.checklists || {}).map(([dateKey, checklist]) => [dateKey, normalizeChecklist(checklist, checklist?.presetId || state.prep?.activePreset || "school")]));
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
      activeTab: COMMAND_TABS.some(([id]) => id === state.ui?.activeTab) ? state.ui.activeTab : "today",
    },
    xp: {
      todos: Array.isArray(state.xp?.todos) ? state.xp.todos.map(normalizeTodo) : [],
      rewards: normalizeRewards(state.xp?.rewards),
    },
    plans: {
      byDate: Object.fromEntries(Object.entries(state.plans?.byDate || {}).map(([dateKey, plan]) => [dateKey, normalizePlan(plan, dateKey)])),
    },
    prep: {
      activePreset: presetById(state.prep?.activePreset).id,
      checklists,
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
  const dateKey = todayKey();
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
  const today = todayKey();
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
function resolveAchievements(rewards) {
  const existing = new Set((rewards.achievements || []).map((item) => item.id));
  const unlocked = [...(rewards.achievements || [])];
  ACHIEVEMENTS.forEach(([id, title, description, test]) => {
    if (!existing.has(id) && test(rewards)) unlocked.push({ id, title, description, unlockedAt: new Date().toISOString() });
  });
  return { ...rewards, achievements: unlocked };
}
function addRewardEvent(rewards, event) {
  const dateKey = event.dateKey || todayKey();
  const fullEvent = { id: newId(), dateKey, createdAt: new Date().toISOString(), ...event, amount: Math.max(0, Number(event.amount) || 0) };
  const next = {
    ...normalizeRewards(rewards),
    totalXp: (Number(rewards.totalXp) || 0) + fullEvent.amount,
    events: [fullEvent, ...(rewards.events || [])].slice(0, 80),
  };
  next.todayXp = next.events.filter((item) => item.dateKey === todayKey()).reduce((sum, item) => sum + item.amount, 0);
  return resolveAchievements(next);
}
function awardStrictBonuses(state) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  if (!run || !day || day.completedRuleIds.length !== 6) return state;
  let next = normalizeState(state);
  const rewards = next.xp.rewards;
  if (rewards.lastSecuredDayKey !== day.dateKey) {
    const streak = Math.max(wonDays(run), 1);
    let updatedRewards = addRewardEvent({ ...rewards, lastSecuredDayKey: day.dateKey, lastStreakDayKey: day.dateKey, streakDays: Math.max(rewards.streakDays, streak) }, {
      type: "day_secured",
      title: "Strict day secured",
      amount: 60,
      dateKey: day.dateKey,
    });
    if (streak > 1) {
      updatedRewards = addRewardEvent(updatedRewards, {
        type: "streak",
        title: `${streak}-day fasting streak`,
        amount: Math.min(100, streak * 8),
        dateKey: day.dateKey,
      });
    }
    next = { ...next, xp: { ...next.xp, rewards: updatedRewards } };
  }
  if (nyParts().seconds < 18 * 3600 && next.xp.rewards.lastEarlyBonusDayKey !== day.dateKey) {
    next = { ...next, xp: { ...next.xp, rewards: addRewardEvent({ ...next.xp.rewards, lastEarlyBonusDayKey: day.dateKey }, { type: "early", title: "Strict commitments finished early", amount: 40, dateKey: day.dateKey }) } };
  }
  return checkPerfectDay(next);
}
function checkPerfectDay(state) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const dateKey = todayKey();
  const plan = state.plans.byDate[dateKey];
  const topIds = plan?.topTaskIds?.filter(Boolean) || [];
  if (!run || !day || day.completedRuleIds.length !== 6 || topIds.length < 3 || state.xp.rewards.lastPerfectDayKey === dateKey) return state;
  const allTopDone = topIds.every((id) => state.xp.todos.some((todo) => todo.id === id && todo.status === "completed" && todo.completedDateKey === dateKey));
  if (!allTopDone) return state;
  const rewards = addRewardEvent({ ...state.xp.rewards, perfectDays: state.xp.rewards.perfectDays + 1, lastPerfectDayKey: dateKey }, {
    type: "perfect",
    title: "Perfect day completed",
    amount: 150,
    dateKey,
  });
  return { ...state, xp: { ...state.xp, rewards } };
}
function nextDueDate(recurrence, dateKey = todayKey()) {
  if (recurrence === "daily") return addDays(dateKey, 1);
  if (recurrence === "weekly") return addDays(dateKey, 7);
  return "";
}
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}
function calculateDanger(state, seconds = secondsLeftToday()) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const done = day?.completedRuleIds.length || 0;
  const remaining = run ? 6 - done : 0;
  const elapsed = 86400 - seconds;
  const dateKey = todayKey();
  const sent = state.ui.sentWarnings[dateKey] || [];
  const plan = state.plans.byDate[dateKey];
  const topIds = plan?.topTaskIds?.filter(Boolean) || [];
  const completedTop = topIds.filter((id) => state.xp.todos.some((todo) => todo.id === id && todo.status === "completed" && todo.completedDateKey === dateKey)).length;
  const todayOpen = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === dateKey));
  if (run && remaining > 0 && (seconds <= 3600 || sent.includes("finalWarning"))) {
    return { level: "critical", label: "Critical", color: "red", copy: "The fast is in the red zone. Close obedience now.", remaining, completedTop, topIds, todayOpen };
  }
  if (run && remaining > 0 && (seconds <= 10800 || (elapsed >= 14 * 3600 && done === 0))) {
    return { level: "danger", label: "Danger", color: "amber", copy: "Pressure is rising. The next strict commitment comes first.", remaining, completedTop, topIds, todayOpen };
  }
  if ((run && remaining > 0 && elapsed >= 12 * 3600) || (topIds.length > 0 && completedTop === 0 && elapsed >= 13 * 3600)) {
    return { level: "caution", label: "Caution", color: "blue", copy: "Do not drift. Move before the day gets loud.", remaining, completedTop, topIds, todayOpen };
  }
  return { level: "safe", label: "Safe", color: "blue", copy: "The day is on pace. Keep watch and execute cleanly.", remaining, completedTop, topIds, todayOpen };
}
function getNextAction(state, danger) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const dateKey = todayKey();
  const tomorrow = addDays(dateKey, 1);
  if (!run) return { kind: "start-fast", eyebrow: "No active fast", title: "Begin the fast", body: "Open a consecrated season before Christ.", cta: "Start Fasting Mode" };
  const incompleteRule = run.rules.find((rule) => !day?.completedRuleIds.includes(rule.id));
  if (incompleteRule && ["caution", "danger", "critical"].includes(danger.level)) {
    return { kind: "commitment", id: incompleteRule.id, eyebrow: danger.label, title: `Complete: ${incompleteRule.label}`, body: "Strict commitments decide whether the day survives.", cta: "Mark commitment" };
  }
  const todayPlan = state.plans.byDate[dateKey];
  const firstTask = todayPlan?.firstTaskId ? state.xp.todos.find((todo) => todo.id === todayPlan.firstTaskId && todo.status === "open") : null;
  if (firstTask) return { kind: "todo", id: firstTask.id, eyebrow: "First waking task", title: firstTask.title, body: "You already decided this. Execute it cleanly.", cta: `Complete +${firstTask.xp} XP` };
  const plannedTask = (todayPlan?.topTaskIds || []).map((id) => state.xp.todos.find((todo) => todo.id === id && todo.status === "open")).find(Boolean);
  if (plannedTask) return { kind: "todo", id: plannedTask.id, eyebrow: "Locked priority", title: plannedTask.title, body: "Finish the priority before adding more noise.", cta: `Complete +${plannedTask.xp} XP` };
  const todayTask = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === dateKey)).sort((a, b) => b.xp - a.xp)[0];
  if (todayTask) return { kind: "todo", id: todayTask.id, eyebrow: "Next command", title: todayTask.title, body: "Take the next faithful action in front of you.", cta: `Complete +${todayTask.xp} XP` };
  if (incompleteRule) return { kind: "commitment", id: incompleteRule.id, eyebrow: "Strict layer", title: incompleteRule.label, body: "Finish the fasting commitment before the day closes.", cta: "Mark commitment" };
  if (!state.plans.byDate[tomorrow]) return { kind: "plan", eyebrow: "Tomorrow open", title: "Lock tomorrow before sleep", body: "Decide the day before the day tries to decide you.", cta: "Open lock plan" };
  return { kind: "prayer", eyebrow: "Day kept", title: "Finish in prayer", body: "Close quietly. Give thanks. Keep the heart low before Christ.", cta: "Acknowledge" };
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
      xp: [[392, 0, 0.07], [587, 0.05, 0.1]],
      warning: [[220, 0, 0.1], [165, 0.09, 0.18]],
    }[name] || [];
    const now = audio.currentTime;
    tones.forEach(([freq, offset, length]) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(name === "warning" ? 0.045 : 0.032, now + offset + 0.025);
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
  <button type="button" className={cn("inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50", className)} {...props}>{children}</button>
);
const Panel = ({ className = "", children }) => <div className={cn("rounded-[28px] border border-blue-400/15 bg-white/[0.055] shadow-[0_18px_80px_rgba(0,0,0,.42)] backdrop-blur-xl", className)}>{children}</div>;
const Badge = ({ className = "", children }) => <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", className)}>{children}</span>;
const Input = (props) => <input className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/40" {...props} />;
const Textarea = ({ className = "", ...props }) => <textarea className={cn("min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/40", className)} {...props} />;
function Shell({ children }) {
  return <div className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,.22),transparent_32%),linear-gradient(to_bottom,#02040a,#050916_48%,#02040a)]" /><div className="relative min-h-dvh px-[max(16px,env(safe-area-inset-left))] pb-[max(18px,env(safe-area-inset-bottom))] pt-[max(14px,env(safe-area-inset-top))]">{children}</div></div>;
}
function Brand() {
  return <div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-blue-300/20 bg-blue-500/10 text-blue-200"><Flame className="h-5 w-5" /></div><div className="min-w-0"><div className="truncate text-sm font-semibold uppercase tracking-[.28em] text-blue-200">Fasting Mode</div><div className="truncate text-xs text-slate-500">Christ-centered command system</div></div></div>;
}
function TopBar({ user, sync, ui, onSound, onTab }) {
  const Icon = sync.status === "synced" ? Cloud : sync.status === "error" ? WifiOff : CloudOff;
  return <div className="sticky top-0 z-30 -mx-2 mb-4 rounded-b-[28px] border-b border-white/10 bg-[#02040a]/82 px-2 py-3 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Brand /><div className="flex shrink-0 items-center gap-2">{user ? <Badge className="hidden border border-white/10 bg-white/[.04] text-slate-300 sm:inline-flex"><Icon className="mr-2 h-3.5 w-3.5" />{sync.label}</Badge> : null}<button type="button" onClick={onSound} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300">{ui.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>{user ? <button type="button" onClick={() => onTab("settings")} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300"><Settings className="h-4 w-4" /></button> : null}</div></div></div>;
}
function SectionTitle({ icon: Icon, title, subtitle }) {
  return <div className="flex items-start gap-3"><div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-3 text-blue-200"><Icon className="h-5 w-5" /></div><div className="min-w-0"><h2 className="text-lg font-semibold">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}</div></div>;
}
function StatCard({ label, value, tone = "default" }) {
  return <div className={cn("min-w-0 rounded-2xl border p-3", tone === "danger" ? "border-red-400/20 bg-red-500/10" : "border-white/10 bg-white/[.035]")}><div className="truncate text-[0.68rem] uppercase tracking-[.14em] text-slate-500">{label}</div><div className="mt-2 min-w-0 truncate text-2xl font-semibold">{value}</div></div>;
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
  return <Shell><TopBar ui={ui} sync={{}} onSound={onSound} /><main className="mx-auto grid min-h-[calc(100dvh-96px)] max-w-6xl gap-8 py-5 lg:grid-cols-[1.05fr_.95fr] lg:items-center"><section><Badge className="mb-5 border border-blue-300/20 bg-blue-500/10 text-blue-100">Real account and cloud sync</Badge><h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">Command the fast from every device.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Sign in to carry strict commitments, XP commands, lock plans, rewards, and reminders between iPhone and desktop.</p></section><Panel className="p-5 sm:p-6"><div className="mb-6 flex rounded-2xl border border-white/10 bg-white/[.035] p-1">{[["signin", "Sign in"], ["signup", "Create account"]].map(([value, label]) => <button type="button" key={value} onClick={() => setMode(value)} className={cn("min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold", mode === value ? "bg-blue-600 text-white" : "text-slate-400")}>{label}</button>)}</div>{!supabaseReady ? <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify to enable real auth. Device-only mode still works.</div> : null}{mode === "signup" ? <label className="mb-4 block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Name</span><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label> : null}<label className="mb-4 block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Email</span><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Password</span><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{error || message ? <div className="mt-4 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm text-blue-100">{error || message}</div> : null}<Button onClick={submit} disabled={loading || !supabaseReady} className="mt-6 w-full bg-blue-600 text-white">{mode === "signup" ? "Create account" : "Sign in"}<ArrowRight className="ml-2 h-4 w-4" /></Button><Button onClick={onLocal} className="mt-3 w-full border border-white/10 bg-white/[.04] text-slate-300">Continue on this device</Button></Panel></main></Shell>;
}
function Onboarding({ onCreate, onCancel }) {
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(21);
  const [fastingType, setFastingType] = useState("sunrise");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [mission, setMission] = useState("");
  const canCreate = mission.trim().length >= 12 && rules.every((rule) => rule.trim().length >= 3);
  return <Shell><main className="mx-auto max-w-4xl pb-28"><div className="mb-5 flex items-center justify-between gap-3"><Brand /><Button onClick={onCancel} className="border border-white/10 bg-white/[.04] text-slate-300">Cancel</Button></div><Panel className="p-5 sm:p-6"><SectionTitle icon={step === 1 ? CalendarDays : step === 2 ? Target : BookOpen} title={step === 1 ? "Choose the season" : step === 2 ? "Define six commitments" : "Write the reason"} subtitle="Keep the fast sober, concrete, and Christward." />{step === 1 ? <><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{DURATIONS.map((days) => <button type="button" key={days} onClick={() => setDuration(days)} className={cn("min-h-20 rounded-2xl border px-4 text-left", duration === days ? "border-blue-300/35 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><div className="text-2xl font-semibold">{days}</div><div className="text-xs uppercase tracking-[.2em] text-slate-500">days</div></button>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{FASTING_TYPES.map(([id, title, description]) => <button type="button" key={id} onClick={() => setFastingType(id)} className={cn("rounded-2xl border p-4 text-left", fastingType === id ? "border-blue-300/35 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><div className="font-semibold">{title}</div><div className="mt-2 text-sm leading-6 text-slate-400">{description}</div></button>)}</div></> : null}{step === 2 ? <div className="mt-6 grid gap-3">{rules.map((rule, index) => <label key={index}><span className="mb-2 block text-xs uppercase tracking-[.2em] text-slate-500">Commitment {index + 1}</span><Input value={rule} onChange={(event) => setRules(rules.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}</div> : null}{step === 3 ? <><Textarea value={mission} onChange={(event) => setMission(event.target.value)} className="mt-6" placeholder="Lord Jesus, I am fasting to seek You with an undivided heart..." /><div className="mt-4 rounded-2xl border border-blue-300/15 bg-blue-500/5 p-4 text-sm leading-6 text-slate-400">Name the fast before God. Do not make it performance.</div></> : null}</Panel><div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#02040a]/90 px-[max(18px,env(safe-area-inset-left))] pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"><div className="mx-auto flex max-w-4xl gap-3"><Button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="flex-1 border border-white/10 bg-white/[.04] text-slate-300">Back</Button>{step < 3 ? <Button onClick={() => setStep(step + 1)} className="flex-[1.4] bg-blue-600 text-white">Continue</Button> : <Button disabled={!canCreate} onClick={() => onCreate({ duration, rules, mission, fastingType })} className="flex-[1.4] bg-blue-600 text-white">Lock the Fast</Button>}</div></div></main></Shell>;
}
function BottomNav({ active, onTab }) {
  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#02040a]/92 px-[max(10px,env(safe-area-inset-left))] pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 rounded-[24px] border border-white/10 bg-white/[.035] p-1">{COMMAND_TABS.map(([id, label, Icon]) => <button type="button" key={id} onClick={() => onTab(id)} className={cn("flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[18px] text-[0.68rem] font-semibold transition", active === id ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,.24)]" : "text-slate-500")}><Icon className="h-4 w-4" /><span>{label}</span></button>)}</div></nav>;
}
function HistoryPanel({ history }) {
  if (!history.length) return <Panel className="p-5"><SectionTitle icon={Database} title="History" subtitle="Completed and failed fasts will appear here." /><p className="mt-4 text-sm leading-6 text-slate-500">The record begins when a fast is secured, completed, or broken.</p></Panel>;
  return <Panel className="p-5"><SectionTitle icon={Database} title="History" subtitle="A sober record, not a scoreboard." /><div className="mt-5 grid gap-3">{history.slice(0, 4).map((run) => <div key={run.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center justify-between gap-3"><div className="font-semibold">{run.status === "completed" ? "Completed fast" : "Broken fast"}</div><Badge className={run.status === "completed" ? "border border-blue-300/20 bg-blue-500/10 text-blue-100" : "border border-red-400/20 bg-red-500/10 text-red-200"}>{run.duration} days</Badge></div><p className="mt-2 text-sm leading-6 text-slate-400">{run.mission || "No mission recorded."}</p></div>)}</div></Panel>;
}
function DangerMeter({ danger, seconds }) {
  const colors = {
    safe: "border-blue-300/20 bg-blue-500/10 text-blue-100",
    caution: "border-sky-300/20 bg-sky-500/10 text-sky-100",
    danger: "border-amber-300/25 bg-amber-500/10 text-amber-100",
    critical: "border-red-300/30 bg-red-500/12 text-red-100",
  };
  const progress = Math.max(4, Math.min(100, ((86400 - seconds) / 86400) * 100));
  return <motion.div animate={danger.level === "critical" ? { boxShadow: ["0 0 0 rgba(239,68,68,0)", "0 0 34px rgba(239,68,68,.22)", "0 0 0 rgba(239,68,68,0)"] } : {}} transition={{ duration: 1.6, repeat: danger.level === "critical" ? Infinity : 0 }} className={cn("rounded-[28px] border p-5", colors[danger.level])}><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[.28em] opacity-75">Danger meter</div><div className="mt-2 text-3xl font-semibold">{danger.label}</div><p className="mt-2 text-sm leading-6 opacity-80">{danger.copy}</p></div><ShieldCheck className="h-7 w-7 shrink-0" /></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-current transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[.18em] opacity-70"><span>{countdown(seconds)} left</span><span>{danger.remaining} strict open</span></div></motion.div>;
}
function NextActionCard({ action, onAction }) {
  return <Panel className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[.3em] text-blue-200/80">Do this now</div><h2 className="mt-2 text-2xl font-semibold leading-tight">{action.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{action.body}</p></div><Badge className="border border-blue-300/20 bg-blue-500/10 text-blue-100">{action.eyebrow}</Badge></div><motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}><Button onClick={onAction} className="mt-5 w-full bg-blue-600 text-white">{action.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button></motion.div></Panel>;
}
function CommitmentList({ run, day, onToggle }) {
  if (!run || !day) return null;
  return <Panel className="p-5 sm:p-6"><SectionTitle icon={Target} title="Strict commitments" subtitle="Layer 1. These decide whether the day survives." /><div className="mt-6 grid gap-3">{run.rules.map((rule) => {
    const checked = day.completedRuleIds.includes(rule.id);
    return <motion.button type="button" key={rule.id} layout onClick={() => onToggle(rule.id)} className={cn("flex min-h-16 items-center justify-between rounded-2xl border p-4 text-left transition", checked ? "border-blue-300/25 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><span className="text-sm font-semibold leading-6">{rule.label}</span>{checked ? <Check className="h-5 w-5 text-blue-100" /> : <Lock className="h-5 w-5 text-slate-500" />}</motion.button>;
  })}</div></Panel>;
}
function XpTaskList({ title, subtitle, tasks, onComplete, onToday, empty }) {
  return <Panel className="p-5"><SectionTitle icon={Database} title={title} subtitle={subtitle} />{tasks.length ? <div className="mt-5 grid gap-3">{tasks.map((task) => <motion.div layout key={task.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-semibold leading-6">{task.title}</div>{task.description ? <p className="mt-1 text-sm leading-6 text-slate-400">{task.description}</p> : null}<div className="mt-3 flex flex-wrap gap-2"><Badge className="border border-white/10 bg-white/[.04] text-slate-300">{task.category}</Badge><Badge className="border border-blue-300/20 bg-blue-500/10 text-blue-100">+{task.xp} XP</Badge>{task.dueDate ? <Badge className="border border-white/10 bg-white/[.04] text-slate-400">Due {task.dueDate}</Badge> : null}{task.recurrence !== "none" ? <Badge className="border border-white/10 bg-white/[.04] text-slate-400">{task.recurrence}</Badge> : null}</div></div><Button onClick={() => onComplete(task.id)} className="shrink-0 bg-blue-600 text-white">Done</Button></div>{!task.today && onToday ? <Button onClick={() => onToday(task.id)} className="mt-3 w-full border border-white/10 bg-white/[.04] text-slate-300">Send to Today</Button> : null}</motion.div>)}</div> : <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm leading-6 text-slate-500">{empty}</div>}</Panel>;
}
function TodayScreen({ user, state, seconds, danger, action, onStart, onPrimaryAction, onToggleRule, onCompleteTodo, onSendToday, onUpdateUi }) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const done = day?.completedRuleIds.length || 0;
  const complete = Boolean(run && day && done === 6);
  const [ref, verse, prompt] = run ? scriptureFor(run) : SCRIPTURES[0];
  const [, typeTitle] = run ? fastType(run.fastingType) : ["", "No active fast", ""];
  const dateKey = todayKey();
  const todayTasks = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === dateKey));
  if (!run) {
    return <div className="grid gap-5 lg:grid-cols-[1fr_.85fr]"><section className="space-y-5"><Panel className="p-5 sm:p-6"><Badge className="mb-5 border border-blue-300/20 bg-blue-500/10 text-blue-100">Prayer. Fasting. Execution.</Badge><h1 className="text-4xl font-semibold leading-[1.03] tracking-tight sm:text-6xl">Begin a fast with a command system around it.</h1><p className="mt-5 text-base leading-7 text-slate-400">Layer 1 is the strict fast. Layer 2 is the XP execution system that keeps life moving without confusing tasks with obedience.</p><Button onClick={onStart} className="mt-7 w-full bg-blue-600 text-white sm:w-auto">Start Fasting Mode<ArrowRight className="ml-2 h-4 w-4" /></Button></Panel><NextActionCard action={action} onAction={onPrimaryAction} /></section><aside className="space-y-5"><Panel className="p-5"><SectionTitle icon={Cloud} title="Synced record" subtitle="Device and cloud state are ready for command data." /><div className="mt-5 grid grid-cols-3 gap-3"><StatCard label="Archived" value={state.runs.history.length} /><StatCard label="Today XP" value={state.xp.rewards.todayXp} /><StatCard label="Sound" value={state.ui.soundEnabled ? "On" : "Off"} /></div></Panel><XpTaskList title="Today commands" subtitle="Layer 2 work can start before a fast is active." tasks={todayTasks} onComplete={onCompleteTodo} onToday={onSendToday} empty="No XP commands are marked for today." /></aside></div>;
  }
  return <div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]"><section className="space-y-5">{!state.ui.installedPromptDismissed ? <Panel className="p-4"><div className="flex items-start gap-3"><Smartphone className="mt-1 h-5 w-5 text-blue-200" /><div className="flex-1"><div className="text-sm font-semibold">Add Fasting Mode to your iPhone home screen.</div><p className="mt-1 text-sm leading-6 text-slate-400">Open Share, choose Add to Home Screen, and keep the fast one tap away.</p></div><button type="button" onClick={() => onUpdateUi({ installedPromptDismissed: true })} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.04]"><X className="h-4 w-4" /></button></div></Panel> : null}<Panel className="p-5 sm:p-6"><div className="mb-5 flex flex-wrap gap-2"><Badge className="border border-white/10 bg-white/[.045] text-slate-300">{user?.name}</Badge><Badge className="border border-blue-300/20 bg-blue-500/10 text-blue-100">{maskEmail(user?.email)}</Badge><Badge className="border border-white/10 bg-white/[.045] text-slate-300">{typeTitle}</Badge></div><div className="flex items-start justify-between gap-3"><div><div className="text-xs uppercase tracking-[.32em] text-slate-500">Current fast</div><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Day {run.currentDay} of {run.duration}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{complete ? "The day is kept. Stay quiet, grateful, and watchful." : "Strict commitments close before midnight New York time."}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-right"><div className="text-xs uppercase tracking-[.18em] text-slate-500">Kept</div><div className="mt-1 text-2xl font-semibold">{wonDays(run)}</div></div></div><div className="mt-6 rounded-[30px] border border-blue-300/15 bg-[#030712] p-5 text-center"><div className="text-xs uppercase tracking-[.28em] text-blue-200/80">Time left today</div><div className="mt-4 text-5xl font-semibold sm:text-7xl">{countdown(seconds)}</div><div className="mt-3 text-sm text-slate-500">Daily reset at midnight New York time</div></div><div className="mt-6 grid grid-cols-3 gap-3"><StatCard label="Strict" value={`${done}/6`} /><StatCard label="Fast" value={`${Math.round(((run.currentDay - 1 + done / 6) / run.duration) * 100)}%`} /><StatCard label="Status" value={complete ? "Kept" : "Open"} tone={danger.level === "critical" ? "danger" : "default"} /></div></Panel><DangerMeter danger={danger} seconds={seconds} /><NextActionCard action={action} onAction={onPrimaryAction} /><CommitmentList run={run} day={day} onToggle={onToggleRule} /><XpTaskList title="Today XP commands" subtitle="Layer 2. These build momentum without deciding the fast." tasks={todayTasks} onComplete={onCompleteTodo} onToday={onSendToday} empty="No XP commands are active today. Capture one in Inbox or lock tomorrow in Plan." /></section><aside className="space-y-5"><Panel className="p-5"><SectionTitle icon={BookOpen} title="Scripture for the fast" subtitle={ref} /><blockquote className="mt-4 text-base leading-7 text-slate-200">"{verse}"</blockquote><div className="mt-4 rounded-2xl border border-blue-300/15 bg-blue-500/5 p-4 text-sm leading-6 text-slate-400">{prompt}</div></Panel><Panel className="p-5"><SectionTitle icon={Flame} title="Why I am fasting" subtitle={typeTitle} /><div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm leading-7 text-slate-300">{run.mission}</div></Panel><Panel className="p-5"><SectionTitle icon={CalendarDays} title="Fast timeline" subtitle="Kept, current, and unstarted days." /><div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-8">{Array.from({ length: run.duration }, (_, index) => index + 1).map((number) => { const item = run.days.find((entry) => entry.dayNumber === number); return <div key={number} className={cn("grid aspect-square place-items-center rounded-xl border text-xs font-semibold", item?.status === "won" && "border-blue-300/20 bg-blue-500/10 text-blue-200", item?.status === "failed" && "border-red-400/20 bg-red-500/10 text-red-300", number === run.currentDay && item?.status !== "won" && "border-white/20 bg-white/[.07]", !item && "border-white/10 bg-white/[.03] text-slate-500")}>{number}</div>; })}</div></Panel><HistoryPanel history={state.runs.history} /></aside></div>;
}
function InboxScreen({ state, onCreateTodo, onCompleteTodo, onSendToday }) {
  const [draft, setDraft] = useState({ title: "", description: "", category: "Command", xp: 35, dueDate: "", today: true, recurrence: "none" });
  const create = () => {
    if (!draft.title.trim()) return;
    onCreateTodo(draft);
    setDraft({ title: "", description: "", category: draft.category, xp: 35, dueDate: "", today: true, recurrence: "none" });
  };
  const open = state.xp.todos.filter((todo) => todo.status === "open");
  const completed = state.xp.todos.filter((todo) => todo.status === "completed").slice(0, 6);
  return <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="space-y-5"><Panel className="p-5"><SectionTitle icon={Database} title="XP Todo Inbox" subtitle="Layer 2. Capture work fast, then command the day without clutter." /><div className="mt-5 grid gap-3"><Input placeholder="Brain dump a command..." value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") create(); }} /><Textarea className="min-h-20" placeholder="Optional detail" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /><div className="grid grid-cols-2 gap-3"><Input placeholder="Category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /><Input type="number" min="5" max="250" value={draft.xp} onChange={(event) => setDraft({ ...draft, xp: event.target.value })} /></div><div className="grid grid-cols-2 gap-3"><Input type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /><select className="min-h-12 rounded-2xl border border-white/10 bg-[#070b17] px-4 text-white outline-none" value={draft.recurrence} onChange={(event) => setDraft({ ...draft, recurrence: event.target.value })}><option value="none">One-time</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div><button type="button" onClick={() => setDraft({ ...draft, today: !draft.today })} className={cn("min-h-12 rounded-2xl border px-4 text-left text-sm font-semibold", draft.today ? "border-blue-300/25 bg-blue-500/15 text-blue-100" : "border-white/10 bg-white/[.035] text-slate-400")}>{draft.today ? "Marked for today" : "Keep in inbox"}</button><Button onClick={create} className="w-full bg-blue-600 text-white">Capture command<ArrowRight className="ml-2 h-4 w-4" /></Button></div></Panel><Panel className="p-5"><SectionTitle icon={Check} title="Recently completed" subtitle="A short ledger of executed commands." />{completed.length ? <div className="mt-5 grid gap-3">{completed.map((todo) => <div key={todo.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="font-semibold">{todo.title}</div><div className="mt-2 text-sm text-slate-500">{todo.category} · +{todo.xp} XP</div></div>)}</div> : <p className="mt-5 text-sm leading-6 text-slate-500">Completed XP tasks will appear here.</p>}</Panel></section><XpTaskList title="Open commands" subtitle="Send the right tasks to Today. Complete the small ones immediately." tasks={open} onComplete={onCompleteTodo} onToday={onSendToday} empty="Your inbox is clear. Capture the next faithful action." /></div>;
}
function PlanScreen({ state, onLockPlan, onTogglePrep, onSeedPreset }) {
  const dateKey = todayKey();
  const tomorrow = addDays(dateKey, 1);
  const existing = state.plans.byDate[tomorrow];
  const [draft, setDraft] = useState(() => existing || normalizePlan({ presetId: state.prep.activePreset }, tomorrow));
  useEffect(() => {
    setDraft(existing || normalizePlan({ presetId: state.prep.activePreset }, tomorrow));
  }, [existing?.lockedAt, state.prep.activePreset, tomorrow]);
  const openTasks = state.xp.todos.filter((todo) => todo.status === "open");
  const preset = presetById(draft.presetId);
  const todayChecklist = state.prep.checklists[dateKey] || makeChecklist(state.prep.activePreset);
  const tomorrowChecklist = state.prep.checklists[tomorrow] || makeChecklist(draft.presetId);
  const toggleTop = (id) => {
    const topTaskIds = draft.topTaskIds.includes(id) ? draft.topTaskIds.filter((item) => item !== id) : [...draft.topTaskIds, id].slice(0, 3);
    setDraft({ ...draft, topTaskIds });
  };
  return <div className="grid gap-5 lg:grid-cols-[1fr_.95fr]"><section className="space-y-5"><Panel className="p-5"><SectionTitle icon={CalendarDays} title="Daily Lock Plan" subtitle={`Prepare ${tomorrow}. Decide the day before it decides you.`} /><div className="mt-5 rounded-2xl border border-blue-300/15 bg-blue-500/5 p-4"><div className="text-xs uppercase tracking-[.24em] text-blue-200/80">Preset</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{PREP_PRESETS.map((item) => <button type="button" key={item.id} onClick={() => setDraft({ ...draft, presetId: item.id })} className={cn("rounded-2xl border p-3 text-left", draft.presetId === item.id ? "border-blue-300/30 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><div className="text-sm font-semibold">{item.title}</div><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p></button>)}</div><Button onClick={() => onSeedPreset(draft.presetId)} className="mt-4 w-full border border-white/10 bg-white/[.04] text-slate-200">Seed suggested commands</Button></div><div className="mt-5"><div className="mb-3 text-xs uppercase tracking-[.24em] text-slate-500">Top three priority XP tasks</div><div className="grid gap-2">{openTasks.length ? openTasks.map((todo) => <button type="button" key={todo.id} onClick={() => toggleTop(todo.id)} className={cn("flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left", draft.topTaskIds.includes(todo.id) ? "border-blue-300/30 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><span className="min-w-0 truncate text-sm font-semibold">{todo.title}</span><span className="text-xs text-slate-500">+{todo.xp}</span></button>) : <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-slate-500">Capture XP commands in Inbox, then lock the top three here.</div>}</div></div><div className="mt-5 grid gap-3"><label><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">First task after waking</span><select className="min-h-12 w-full rounded-2xl border border-white/10 bg-[#070b17] px-4 text-white outline-none" value={draft.firstTaskId} onChange={(event) => setDraft({ ...draft, firstTaskId: event.target.value })}><option value="">Choose from open commands</option>{openTasks.map((todo) => <option value={todo.id} key={todo.id}>{todo.title}</option>)}</select></label><label><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Danger point to avoid</span><Input value={draft.dangerPoint} placeholder="Example: phone in bed after 10 PM" onChange={(event) => setDraft({ ...draft, dangerPoint: event.target.value })} /></label><label><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Intention note</span><Textarea className="min-h-24" value={draft.intention} placeholder="Lord, make tomorrow obedient and clean..." onChange={(event) => setDraft({ ...draft, intention: event.target.value })} /></label><Button onClick={() => onLockPlan(tomorrow, draft)} className="w-full bg-blue-600 text-white">Lock tomorrow</Button>{existing?.lockedAt ? <div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">Tomorrow is locked. Top priorities, danger point, and intention are saved.</div> : null}</div></Panel></section><aside className="space-y-5"><ChecklistPanel title="Night-before checklist" subtitle={preset.title} checklist={tomorrowChecklist.night} onToggle={(id) => onTogglePrep(tomorrow, "night", id, draft.presetId)} /><ChecklistPanel title="Morning launch" subtitle="Today" checklist={todayChecklist.morning} onToggle={(id) => onTogglePrep(dateKey, "morning", id, state.prep.activePreset)} /><Panel className="p-5"><SectionTitle icon={ShieldCheck} title="Tomorrow already decided" subtitle="The lock plan becomes tomorrow's command engine." /><div className="mt-5 grid grid-cols-3 gap-3"><StatCard label="Top" value={`${draft.topTaskIds.length}/3`} /><StatCard label="First" value={draft.firstTaskId ? "Set" : "Open"} /><StatCard label="Preset" value={preset.title.split(" ")[0]} /></div></Panel></aside></div>;
}
function ChecklistPanel({ title, subtitle, checklist, onToggle }) {
  return <Panel className="p-5"><SectionTitle icon={Check} title={title} subtitle={subtitle} /><div className="mt-5 grid gap-2">{checklist.map((item) => <button type="button" key={item.id} onClick={() => onToggle(item.id)} className={cn("flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left", item.done ? "border-blue-300/25 bg-blue-500/15" : "border-white/10 bg-white/[.035]")}><span className="text-sm font-semibold leading-6">{item.label}</span>{item.done ? <Check className="h-4 w-4 text-blue-100" /> : null}</button>)}</div></Panel>;
}
function RewardsScreen({ state }) {
  const rewards = state.xp.rewards;
  const todayPlan = state.plans.byDate[todayKey()];
  const topIds = todayPlan?.topTaskIds || [];
  const topDone = topIds.filter((id) => state.xp.todos.some((todo) => todo.id === id && todo.status === "completed" && todo.completedDateKey === todayKey())).length;
  return <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="space-y-5"><Panel className="p-5"><SectionTitle icon={Sparkles} title="Disciplined rewards" subtitle="XP reinforces obedience and execution without turning the fast into a toy." /><div className="mt-5 grid grid-cols-2 gap-3"><StatCard label="Total XP" value={rewards.totalXp} /><StatCard label="Today XP" value={rewards.todayXp} /><StatCard label="Streak" value={rewards.streakDays} /><StatCard label="Combo" value={`${rewards.comboCount}x`} /></div></Panel><Panel className="p-5"><SectionTitle icon={ShieldCheck} title="Perfect day progress" subtitle="Strict commitments plus the top three locked tasks." /><div className="mt-5 grid grid-cols-3 gap-3"><StatCard label="Strict" value={state.runs.activeRun ? `${currentDay(state.runs.activeRun)?.completedRuleIds.length || 0}/6` : "0/6"} /><StatCard label="Top 3" value={`${topDone}/${Math.max(topIds.length, 3)}`} /><StatCard label="Perfect" value={rewards.perfectDays} /></div></Panel><Panel className="p-5"><SectionTitle icon={TrophyIcon} title="Achievements" subtitle="Quiet markers of sustained obedience." /><div className="mt-5 grid gap-3">{rewards.achievements.length ? rewards.achievements.map((item) => <div key={item.id} className="rounded-2xl border border-blue-300/15 bg-blue-500/10 p-4"><div className="font-semibold">{item.title}</div><p className="mt-1 text-sm leading-6 text-slate-400">{item.description || "Unlocked through faithful execution."}</p></div>) : <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-slate-500">Achievements unlock through secured days, XP execution, streaks, and perfect days.</div>}</div></Panel></section><Panel className="p-5"><SectionTitle icon={Database} title="XP ledger" subtitle="Recent completions, bonuses, and secured-day rewards." /><div className="mt-5 grid gap-3">{rewards.events.length ? rewards.events.slice(0, 18).map((event) => <div key={event.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><div><div className="font-semibold">{event.title}</div><div className="mt-1 text-xs uppercase tracking-[.16em] text-slate-500">{event.dateKey}</div></div><Badge className="border border-blue-300/20 bg-blue-500/10 text-blue-100">+{event.amount}</Badge></div>) : <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm leading-6 text-slate-500">Complete XP commands or secure strict days to build the ledger.</div>}</div></Panel></div>;
}
function TrophyIcon(props) {
  return <Sparkles {...props} />;
}
function SettingsScreen({ user, state, sync, onSound, onNotify, onReset, onReload, onSignOut }) {
  const support = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
  return <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="space-y-5"><Panel className="p-5"><SectionTitle icon={User} title="Account" subtitle={user?.email || "Device-only mode"} /><div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm leading-6 text-slate-400">{sync.message}</div></Panel><Panel className="p-5"><SectionTitle icon={Volume2} title="Sound" subtitle="Restrained tones for completions, danger, and secured days." /><Button onClick={onSound} className="mt-5 w-full border border-white/10 bg-white/[.04] text-slate-200">{state.ui.soundEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}Sound {state.ui.soundEnabled ? "on" : "off"}</Button></Panel><Panel className="p-5"><SectionTitle icon={Bell} title="Red-zone reminders" subtitle="Warnings when the day is slipping." /><p className="mt-4 text-sm leading-6 text-slate-400">{support ? "App-side warnings run while the app is open. Push subscription storage is ready for server-side scheduling." : "Notifications are not supported in this browser."}</p><Button disabled={!support} onClick={onNotify} className="mt-4 w-full bg-blue-600 text-white">{state.ui.notificationsEnabled ? "Disable reminders" : "Enable reminders"}</Button></Panel></section><section className="space-y-5"><Panel className="p-5"><SectionTitle icon={Database} title="Reliability" subtitle="Cloud sync with local cache fallback." /><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button onClick={onReload} className="border border-white/10 bg-white/[.04] text-slate-200"><RotateCcw className="mr-2 h-4 w-4" />Reload cloud</Button><Button onClick={onReset} className="border border-white/10 bg-white/[.04] text-slate-200"><Trash2 className="mr-2 h-4 w-4" />Reset local cache</Button></div></Panel><Panel className="p-5"><SectionTitle icon={ShieldCheck} title="System state" subtitle="The strict fast and XP system are stored separately." /><div className="mt-5 grid grid-cols-3 gap-3"><StatCard label="Strict" value={state.runs.activeRun ? "Active" : "None"} /><StatCard label="Todos" value={state.xp.todos.filter((todo) => todo.status === "open").length} /><StatCard label="Plans" value={Object.keys(state.plans.byDate).length} /></div></Panel><Button onClick={onSignOut} className="w-full border border-red-400/20 bg-red-500/10 text-red-200"><LogOut className="mr-2 h-4 w-4" />Sign out</Button></section></div>;
}
function CommandApp({ user, state, sync, onStart, onUpdateUi, onToggleRule, onCreateTodo, onCompleteTodo, onSendToday, onLockPlan, onTogglePrep, onSeedPreset, onSound, onNotify, onReset, onReload, onSignOut, audio }) {
  const [seconds, setSeconds] = useState(secondsLeftToday());
  const [secured, setSecured] = useState(false);
  const [toast, setToast] = useState(null);
  const active = state.ui.activeTab || "today";
  const danger = useMemo(() => calculateDanger(state, seconds), [state, seconds]);
  const action = useMemo(() => getNextAction(state, danger), [state, danger]);
  const previousLevel = useRef(danger.level);
  const previousEventCount = useRef(state.xp.rewards.events.length);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(secondsLeftToday()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (["danger", "critical"].includes(danger.level) && previousLevel.current !== danger.level) {
      audio.play("warning");
      vibrate(danger.level === "critical" ? [18, 40, 18] : [18]);
    }
    previousLevel.current = danger.level;
  }, [audio, danger.level]);
  useEffect(() => {
    if (!state.ui.notificationsEnabled) return;
    const run = state.runs.activeRun;
    const day = currentDay(run);
    const done = day?.completedRuleIds.length || 0;
    const dateKey = todayKey();
    const sent = state.ui.sentWarnings[dateKey] || [];
    const todayDone = state.xp.todos.some((todo) => todo.completedDateKey === dateKey);
    const levels = WARNING_LEVELS.filter(([id, threshold]) => {
      if (sent.includes(id)) return false;
      if (id === "dayStarted") return run && done === 0 && !todayDone && nyParts().seconds >= 9 * 3600;
      return run && done < 6 && seconds <= threshold;
    });
    const due = levels[levels.length - 1];
    if (!due) return;
    showNotification(due);
    audio.play("warning");
    onUpdateUi({ sentWarnings: { ...state.ui.sentWarnings, [dateKey]: [...sent, due[0]] } });
  }, [audio, onUpdateUi, seconds, state]);
  useEffect(() => {
    const run = state.runs.activeRun;
    const day = currentDay(run);
    if (!run || !day || day.completedRuleIds.length !== 6 || run.securedAnimationSeenFor === day.dayNumber) return;
    setSecured(true);
    audio.play("secured");
    const timer = setTimeout(() => setSecured(false), 2200);
    return () => clearTimeout(timer);
  }, [audio, state.runs.activeRun]);
  useEffect(() => {
    const latest = state.xp.rewards.events[0];
    if (state.xp.rewards.events.length > previousEventCount.current && latest) {
      setToast(latest);
      const timer = setTimeout(() => setToast(null), 2200);
      previousEventCount.current = state.xp.rewards.events.length;
      return () => clearTimeout(timer);
    }
    previousEventCount.current = state.xp.rewards.events.length;
  }, [state.xp.rewards.events]);
  const handleAction = () => {
    if (action.kind === "start-fast") onStart();
    if (action.kind === "commitment") onToggleRule(action.id);
    if (action.kind === "todo") onCompleteTodo(action.id);
    if (action.kind === "plan") onUpdateUi({ activeTab: "plan" });
    if (action.kind === "prayer") {
      audio.play("completion");
      vibrate([12, 30, 12]);
    }
  };
  const screen = {
    today: <TodayScreen user={user} state={state} seconds={seconds} danger={danger} action={action} onStart={onStart} onPrimaryAction={handleAction} onToggleRule={onToggleRule} onCompleteTodo={onCompleteTodo} onSendToday={onSendToday} onUpdateUi={onUpdateUi} />,
    inbox: <InboxScreen state={state} onCreateTodo={onCreateTodo} onCompleteTodo={onCompleteTodo} onSendToday={onSendToday} />,
    plan: <PlanScreen state={state} onLockPlan={onLockPlan} onTogglePrep={onTogglePrep} onSeedPreset={onSeedPreset} />,
    rewards: <RewardsScreen state={state} />,
    settings: <SettingsScreen user={user} state={state} sync={sync} onSound={onSound} onNotify={onNotify} onReset={onReset} onReload={onReload} onSignOut={onSignOut} />,
  }[active];
  return <Shell><TopBar user={user} sync={sync} ui={state.ui} onSound={onSound} onTab={(tab) => onUpdateUi({ activeTab: tab })} /><main className="mx-auto max-w-6xl pb-[calc(92px+env(safe-area-inset-bottom))]"><AnimatePresence mode="wait"><motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: "easeOut" }}>{screen}</motion.div></AnimatePresence></main><BottomNav active={active} onTab={(tab) => onUpdateUi({ activeTab: tab })} /><AnimatePresence>{secured ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-[#02040a]/74 p-4 backdrop-blur-md"><motion.div initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} className="rounded-[34px] border border-blue-300/20 bg-[#071022]/92 px-7 py-8 text-center"><Sparkles className="mx-auto h-10 w-10 text-blue-200" /><div className="mt-5 text-xs uppercase tracking-[.34em] text-blue-200/80">Day secured</div><div className="mt-2 text-3xl font-semibold">Kept before the Lord.</div></motion.div></motion.div> : null}{toast ? <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="fixed inset-x-4 bottom-[calc(92px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-2xl border border-blue-300/20 bg-[#071022]/95 p-4 text-sm shadow-2xl backdrop-blur"><div className="font-semibold text-blue-100">+{toast.amount} XP</div><div className="mt-1 text-slate-400">{toast.title}</div></motion.div> : null}</AnimatePresence></Shell>;
}

export default function App() {
  const [state, setState] = useState(() => loadLocal());
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState("loading");
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
  const commitState = useCallback((updater) => {
    const current = stateRef.current;
    const next = typeof updater === "function" ? updater(current) : updater;
    persist(next);
  }, [persist]);
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
  const updateUi = (patch) => commitState((current) => ({ ...current, ui: { ...current.ui, ...patch } }));
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
  const createFast = (payload) => {
    audio.unlock();
    setScreen("app");
    commitState((current) => ({ ...current, ui: { ...current.ui, activeTab: "today" }, runs: { ...current.runs, activeRun: makeRun(payload) } }));
  };
  const toggleRule = (ruleId) => {
    audio.unlock();
    audio.play("check");
    vibrate();
    commitState((current) => {
      const run = current.runs.activeRun;
      const day = currentDay(run);
      if (!run || !day) return current;
      const completed = day.completedRuleIds.includes(ruleId) ? day.completedRuleIds.filter((id) => id !== ruleId) : [...day.completedRuleIds, ruleId];
      const updatedRun = {
        ...run,
        days: run.days.map((item) => item.dayNumber === run.currentDay ? { ...item, completedRuleIds: completed } : item),
      };
      const next = normalizeState({ ...current, runs: evaluateRuns({ activeRun: updatedRun, history: current.runs.history }) });
      return awardStrictBonuses(next);
    });
  };
  const createTodo = (draft) => {
    audio.unlock();
    commitState((current) => ({
      ...current,
      xp: { ...current.xp, todos: [normalizeTodo({ ...draft, id: newId(), status: "open", createdAt: new Date().toISOString() }), ...current.xp.todos] },
      ui: { ...current.ui, activeTab: current.ui.activeTab || "inbox" },
    }));
  };
  const completeTodo = (todoId) => {
    audio.unlock();
    audio.play("xp");
    vibrate([10]);
    commitState((current) => {
      const todo = current.xp.todos.find((item) => item.id === todoId);
      if (!todo || todo.status === "completed") return current;
      const dateKey = todayKey();
      const sameDayCombo = current.xp.rewards.lastCompletionDayKey === dateKey;
      const comboCount = sameDayCombo ? Math.min(12, current.xp.rewards.comboCount + 1) : 1;
      let rewards = addRewardEvent({ ...current.xp.rewards, comboCount, lastCompletionAt: new Date().toISOString(), lastCompletionDayKey: dateKey }, {
        type: "todo",
        title: todo.title,
        amount: todo.xp,
        dateKey,
      });
      if (comboCount > 1) rewards = addRewardEvent({ ...rewards, comboCount }, { type: "combo", title: `${comboCount}x command combo`, amount: Math.min(50, (comboCount - 1) * 5), dateKey });
      const completed = { ...todo, status: "completed", completedAt: new Date().toISOString(), completedDateKey: dateKey, today: false };
      const recurring = todo.recurrence !== "none" ? normalizeTodo({ ...todo, id: newId(), status: "open", completedAt: null, completedDateKey: null, today: false, dueDate: nextDueDate(todo.recurrence, dateKey), createdAt: new Date().toISOString(), lastGeneratedFrom: todo.id }) : null;
      const todos = current.xp.todos.map((item) => item.id === todoId ? completed : item);
      const next = normalizeState({ ...current, xp: { todos: recurring ? [recurring, ...todos] : todos, rewards } });
      return checkPerfectDay(next);
    });
  };
  const sendToday = (todoId) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.map((todo) => todo.id === todoId ? { ...todo, today: true, dueDate: todo.dueDate || todayKey() } : todo) } }));
  const lockPlan = (dateKey, plan) => commitState((current) => {
    const normalized = normalizePlan({ ...plan, dateKey, lockedAt: new Date().toISOString() }, dateKey);
    return {
      ...current,
      plans: { byDate: { ...current.plans.byDate, [dateKey]: normalized } },
      prep: { ...current.prep, activePreset: normalized.presetId, checklists: { ...current.prep.checklists, [dateKey]: current.prep.checklists[dateKey] || makeChecklist(normalized.presetId) } },
    };
  });
  const togglePrep = (dateKey, section, itemId, presetId) => commitState((current) => {
    const checklist = current.prep.checklists[dateKey] || makeChecklist(presetId || current.prep.activePreset);
    const updated = { ...checklist, [section]: checklist[section].map((item) => item.id === itemId ? { ...item, done: !item.done } : item) };
    return { ...current, prep: { ...current.prep, checklists: { ...current.prep.checklists, [dateKey]: updated } } };
  });
  const seedPreset = (presetId) => commitState((current) => {
    const preset = presetById(presetId);
    const existingTitles = new Set(current.xp.todos.map((todo) => `${todo.title}-${todo.category}`));
    const additions = preset.tasks
      .filter(([title, category]) => !existingTitles.has(`${title}-${category}`))
      .map(([title, category, xp]) => normalizeTodo({ title, category, xp, today: true, dueDate: todayKey(), recurrence: "none" }));
    return { ...current, xp: { ...current.xp, todos: [...additions, ...current.xp.todos] }, prep: { ...current.prep, activePreset: preset.id } };
  });
  const resetLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(clone(DEFAULT_STATE));
    setSync({ status: session?.user ? "synced" : "local", label: session?.user ? "Cloud kept" : "Device", message: session?.user ? "Local cache cleared. Cloud record remains available." : "Local cache cleared." });
  };

  if (screen === "loading") return <Shell><div className="grid min-h-dvh place-items-center text-slate-400">Loading Fasting Mode...</div></Shell>;
  if (screen === "auth" || !user) return <Auth onSignIn={signIn} onSignUp={signUp} onLocal={() => { setLocalMode(true); setScreen("app"); }} loading={false} message={authMessage} ui={state.ui} onSound={toggleSound} />;
  if (screen === "onboarding") return <Onboarding onCreate={createFast} onCancel={() => setScreen("app")} />;
  return <CommandApp user={user} state={state} sync={sync} onStart={() => setScreen("onboarding")} onUpdateUi={updateUi} onToggleRule={toggleRule} onCreateTodo={createTodo} onCompleteTodo={completeTodo} onSendToday={sendToday} onLockPlan={lockPlan} onTogglePrep={togglePrep} onSeedPreset={seedPreset} onSound={toggleSound} onNotify={state.ui.notificationsEnabled ? disableNotifications : enableNotifications} onReset={resetLocal} onReload={() => loadCloud(session)} onSignOut={async () => { if (supabaseReady && session) await supabase.auth.signOut(); setSession(null); setLocalMode(!supabaseReady); setScreen(supabaseReady ? "auth" : "app"); }} audio={audio} />;
}
