import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Lock,
  Shield,
  Flame,
  ArrowRight,
  CalendarDays,
  Clock3,
  Target,
  AlertTriangle,
  Trophy,
  XCircle,
  History,
  Sparkles,
  LogOut,
  User,
  Mail,
  KeyRound,
  ChevronRight,
  Smartphone,
  Download,
} from "lucide-react";
const Button = ({ className = "", children, ...props }) => (
  <button className={className} {...props}>{children}</button>
);

const Input = ({ className = "", ...props }) => (
  <input className={className} {...props} />
);

const Textarea = ({ className = "", ...props }) => (
  <textarea className={className} {...props} />
);

const Progress = ({ value = 0, className = "" }) => (
  <div className={className}>
    <div
      style={{ width: `${value}%` }}
      className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-300"
    />
  </div>
);

const Badge = ({ className = "", children, ...props }) => (
  <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`} {...props}>
    {children}
  </div>
);

const APP_KEY = "monk_mode_prod_v1";
const TZ = "America/New_York";
const DURATIONS = [21, 30, 60, 90];
const DEFAULT_STATE = {
  auth: {
    user: null,
    users: [],
    session: null,
  },
  runs: {
    activeRun: null,
    history: [],
  },
  ui: {
    installedPromptDismissed: false,
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeStorageLoad() {
  if (typeof window === "undefined") return deepClone(DEFAULT_STATE);
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (!raw) return deepClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      auth: { ...DEFAULT_STATE.auth, ...(parsed.auth || {}) },
      runs: { ...DEFAULT_STATE.runs, ...(parsed.runs || {}) },
      ui: { ...DEFAULT_STATE.ui, ...(parsed.ui || {}) },
    };
  } catch {
    return deepClone(DEFAULT_STATE);
  }
}

function safeStorageSave(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(APP_KEY, JSON.stringify(state));
}

function getNYParts(date = new Date()) {
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

  const map = {};
  parts.forEach((p) => {
    if (p.type !== "literal") map[p.type] = p.value;
  });

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    dateKey: `${map.year}-${map.month}-${map.day}`,
  };
}

function getSecondsRemainingInNYDay(now = new Date()) {
  const p = getNYParts(now);
  const elapsed = p.hour * 3600 + p.minute * 60 + p.second;
  return Math.max(0, 86400 - elapsed);
}

function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function addDaysToDateKey(dateKey, daysToAdd) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function createRun({ duration, rules, mission }) {
  const now = new Date();
  const dateKey = getNYParts(now).dateKey;
  return {
    id: crypto.randomUUID(),
    duration,
    mission,
    rules: rules.map((label, idx) => ({ id: crypto.randomUUID(), label, order: idx + 1 })),
    status: "active",
    timezone: TZ,
    startedAt: now.toISOString(),
    startDateKey: dateKey,
    currentDay: 1,
    days: [
      {
        dayNumber: 1,
        dateKey,
        status: "pending",
        completedRuleIds: [],
        wonAt: null,
        failedAt: null,
      },
    ],
    securedAnimationSeenFor: null,
    failedDay: null,
    completedAt: null,
    failedAt: null,
  };
}

function getCurrentDayRecord(run) {
  return run?.days?.find((d) => d.dayNumber === run.currentDay) || null;
}

function finalizeRunIfNeeded(runs) {
  if (!runs.activeRun) return runs;
  if (runs.activeRun.status === "failed" || runs.activeRun.status === "completed") {
    return {
      activeRun: null,
      history: [runs.activeRun, ...runs.history],
    };
  }
  return runs;
}

function evaluateRun(runs) {
  if (!runs?.activeRun || runs.activeRun.status !== "active") return runs;

  const now = new Date();
  const todayKey = getNYParts(now).dateKey;
  const run = { ...runs.activeRun, days: [...runs.activeRun.days] };
  let currentDay = getCurrentDayRecord(run);
  if (!currentDay) return runs;

  while (currentDay && currentDay.dateKey < todayKey) {
    const allDone = currentDay.completedRuleIds.length === 6;

    if (!allDone) {
      currentDay = { ...currentDay, status: "failed", failedAt: now.toISOString() };
      run.days = run.days.map((d) => (d.dayNumber === currentDay.dayNumber ? currentDay : d));
      run.status = "failed";
      run.failedAt = now.toISOString();
      run.failedDay = currentDay.dayNumber;
      return finalizeRunIfNeeded({ activeRun: run, history: runs.history });
    }

    if (currentDay.status !== "won") {
      currentDay = { ...currentDay, status: "won", wonAt: currentDay.wonAt || now.toISOString() };
      run.days = run.days.map((d) => (d.dayNumber === currentDay.dayNumber ? currentDay : d));
    }

    if (run.currentDay >= run.duration) {
      run.status = "completed";
      run.completedAt = now.toISOString();
      return finalizeRunIfNeeded({ activeRun: run, history: runs.history });
    }

    run.currentDay += 1;
    const nextDay = {
      dayNumber: run.currentDay,
      dateKey: addDaysToDateKey(run.startDateKey, run.currentDay - 1),
      status: "pending",
      completedRuleIds: [],
      wonAt: null,
      failedAt: null,
    };
    if (!run.days.some((d) => d.dayNumber === nextDay.dayNumber)) {
      run.days.push(nextDay);
    }
    currentDay = getCurrentDayRecord(run);
  }

  const current = getCurrentDayRecord(run);
  if (current?.completedRuleIds.length === 6 && current.status !== "won") {
    run.days = run.days.map((d) =>
      d.dayNumber === current.dayNumber ? { ...d, status: "won", wonAt: d.wonAt || now.toISOString() } : d
    );
  }

  return { activeRun: run, history: runs.history };
}

function maskEmail(email) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`;
}

function playSecureTone() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [392, 523.25, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.05, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.22);
    });
  } catch {}
}

function pulseFeedback() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([18, 26, 18]);
  }
}

function GlassOrb({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-blue-500/20 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(59,130,246,0.06),0_20px_80px_rgba(2,8,23,0.7)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      {right}
    </div>
  );
}

function TopShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02040a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.2),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08),transparent_20%),linear-gradient(to_bottom,#02040a,#050916_45%,#02040a)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function AuthScreen({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (mode === "signup") {
      if (!name.trim()) {
        setError("Name is required.");
        return;
      }
      const result = onSignUp({ name: name.trim(), email: email.trim().toLowerCase(), password });
      if (result?.error) setError(result.error);
      return;
    }
    const result = onSignIn({ email: email.trim().toLowerCase(), password });
    if (result?.error) setError(result.error);
  };

  return (
    <TopShell>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Badge className="mb-5 border-blue-400/20 bg-blue-500/10 px-3 py-1 text-blue-200">Premium discipline system</Badge>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] sm:text-6xl">
              Monk Mode is a contract, not a checklist.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Sign in. Lock the protocol. Clear six standards before midnight in New York. Break the contract once, and the run dies.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Strict timing", "Daily reset runs on New York time."],
                ["Locked protocol", "No editing after the challenge starts."],
                ["Hard consequence", "Miss one rule and restart from day one."],
              ].map(([title, text]) => (
                <GlassOrb key={title} className="p-4">
                  <div className="text-sm font-medium text-white">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">{text}</div>
                </GlassOrb>
              ))}
            </div>
          </div>

          <GlassOrb className="p-5 sm:p-6">
            <div className="mb-6 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              {[
                ["signin", "Sign in"],
                ["signup", "Create account"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    mode === value ? "bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.28)]" : "text-slate-400 hover:text-white"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {mode === "signup" ? (
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-slate-500" placeholder="Your name" />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-slate-500" placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Password</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-2xl border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-slate-500" placeholder="••••••••" />
                </div>
              </div>
            </div>

            {error ? <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

            <Button onClick={submit} className="mt-6 h-12 w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-500">
              {mode === "signup" ? "Create account" : "Sign in"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="mt-5 rounded-2xl border border-blue-400/15 bg-blue-500/5 p-4 text-sm leading-6 text-slate-400">
              This canvas build uses local persistence to simulate a production auth flow. In a real deployment, swap this layer with Supabase Auth without changing the product behavior.
            </div>
          </GlassOrb>
        </div>
      </div>
    </TopShell>
  );
}

function Landing({ onStart, historyCount, user }) {
  return (
    <TopShell>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.35em] text-blue-300/80">Monk Mode</div>
              <div className="text-xs text-slate-500">Discipline Operating System</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="border-white/10 bg-white/5 text-slate-300">{maskEmail(user?.email)}</Badge>
            {historyCount > 0 ? <Badge className="border-blue-400/20 bg-white/5 text-slate-300">{historyCount} archived runs</Badge> : null}
          </div>
        </div>

        <div className="grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge className="mb-5 border-blue-400/20 bg-blue-500/10 px-3 py-1 text-blue-200">No edits. No skipped days. No excuses.</Badge>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] text-white sm:text-6xl">
                A locked commitment system for men who are done negotiating with themselves.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                Choose your duration. Set exactly 6 non-negotiables. Clear every day before the clock hits zero. Miss one, and the run dies.
              </p>
            </motion.div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={onStart} className="h-12 rounded-2xl bg-blue-600 px-6 text-base font-medium text-white shadow-[0_0_35px_rgba(37,99,235,0.35)] hover:bg-blue-500">
                Start Monk Mode
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["24-hour consequence", "The clock does not care how you feel."],
                ["Exactly 6 rules", "Tight, visible, non-negotiable standards."],
                ["Failure resets the run", "Break the contract, start again from day one."],
              ].map(([title, text]) => (
                <GlassOrb key={title} className="p-4">
                  <div className="text-sm font-medium text-white">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">{text}</div>
                </GlassOrb>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }}>
            <GlassOrb className="relative overflow-hidden p-5 sm:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_34%)]" />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Preview</div>
                    <div className="mt-1 text-lg font-semibold text-white">Active Run Dashboard</div>
                  </div>
                  <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300">Secure</Badge>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-[#050816] p-5 shadow-inner shadow-black/40">
                  <div className="text-center">
                    <div className="text-xs uppercase tracking-[0.35em] text-blue-300/80">Time Remaining</div>
                    <div className="mt-3 text-5xl font-semibold tracking-tight text-white sm:text-6xl">08:14:27</div>
                    <div className="mt-2 text-sm text-slate-500">Day 14 of 30</div>
                  </div>
                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-[47%] rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-300 shadow-[0_0_24px_rgba(59,130,246,0.55)]" />
                  </div>
                  <div className="mt-5 grid gap-3">
                    {[
                      "Wake up on time",
                      "No porn",
                      "Workout",
                      "Prayer / Bible",
                      "Deep work block",
                      "No phone before routine",
                    ].map((item, i) => (
                      <div key={item} className={cn("flex items-center justify-between rounded-2xl border px-4 py-3", i < 4 ? "border-blue-400/15 bg-blue-500/10" : "border-white/10 bg-white/[0.03]") }>
                        <div className="text-sm text-slate-200">{item}</div>
                        <div className={cn("rounded-xl p-2", i < 4 ? "bg-blue-500/20 text-blue-300" : "bg-white/5 text-slate-500")}>
                          {i < 4 ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassOrb>
          </motion.div>
        </div>
      </div>
    </TopShell>
  );
}

function Onboarding({ onCreate, onCancel }) {
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(30);
  const [rules, setRules] = useState(Array(6).fill(""));
  const [mission, setMission] = useState("");
  const allRulesFilled = rules.every((r) => r.trim().length > 0);

  return (
    <TopShell>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.32em] text-blue-300/80">Monk Mode Setup</div>
              <div className="mt-1 text-sm text-slate-500">Build the contract. Then lock it.</div>
            </div>
            <Button variant="ghost" onClick={onCancel} className="rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white">Exit</Button>
          </div>

          <GlassOrb className="p-4 sm:p-6">
            <div className="mb-6 flex items-center gap-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={cn("h-2 flex-1 rounded-full", step >= n ? "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.55)]" : "bg-white/5")} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <SectionTitle icon={Clock3} title="Choose duration" subtitle="Pick the length of the run. This choice defines the contract window." />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          "rounded-[26px] border p-5 text-left transition-all",
                          duration === d ? "border-blue-400/40 bg-blue-500/10 shadow-[0_0_40px_rgba(37,99,235,0.18)]" : "border-white/10 bg-white/[0.03] hover:border-blue-400/20 hover:bg-white/[0.045]"
                        )}
                      >
                        <div className="text-3xl font-semibold text-white">{d}</div>
                        <div className="mt-2 text-sm text-slate-400">days of zero negotiation</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <Button onClick={() => setStep(2)} className="rounded-2xl bg-blue-600 px-5 hover:bg-blue-500">Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <SectionTitle icon={Target} title="Define exactly 6 non-negotiables" subtitle="These are daily standards, not vague intentions. Short. Clear. Binary." />
                  <div className="mt-6 grid gap-4">
                    {rules.map((rule, idx) => (
                      <div key={idx}>
                        <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500">Rule 0{idx + 1}</label>
                        <Input
                          value={rule}
                          onChange={(e) => {
                            const next = [...rules];
                            next[idx] = e.target.value;
                            setRules(next);
                          }}
                          placeholder={[
                            "Wake up on time",
                            "No porn",
                            "Workout",
                            "Prayer / Bible",
                            "Deep work block",
                            "No phone before routine",
                          ][idx]}
                          className="h-12 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)} className="rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white">Back</Button>
                    <Button onClick={() => setStep(3)} disabled={!allRulesFilled} className="rounded-2xl bg-blue-600 px-5 hover:bg-blue-500 disabled:opacity-40">Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <SectionTitle icon={Flame} title="Mission statement" subtitle="Visible. Personal. Heavy enough to keep you from folding." />
                  <div className="mt-6">
                    <Textarea
                      value={mission}
                      onChange={(e) => setMission(e.target.value)}
                      placeholder="Why am I doing this? Who am I becoming? What life am I refusing to go back to?"
                      className="min-h-[180px] rounded-[24px] border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(2)} className="rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white">Back</Button>
                    <Button onClick={() => setStep(4)} className="rounded-2xl bg-blue-600 px-5 hover:bg-blue-500">Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                  <SectionTitle icon={Lock} title="Final confirmation" subtitle="Once the run starts, the contract is sealed." />
                  <div className="mt-6 grid gap-5">
                    <GlassOrb className="p-5">
                      <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Duration</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{duration} days</div>
                    </GlassOrb>

                    <GlassOrb className="p-5">
                      <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Your 6 non-negotiables</div>
                      <div className="mt-4 grid gap-3">
                        {rules.map((rule, idx) => (
                          <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">{idx + 1}. {rule}</div>
                        ))}
                      </div>
                    </GlassOrb>

                    {mission.trim() ? (
                      <GlassOrb className="p-5">
                        <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Mission</div>
                        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{mission}</div>
                      </GlassOrb>
                    ) : null}

                    <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-5">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" />
                        <div>
                          <div className="font-medium text-white">This is a locked commitment.</div>
                          <ul className="mt-3 space-y-2 text-sm text-red-100/80">
                            <li>You cannot skip days.</li>
                            <li>You cannot edit the run after it starts.</li>
                            <li>If even one rule is incomplete when the day ends, the run fails instantly.</li>
                            <li>Failure means restart from day one.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(3)} className="rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white">Back</Button>
                    <Button onClick={() => onCreate({ duration, rules: rules.map((r) => r.trim()), mission: mission.trim() })} className="rounded-2xl bg-blue-600 px-5 shadow-[0_0_35px_rgba(37,99,235,0.35)] hover:bg-blue-500">
                      Lock It In
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassOrb>
        </div>
      </div>
    </TopShell>
  );
}

function RuleCard({ rule, complete, onToggle, locked }) {
  return (
    <motion.button
      whileTap={{ scale: locked ? 1 : 0.985 }}
      onClick={onToggle}
      disabled={locked}
      className={cn(
        "w-full rounded-[24px] border p-4 text-left transition-all",
        complete ? "border-blue-400/30 bg-blue-500/10 shadow-[0_0_30px_rgba(37,99,235,0.16)]" : "border-white/10 bg-white/[0.03] hover:border-blue-400/20 hover:bg-white/[0.045]",
        locked && "cursor-default"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Non-negotiable</div>
          <div className="mt-2 text-base font-medium leading-6 text-white">{rule.label}</div>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", complete ? "border-blue-400/30 bg-blue-500/20 text-blue-300" : "border-white/10 bg-white/[0.04] text-slate-500")}>
          {complete ? <Check className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
        </div>
      </div>
    </motion.button>
  );
}

function InstallBanner({ onDismiss }) {
  return (
    <GlassOrb className="p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-300">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Install-ready mobile shell</div>
          <div className="mt-1 text-sm leading-6 text-slate-400">
            When deployed, add this to your home screen or link it inside GHL for one-tap access from your phone.
          </div>
        </div>
        <Button variant="ghost" onClick={onDismiss} className="rounded-xl text-slate-400 hover:bg-white/5 hover:text-white">Dismiss</Button>
      </div>
    </GlassOrb>
  );
}

function HistoryPanel({ history }) {
  return (
    <GlassOrb className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle icon={History} title="Run Archive" subtitle="Past wins and failures remain visible." />
      </div>
      {history.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">No archived runs yet.</div>
      ) : (
        <div className="space-y-3">
          {history.map((run) => {
            const completionPercent = Math.round(((run.days.filter((d) => d.status === "won").length) / run.duration) * 100);
            return (
              <div key={run.id} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{run.duration}-day protocol</div>
                    <div className="mt-1 text-xs text-slate-500">Started {run.startDateKey}</div>
                  </div>
                  <Badge className={cn(run.status === "completed" ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-red-400/20 bg-red-500/10 text-red-300")}>
                    {run.status === "completed" ? "Completed" : `Failed day ${run.failedDay}`}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                  <span>Completion</span>
                  <span>{completionPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-300" style={{ width: `${completionPercent}%` }} />
                </div>
                {run.mission ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{run.mission}</p> : null}
              </div>
            );
          })}
        </div>
      )}
    </GlassOrb>
  );
}

function FailureModal({ run, onRestart, onLeave }) {
  const failedDay = run.days.find((d) => d.dayNumber === run.failedDay);
  const incomplete = run.rules.filter((r) => !failedDay?.completedRuleIds.includes(r.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-2xl rounded-[32px] border border-red-500/20 bg-[#050816] p-6 text-white shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.34em] text-red-300/80">Run Failed</div>
            <h2 className="mt-2 text-3xl font-semibold">The contract was broken.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Day {run.failedDay} was not fully cleared before the deadline. Monk Mode does not negotiate.</p>
          </div>
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-300">
            <XCircle className="h-6 w-6" />
          </div>
        </div>

        {run.mission ? (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Mission</div>
            <div className="mt-2 text-sm leading-7 text-slate-300">{run.mission}</div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-sm font-medium text-white">Left incomplete</div>
          <div className="mt-3 space-y-2">
            {incomplete.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button onClick={onRestart} className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-500">Restart From Day 1</Button>
          <Button onClick={onLeave} variant="outline" className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]">Leave</Button>
        </div>
      </motion.div>
    </div>
  );
}

function CompletionModal({ run, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-xl rounded-[32px] border border-emerald-400/20 bg-[#050816] p-6 text-white shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            <Trophy className="h-8 w-8" />
          </div>
          <div className="mt-5 text-xs uppercase tracking-[0.34em] text-emerald-300/80">Protocol Complete</div>
          <h2 className="mt-2 text-3xl font-semibold">You finished the run.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{run.duration} days. No skipped days. No edits. No retreat.</p>
          {run.mission ? <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-300">{run.mission}</p> : null}
          <Button onClick={onClose} className="mt-6 h-12 rounded-2xl bg-blue-600 px-6 hover:bg-blue-500">Close</Button>
        </div>
      </motion.div>
    </div>
  );
}

function DaySecuredOverlay() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[#02040a]/72 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="rounded-[34px] border border-blue-400/20 bg-[#071022]/90 px-8 py-8 text-center shadow-[0_0_80px_rgba(37,99,235,0.22)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-blue-400/20 bg-blue-500/10 text-blue-300 shadow-[0_0_40px_rgba(59,130,246,0.25)]">
          <Sparkles className="h-8 w-8" />
        </div>
        <div className="mt-5 text-xs uppercase tracking-[0.36em] text-blue-300/80">Day Secured</div>
        <div className="mt-2 text-3xl font-semibold text-white">Contract upheld.</div>
        <div className="mt-3 text-sm text-slate-400">The day is locked. Midnight cannot take this one from you.</div>
      </motion.div>
    </motion.div>
  );
}

function Dashboard({ user, run, history, ui, onUpdateRun, onStartNew, onDismissInstall, onLogout, onRestartFromFailure, completedRun, setCompletedRun, showFailureRun, clearFailureModal }) {
  const [secondsLeft, setSecondsLeft] = useState(getSecondsRemainingInNYDay());
  const [showSecured, setShowSecured] = useState(false);
  const secureTriggeredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setSecondsLeft(getSecondsRemainingInNYDay()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentDay = getCurrentDayRecord(run);
  const doneCount = currentDay?.completedRuleIds.length || 0;
  const dayComplete = doneCount === 6;
  const challengeProgress = Math.round(((run.currentDay - 1 + doneCount / 6) / run.duration) * 100);
  const currentStreak = run.days.filter((d) => d.status === "won").length + (dayComplete ? 1 : 0);
  const completedDays = run.days.filter((d) => d.status === "won").length;

  useEffect(() => {
    if (dayComplete && run.securedAnimationSeenFor !== currentDay.dayNumber && !secureTriggeredRef.current) {
      secureTriggeredRef.current = true;
      setShowSecured(true);
      pulseFeedback();
      playSecureTone();
      onUpdateRun({ ...run, securedAnimationSeenFor: currentDay.dayNumber });
      const t = setTimeout(() => setShowSecured(false), 2200);
      return () => clearTimeout(t);
    }
    if (!dayComplete) secureTriggeredRef.current = false;
  }, [dayComplete, run, currentDay, onUpdateRun]);

  const toggleRule = (ruleId) => {
    if (dayComplete) return;
    pulseFeedback();
    const updatedDays = run.days.map((d) => {
      if (d.dayNumber !== run.currentDay) return d;
      const has = d.completedRuleIds.includes(ruleId);
      return {
        ...d,
        completedRuleIds: has ? d.completedRuleIds.filter((id) => id !== ruleId) : [...d.completedRuleIds, ruleId],
      };
    });
    onUpdateRun({ ...run, days: updatedDays });
  };

  return (
    <TopShell>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 text-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.16)]">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.32em] text-blue-300/80">Monk Mode</div>
              <div className="text-xs text-slate-500">America/New_York clock</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/10 bg-white/5 text-slate-300">{user?.name}</Badge>
            <Badge className="border-blue-400/20 bg-white/5 text-slate-300">{maskEmail(user?.email)}</Badge>
            <Button variant="outline" onClick={onStartNew} className="rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]">New Run</Button>
            <Button variant="ghost" onClick={onLogout} className="rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            {!ui.installedPromptDismissed ? <InstallBanner onDismiss={onDismissInstall} /> : null}

            <GlassOrb className="relative overflow-hidden p-5 sm:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_35%)]" />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.34em] text-slate-500">Current Run</div>
                    <div className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Day {run.currentDay} of {run.duration}</div>
                    <div className="mt-2 text-sm text-slate-400">{dayComplete ? "Day secured. Wait for the next reset." : "Every rule must be complete before the clock hits zero."}</div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Current streak</div>
                    <div className="mt-1 text-2xl font-semibold text-white">{currentStreak}</div>
                  </div>
                </div>

                <div className="mt-8 rounded-[28px] border border-blue-400/15 bg-[#050816] p-5 text-center shadow-inner shadow-black/40">
                  <div className="text-xs uppercase tracking-[0.36em] text-blue-300/80">Time Left Today</div>
                  <div className={cn("mt-4 text-5xl font-semibold tracking-tight sm:text-7xl", dayComplete ? "text-blue-300" : "text-white")}>{formatCountdown(secondsLeft)}</div>
                  <div className="mt-3 text-sm text-slate-500">New York local day reset at 12:00 AM</div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <GlassOrb className="p-4">
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Daily progress</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{doneCount}/6</div>
                  </GlassOrb>
                  <GlassOrb className="p-4">
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Challenge progress</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{challengeProgress}%</div>
                  </GlassOrb>
                  <GlassOrb className="p-4">
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Status</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{dayComplete ? "Secured" : "In play"}</div>
                  </GlassOrb>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
                    <span>Daily completion</span>
                    <span>{Math.round((doneCount / 6) * 100)}%</span>
                  </div>
                  <Progress value={(doneCount / 6) * 100} className="h-3 bg-white/5" />
                </div>
              </div>
            </GlassOrb>

            <GlassOrb className="p-5 sm:p-6">
              <SectionTitle icon={Target} title="Today's non-negotiables" subtitle="No edits. No substitutions. Clear the list or lose the run." right={<Badge className="border-white/10 bg-white/[0.03] text-slate-300">Locked protocol</Badge>} />
              <div className="mt-6 grid gap-4">
                {run.rules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} complete={currentDay.completedRuleIds.includes(rule.id)} locked={false} onToggle={() => toggleRule(rule.id)} />
                ))}
              </div>
            </GlassOrb>
          </div>

          <div className="space-y-5">
            <GlassOrb className="p-5">
              <SectionTitle icon={Flame} title="Mission" subtitle="Keep the reason visible. Make retreat expensive." />
              <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                {run.mission?.trim() ? run.mission : "No mission statement set for this run."}
              </div>
            </GlassOrb>

            <GlassOrb className="p-5">
              <SectionTitle icon={CalendarDays} title="Challenge timeline" subtitle="Clean history of wins across the current run." />
              <div className="mt-5 grid grid-cols-5 gap-3 sm:grid-cols-6">
                {Array.from({ length: run.duration }, (_, i) => i + 1).map((dayNum) => {
                  const day = run.days.find((d) => d.dayNumber === dayNum);
                  const isCurrent = dayNum === run.currentDay;
                  const isWon = day?.status === "won";
                  const isFailed = day?.status === "failed";
                  const isPending = !day || day.status === "pending";
                  return (
                    <div key={dayNum} className={cn("flex h-12 items-center justify-center rounded-2xl border text-sm font-medium", isWon && "border-blue-400/20 bg-blue-500/10 text-blue-300", isFailed && "border-red-400/20 bg-red-500/10 text-red-300", isCurrent && !isWon && !isFailed && "border-white/15 bg-white/[0.06] text-white", !isCurrent && isPending && "border-white/10 bg-white/[0.03] text-slate-500")}>
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </GlassOrb>

            <GlassOrb className="p-5">
              <SectionTitle icon={Download} title="Run stats" subtitle="Clean signal. No fluff." />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Days won</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{completedDays}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Rules locked</div>
                  <div className="mt-2 text-2xl font-semibold text-white">6</div>
                </div>
              </div>
            </GlassOrb>

            <HistoryPanel history={history} />
          </div>
        </div>
      </div>

      <AnimatePresence>{showSecured ? <DaySecuredOverlay /> : null}</AnimatePresence>
      {showFailureRun ? <FailureModal run={showFailureRun} onRestart={onRestartFromFailure} onLeave={clearFailureModal} /> : null}
      {completedRun ? <CompletionModal run={completedRun} onClose={() => setCompletedRun(null)} /> : null}
    </TopShell>
  );
}

export default function MonkModeApp() {
  const [state, setState] = useState(deepClone(DEFAULT_STATE));
  const [screen, setScreen] = useState("loading");
  const [failureModalRun, setFailureModalRun] = useState(null);
  const [completedModalRun, setCompletedModalRun] = useState(null);

  useEffect(() => {
    const loaded = safeStorageLoad();
    const evaluatedRuns = evaluateRun(loaded.runs);
    const next = { ...loaded, runs: evaluatedRuns };
    setState(next);

    const latestHistory = evaluatedRuns.history?.[0];
    if (latestHistory?.status === "failed") setFailureModalRun(latestHistory);
    if (latestHistory?.status === "completed") setCompletedModalRun(latestHistory);

    if (!next.auth.user) setScreen("auth");
    else if (next.runs.activeRun) setScreen("dashboard");
    else setScreen("landing");
  }, []);

  useEffect(() => {
    if (screen !== "loading") safeStorageSave(state);
  }, [state, screen]);

  useEffect(() => {
    if (screen === "loading") return;
    const interval = setInterval(() => {
      setState((prev) => {
        const nextRuns = evaluateRun(prev.runs);
        if (nextRuns.history?.[0] && prev.runs.history?.[0]?.id !== nextRuns.history[0].id) {
          if (nextRuns.history[0].status === "failed") setFailureModalRun(nextRuns.history[0]);
          if (nextRuns.history[0].status === "completed") setCompletedModalRun(nextRuns.history[0]);
        }
        if (!nextRuns.activeRun && screen === "dashboard") setScreen("landing");
        return { ...prev, runs: nextRuns };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screen]);

  const signUp = ({ name, email, password }) => {
    let response = null;
    setState((prev) => {
      const exists = prev.auth.users.some((u) => u.email === email);
      if (exists) {
        response = { error: "An account with this email already exists." };
        return prev;
      }
      const user = {
        id: crypto.randomUUID(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      };
      response = { ok: true };
      const next = {
        ...prev,
        auth: {
          users: [...prev.auth.users, user],
          user,
          session: { userId: user.id, createdAt: new Date().toISOString() },
        },
      };
      setScreen(next.runs.activeRun ? "dashboard" : "landing");
      return next;
    });
    return response;
  };

  const signIn = ({ email, password }) => {
    let response = null;
    setState((prev) => {
      const user = prev.auth.users.find((u) => u.email === email && u.password === password);
      if (!user) {
        response = { error: "Invalid email or password." };
        return prev;
      }
      response = { ok: true };
      const next = {
        ...prev,
        auth: {
          ...prev.auth,
          user,
          session: { userId: user.id, createdAt: new Date().toISOString() },
        },
      };
      setScreen(next.runs.activeRun ? "dashboard" : "landing");
      return next;
    });
    return response;
  };

  const signOut = () => {
    setState((prev) => ({ ...prev, auth: { ...prev.auth, user: null, session: null } }));
    setScreen("auth");
  };

  const createChallenge = ({ duration, rules, mission }) => {
    const newRun = createRun({ duration, rules, mission });
    setState((prev) => ({ ...prev, runs: { ...prev.runs, activeRun: newRun } }));
    setScreen("dashboard");
  };

  const updateRun = (updatedRun) => {
    setState((prev) => ({ ...prev, runs: { ...prev.runs, activeRun: updatedRun } }));
  };

  const dismissInstall = () => {
    setState((prev) => ({ ...prev, ui: { ...prev.ui, installedPromptDismissed: true } }));
  };

  const restartFromFailure = () => {
    setFailureModalRun(null);
    setScreen("onboarding");
  };

  const startNewRun = () => {
    if (state.runs.activeRun) return;
    setScreen("onboarding");
  };

  if (screen === "loading") {
    return <TopShell><div className="flex min-h-screen items-center justify-center text-slate-400">Loading Monk Mode...</div></TopShell>;
  }

  if (screen === "auth") {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  if (screen === "onboarding") {
    return <Onboarding onCreate={createChallenge} onCancel={() => setScreen(state.runs.activeRun ? "dashboard" : "landing")} />;
  }

  if (state.runs.activeRun) {
    return (
      <Dashboard
        user={state.auth.user}
        run={state.runs.activeRun}
        history={state.runs.history}
        ui={state.ui}
        onUpdateRun={updateRun}
        onStartNew={startNewRun}
        onDismissInstall={dismissInstall}
        onLogout={signOut}
        onRestartFromFailure={restartFromFailure}
        completedRun={completedModalRun}
        setCompletedRun={setCompletedModalRun}
        showFailureRun={failureModalRun}
        clearFailureModal={() => setFailureModalRun(null)}
      />
    );
  }

  return <Landing onStart={() => setScreen("onboarding")} historyCount={state.runs.history.length} user={state.auth.user} />;
}
