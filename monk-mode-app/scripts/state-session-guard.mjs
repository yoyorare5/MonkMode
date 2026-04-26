import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[state-session-guard] ${message}`);
}

function replaceExact(before, after, label) {
  if (app.includes(after)) return;
  if (!app.includes(before)) fail(`Could not patch ${label}`);
  app = app.replace(before, after);
}

if (!app.includes("const DEVICE_SESSION_KEY")) {
  replaceExact(
    'const STORAGE_KEY = "fasting_mode_cloud_v1";',
    'const STORAGE_KEY = "fasting_mode_cloud_v1";\nconst DEVICE_SESSION_KEY = "fasting_mode_device_session_v1";',
    "device session key",
  );
}

replaceExact(
  'new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })',
  'new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })',
  "New York midnight hour cycle",
);

const helperAnchor = 'const maskEmail = (email = "") => (email.includes("@") ? `${email.slice(0, 2)}***@${email.split("@")[1]}` : email);\n';
const helperBlock = `${helperAnchor}
function todoRoutineIndex(todo = {}) {
  const explicit = Number(todo.routineOrder);
  if (Number.isFinite(explicit)) return explicit;
  const title = String(todo.title || "").trim().toLowerCase();
  const category = String(todo.category || "").trim().toLowerCase();
  const sourcePreset = todo.sourcePresetId || "";
  let fallback = 9000;
  PREP_PRESETS.forEach((preset, presetIndex) => {
    preset.tasks.forEach(([taskTitle, taskCategory], taskIndex) => {
      if (String(taskTitle).trim().toLowerCase() !== title) return;
      if (category && String(taskCategory).trim().toLowerCase() !== category) return;
      const sourceBonus = sourcePreset && sourcePreset === preset.id ? -100 : 0;
      fallback = Math.min(fallback, presetIndex * 1000 + taskIndex + 1 + sourceBonus);
    });
  });
  if (fallback !== 9000) return fallback;
  const phaseIndex = ROUTINE_PHASES.indexOf(todo.phase);
  return (phaseIndex >= 0 ? 6000 + phaseIndex * 100 : 8800) + String(todo.title || "").localeCompare("");
}

function compareTodos(a = {}, b = {}) {
  const statusScore = (todo) => (todo.status === "completed" ? 1 : 0);
  const statusDelta = statusScore(a) - statusScore(b);
  if (statusDelta) return statusDelta;
  const today = todayKey();
  const dueScore = (todo) => (todo.dueDate === today || todo.today ? 0 : todo.dueDate ? 1 : 2);
  const dueDelta = dueScore(a) - dueScore(b);
  if (dueDelta) return dueDelta;
  const routineDelta = todoRoutineIndex(a) - todoRoutineIndex(b);
  if (routineDelta) return routineDelta;
  return String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || String(a.title || "").localeCompare(String(b.title || ""));
}
`;
if (!app.includes("function compareTodos(")) {
  replaceExact(helperAnchor, helperBlock, "routine ordering helpers");
}

replaceExact(
  "    lastGeneratedFrom: todo.lastGeneratedFrom || null,\n  };",
  "    lastGeneratedFrom: todo.lastGeneratedFrom || null,\n    routineOrder: Number.isFinite(Number(todo.routineOrder)) ? Number(todo.routineOrder) : todoRoutineIndex(todo),\n  };",
  "todo routine order field",
);

replaceExact(
  "    xp: { todos: Array.isArray(state.xp?.todos) ? state.xp.todos.map(normalizeTodo) : [], rewards: normalizeRewards(state.xp?.rewards) },",
  "    xp: { todos: Array.isArray(state.xp?.todos) ? state.xp.todos.map(normalizeTodo).sort(compareTodos) : [], rewards: normalizeRewards(state.xp?.rewards) },",
  "normalized todo ordering",
);

replaceExact(
  "    if (primary) return normalizeState(JSON.parse(primary));",
  "    if (primary) return evaluateAppState(normalizeState(JSON.parse(primary)));",
  "primary local evaluation",
);
replaceExact(
  "      if (value) return normalizeState(JSON.parse(value));",
  "      if (value) return evaluateAppState(normalizeState(JSON.parse(value)));",
  "legacy local evaluation",
);
replaceExact(
  "    return clone(DEFAULT_STATE);",
  "    return evaluateAppState(clone(DEFAULT_STATE));",
  "fallback local evaluation",
);
replaceExact(
  "  return clone(DEFAULT_STATE);\n}\nfunction saveLocal",
  "  return evaluateAppState(clone(DEFAULT_STATE));\n}\nfunction saveLocal",
  "empty local evaluation",
);

const evaluateAnchor = `function evaluateRuns(runs) {
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
`;
if (!app.includes("function evaluateAppState(")) {
  replaceExact(
    evaluateAnchor,
    `${evaluateAnchor}function evaluateAppState(state, options = {}) {
  const normalized = normalizeState(state);
  const evaluated = normalizeState({ ...normalized, runs: evaluateRuns(normalized.runs) });
  return options.enterCommand ? { ...evaluated, ui: { ...evaluated.ui, activeTab: "today" } } : evaluated;
}

function readDeviceSession() {
  try {
    return localStorage.getItem(DEVICE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDeviceSession(enabled) {
  try {
    if (enabled) localStorage.setItem(DEVICE_SESSION_KEY, "1");
    else localStorage.removeItem(DEVICE_SESSION_KEY);
  } catch {
    /* Device session persistence is best-effort. */
  }
}
`,
    "state evaluation and device session helpers",
  );
}

replaceExact(
  '  const todayTask = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === dateKey)).sort((a, b) => b.xp - a.xp)[0];',
  '  const todayTask = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === dateKey)).sort(compareTodos)[0];',
  "next-action todo order",
);
replaceExact(
  '  const todayTasks = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === todayKey())).slice(0, 4);',
  '  const todayTasks = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === todayKey())).sort(compareTodos).slice(0, 4);',
  "command today task order",
);
replaceExact(
  '  const openTodos = state.xp.todos.filter((todo) => todo.status === "open");',
  '  const openTodos = state.xp.todos.filter((todo) => todo.status === "open").sort(compareTodos);',
  "open todo order",
);
replaceExact(
  '  const open = state.xp.todos.filter((todo) => todo.status === "open");',
  '  const open = state.xp.todos.filter((todo) => todo.status === "open").sort(compareTodos);',
  "execute screen todo order",
);

const activeAnchor = '  const active = state.ui.activeTab || "today";\n';
if (!app.includes("window.scrollTo(0, 0);")) {
  replaceExact(
    activeAnchor,
    `${activeAnchor}  useEffect(() => {
    const frame = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(frame);
  }, [active]);
`,
    "tab scroll reset",
  );
}

replaceExact(
  "  const [localMode, setLocalMode] = useState(!supabaseReady);",
  "  const [localMode, setLocalMode] = useState(() => readDeviceSession() || !supabaseReady);",
  "initial local mode session",
);

replaceExact(
  `    if (!nextSession?.user || !supabaseReady) {
      setScreen(localMode ? "app" : "auth");
      return;
    }`,
  `    if (!nextSession?.user || !supabaseReady) {
      const local = evaluateAppState(loadLocal(), { enterCommand: true });
      setState(local);
      saveLocal(local);
      setScreen(localMode || readDeviceSession() || !supabaseReady ? "app" : "auth");
      return;
    }`,
  "local cloud fallback entry",
);

replaceExact(
  "      const evaluated = normalizeState({ ...cloud, runs: evaluateRuns(cloud.runs) });",
  '      const evaluated = evaluateAppState(cloud, { enterCommand: true });',
  "cloud entry evaluation",
);

replaceExact(
  `    } catch (error) {
      setState(loadLocal());
      setScreen("app");
      setSync({ status: "error", label: "Offline", message: error.message || "Using local cache." });
    }`,
  `    } catch (error) {
      const local = evaluateAppState(loadLocal(), { enterCommand: true });
      setState(local);
      saveLocal(local);
      setScreen("app");
      setSync({ status: "error", label: "Offline", message: error.message || "Using local cache." });
    }`,
  "offline local entry evaluation",
);

replaceExact(
  `    if (!supabaseReady) {
      setScreen("app");
      return undefined;
    }`,
  `    if (!supabaseReady) {
      writeDeviceSession(true);
      const local = evaluateAppState(stateRef.current, { enterCommand: true });
      setState(local);
      saveLocal(local);
      setLocalMode(true);
      setScreen("app");
      return undefined;
    }`,
  "no-supabase local entry",
);

replaceExact(
  `      if (nextSession) {
        setLocalMode(false);
        loadCloud(nextSession);
      } else {`,
  `      if (nextSession) {
        writeDeviceSession(false);
        setLocalMode(false);
        loadCloud(nextSession);
      } else {`,
  "cloud session clears local flag",
);

replaceExact(
  `  useEffect(() => {
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
  }, [audio, persist, screen]);`,
  `  useEffect(() => {
    if (screen !== "app") return undefined;
    const evaluateNow = () => {
      const current = stateRef.current;
      const before = current.runs.activeRun;
      const evaluated = evaluateAppState(current);
      if (JSON.stringify(evaluated) === JSON.stringify(current)) return;
      const archived = before && !evaluated.runs.activeRun ? evaluated.runs.history.find((run) => run.id === before.id) : null;
      if (archived?.status === "completed") audio.play("completion");
      if (archived?.status === "failed") audio.play("failure");
      persist(evaluated);
    };
    evaluateNow();
    const timer = setInterval(evaluateNow, 15000);
    const onForeground = () => {
      if (document.visibilityState === "hidden") return;
      evaluateNow();
    };
    window.addEventListener("focus", onForeground);
    window.addEventListener("pageshow", onForeground);
    document.addEventListener("visibilitychange", onForeground);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onForeground);
      window.removeEventListener("pageshow", onForeground);
      document.removeEventListener("visibilitychange", onForeground);
    };
  }, [audio, persist, screen]);`,
  "immediate foreground day evaluation",
);

replaceExact(
  'onLocal={() => { setSession(null); setLocalMode(true); setAuthMessage(""); setScreen("app"); }}',
  'onLocal={() => { writeDeviceSession(true); const local = evaluateAppState(stateRef.current, { enterCommand: true }); setState(local); saveLocal(local); setSession(null); setLocalMode(true); setAuthMessage(""); setScreen("app"); }}',
  "local device entry callback",
);

replaceExact(
  'onSignOut={async () => { if (supabaseReady && session) await supabase.auth.signOut(); setSession(null); setLocalMode(!supabaseReady); setScreen(supabaseReady ? "auth" : "app"); }}',
  'onSignOut={async () => { writeDeviceSession(false); if (supabaseReady && session) await supabase.auth.signOut(); setSession(null); setLocalMode(!supabaseReady); setScreen(supabaseReady ? "auth" : "app"); }}',
  "sign out clears device session",
);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[state-session-guard] patched day rollover, task order, and device session");
}

const finalApp = readFileSync(appPath, "utf8");
const required = [
  "DEVICE_SESSION_KEY",
  'hourCycle: "h23"',
  "function compareTodos(",
  "routineOrder",
  "evaluateAppState",
  "readDeviceSession",
  "writeDeviceSession",
  ".sort(compareTodos).slice(0, 4)",
  "requestAnimationFrame(() => window.scrollTo(0, 0))",
  "setInterval(evaluateNow, 15000)",
  "writeDeviceSession(true); const local = evaluateAppState",
];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
console.log("[state-session-guard] state/session checks passed");
