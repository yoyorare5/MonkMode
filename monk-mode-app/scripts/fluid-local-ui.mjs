import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[fluid-local-ui] ${message}`);
}

function replaceExact(before, after, label) {
  if (app.includes(after)) return;
  if (!app.includes(before)) fail(`Could not patch ${label}`);
  app = app.replace(before, after);
}

function replacePattern(pattern, replacement, label, marker) {
  if (marker && app.includes(marker)) return;
  if (!pattern.test(app)) fail(`Could not patch ${label}`);
  app = app.replace(pattern, replacement);
}

app = app.replace('import { createClient } from "@supabase/supabase-js";\n', "");

replaceExact(
  `const STORAGE_KEY = "fasting_mode_cloud_v1";`,
  `const STORAGE_KEY = "fasting_mode_local_v2";`,
  "local storage key",
);

replaceExact(
  `const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);
const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;`,
  `const VAPID_PUBLIC_KEY = "";
const LOCAL_USER = { id: "local", name: "Local device", email: "stored on this iPhone/browser" };
const LOCAL_SYNC = { status: "local", label: "Local", message: "Stored locally on this iPhone/browser. No login or cloud account is required." };
const supabaseReady = false;`,
  "local-only constants",
);

replacePattern(
  /const pageMotion = \{[\s\S]*?\};\nconst cardMotion = \{[\s\S]*?\};/,
  `const pageMotion = {
  initial: { opacity: 0, y: 24, scale: 0.982, filter: "blur(18px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -18, scale: 0.99, filter: "blur(12px)" },
  transition: { duration: 0.56, ease: [0.16, 1, 0.3, 1] },
};
const cardMotion = {
  initial: { opacity: 0, y: 26, scale: 0.955, rotateX: 4, filter: "blur(14px)" },
  animate: { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
};`,
  "fluid motion constants",
  `scale: 0.982, filter: "blur(18px)"`,
);

replacePattern(
  /function Auth\(\{[\s\S]*?\n\}\nfunction BottomNav/,
  `function Auth({ onLocal, ui, onSound }) {
  return <Shell>
    <main className="local-welcome mx-auto grid min-h-dvh w-full max-w-lg place-items-center px-4 pb-[calc(26px+env(safe-area-inset-bottom))] pt-[calc(18px+env(safe-area-inset-top))]">
      <motion.section initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(18px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }} className="local-welcome-card relative w-full overflow-hidden rounded-[42px] border border-white/10 bg-black/55 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="local-welcome-orbit" aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="brand-orb brand-orb--small"><img src="/favicon.svg" alt="" /></div>
            <div>
              <div className="text-sm font-black uppercase tracking-[.34em] text-white">Fasting Mode</div>
              <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-[.22em] text-slate-500">Local command system</div>
            </div>
          </div>
          <button onClick={onSound} className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[.045] text-slate-200 shadow-xl" aria-label="Toggle sound">
            {ui.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.58, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 mt-16 text-center">
          <Badge className="mx-auto border border-sky-300/25 bg-sky-300/10 text-sky-100"><ShieldCheck className="mr-2 h-4 w-4" />Stored on this device</Badge>
          <h1 className="mt-6 text-5xl font-black leading-[.92] tracking-[-.05em] text-white sm:text-6xl">Enter<br /><span className="fluid-text-blue">Fasting Mode.</span></h1>
          <p className="mx-auto mt-5 max-w-sm text-base font-semibold leading-7 text-slate-300">Strict commitments. Prayerful execution. Local reliability with no broken login gate.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.58, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 mt-14 rounded-[32px] border border-white/10 bg-white/[.055] p-3 shadow-2xl backdrop-blur-xl">
          <Button onClick={onLocal} className="w-full rounded-[26px] bg-[linear-gradient(135deg,#123cba,#0a1d68)] py-4 text-white shadow-[0_0_36px_rgba(23,86,214,.32)]"><ArrowRight className="mr-2 h-5 w-5" />Enter Fasting Mode</Button>
          <Button onClick={onLocal} className="mt-3 w-full rounded-[26px] border border-white/10 bg-black/35 py-4 text-slate-200"><Sparkles className="mr-2 h-5 w-5" />Continue on this device</Button>
        </motion.div>
        <p className="relative z-10 mt-5 text-center text-xs font-semibold text-slate-500">Your discipline. Your data. Stored locally.</p>
      </motion.section>
    </main>
  </Shell>;
}
function BottomNav`,
  "local welcome screen",
  "function Auth({ onLocal, ui, onSound })",
);

replaceExact(
  `function DangerMeter({ danger, seconds }) {`,
  `function FluidOrbit({ state, seconds, danger }) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const strictDone = day?.completedRuleIds.length || 0;
  const dateKey = todayKey();
  const todayTodos = state.xp.todos.filter((todo) => todo.today || todo.dueDate === dateKey);
  const todayDone = todayTodos.filter((todo) => todo.status === "completed" && todo.completedDateKey === dateKey).length;
  const fastPercent = run ? Math.min(100, Math.round(((run.currentDay - 1 + strictDone / 6) / run.duration) * 100)) : 0;
  const dailyPercent = run ? Math.min(100, Math.round((strictDone / 6) * 100)) : 0;
  const [, typeTitle] = run ? fastType(run.fastingType) : ["", "No active fast"];
  return <motion.section {...cardMotion} className={cn("fluid-orbit-card", danger.level === "critical" && "is-critical", danger.level === "danger" && "is-danger")} style={{ "--orbit-progress": String(Math.max(14, dailyPercent) * 3.6) + "deg" }}>
    <div className="fluid-orbit-bg" aria-hidden="true" />
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[0.68rem] font-black uppercase tracking-[.34em] text-sky-200/80">Current fast</div>
        <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-white">{run ? "Day " + run.currentDay + " of " + run.duration : "Begin the fast"}</h2>
        <p className="mt-2 line-clamp-2 max-w-[18rem] text-sm font-semibold leading-6 text-slate-400">{run ? typeTitle : "Set the six strict commitments and start local command."}</p>
      </div>
      <div className="shrink-0 rounded-[28px] border border-white/10 bg-black/35 px-4 py-3 text-center shadow-xl">
        <div className="text-[0.62rem] font-black uppercase tracking-[.3em] text-sky-200/75">Kept</div>
        <div className="mt-1 text-3xl font-black text-white">{wonDays(run)}</div>
      </div>
    </div>
    <div className="fluid-orbit-wrap relative z-10 mt-7">
      <div className="fluid-orbit-ring" aria-hidden="true"><div className="fluid-orbit-core" /></div>
      <div className="fluid-orbit-copy">
        <div className="text-[0.68rem] font-black uppercase tracking-[.34em] text-sky-200/80">Time left today</div>
        <div className="mt-2 text-5xl font-black tracking-[-.06em] text-white sm:text-6xl">{countdown(seconds)}</div>
        <div className="mt-3 text-sm font-semibold text-slate-400">Daily reset at midnight New York time</div>
      </div>
    </div>
    <div className="relative z-10 mt-7 grid grid-cols-3 overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-xl">
      <StatCard label="Strict" value={String(strictDone) + "/6"} />
      <StatCard label="Fast" value={String(fastPercent) + "%"} />
      <StatCard label="XP" value={String(todayDone) + "/" + String(Math.max(todayTodos.length, 1))} />
    </div>
  </motion.section>;
}
function DangerMeter({ danger, seconds }) {`,
  "fluid orbit card",
);

if (app.includes(`<IdentityStrip state={state} danger={danger} /><CommandCenter state={state} run={run} danger={danger} /><DangerMeter danger={danger} seconds={seconds} />`)) {
  app = app.replace(
    `<IdentityStrip state={state} danger={danger} /><CommandCenter state={state} run={run} danger={danger} /><DangerMeter danger={danger} seconds={seconds} />`,
    `<IdentityStrip state={state} danger={danger} /><FluidOrbit state={state} seconds={seconds} danger={danger} /><CommandCenter state={state} run={run} danger={danger} /><DangerMeter danger={danger} seconds={seconds} />`,
  );
} else if (!app.includes(`<FluidOrbit state={state} seconds={seconds} danger={danger} />`)) {
  replaceExact(
    `<DangerMeter danger={danger} seconds={seconds} />`,
    `<FluidOrbit state={state} seconds={seconds} danger={danger} /><DangerMeter danger={danger} seconds={seconds} />`,
    "fluid orbit placement",
  );
}

const localTextReplacements = [
  ["Synced mode", "Local mode"],
  ["Device-only fallback.", "Stored locally on this device."],
  ["Saved on this device.", "Stored locally on this device."],
  ["Cloud sync is used when Supabase is connected. Device cache remains available as fallback.", "Everything is stored locally on this iPhone/browser. No login or cloud account is required."],
  ["Cloud sync with local cache fallback.", "Stored locally with browser cache persistence."],
  ["Reload cloud", "Save local record"],
  ["Reset local cache", "Reset local record"],
  ["Sign out", "Return to Command"],
  ["Cloud record remains available.", "No cloud record is used."],
  ["Push subscription storage is ready for server-side scheduling.", "Local warning hooks stay ready while the app is open."],
  ["Loading Fasting Mode...", "Opening Fasting Mode..."],
];
for (const [before, after] of localTextReplacements) app = app.split(before).join(after);

app = app.replace(
  `  const Icon = sync.status === "synced" ? Cloud : sync.status === "error" ? WifiOff : CloudOff;`,
  `  const Icon = Smartphone;`,
);

replacePattern(
  /export default function App\(\) \{[\s\S]*$/,
  `export default function App() {
  const [state, setState] = useState(() => {
    const local = loadLocal();
    const evaluated = normalizeState({ ...local, runs: evaluateRuns(local.runs), ui: { ...local.ui, activeTab: "today" } });
    saveLocal(evaluated);
    return evaluated;
  });
  const [screen, setScreen] = useState("app");
  const [sync, setSync] = useState(LOCAL_SYNC);
  const stateRef = useRef(state);
  const audio = useAudio(state.ui.soundEnabled);
  const user = LOCAL_USER;
  useEffect(() => { stateRef.current = state; }, [state]);
  const persist = useCallback((next) => {
    const normalized = normalizeState(next);
    setState(normalized);
    saveLocal(normalized);
    setSync(LOCAL_SYNC);
  }, []);
  const commitState = useCallback((updater) => {
    const current = stateRef.current;
    const next = typeof updater === "function" ? updater(current) : updater;
    persist(next);
  }, [persist]);
  useEffect(() => { registerWorker(); }, []);
  useEffect(() => {
    if (screen !== "app") return undefined;
    const tick = () => {
      const current = stateRef.current;
      const before = current.runs.activeRun;
      const runs = evaluateRuns(current.runs);
      if (JSON.stringify(runs) === JSON.stringify(current.runs)) return;
      const archived = before && !runs.activeRun ? runs.history.find((run) => run.id === before.id) : null;
      if (archived?.status === "completed") audio.play("completion");
      if (archived?.status === "failed") audio.play("failure");
      persist({ ...current, runs, ui: { ...current.ui, activeTab: "today" } });
    };
    tick();
    const timer = setInterval(tick, 15000);
    return () => clearInterval(timer);
  }, [audio, persist, screen]);
  const updateUi = (patch) => commitState((current) => ({ ...current, ui: { ...current.ui, ...patch } }));
  const toggleSound = () => {
    const enabled = !stateRef.current.ui.soundEnabled;
    if (enabled) audio.unlock();
    updateUi({ soundEnabled: enabled });
  };
  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    updateUi({ notificationsEnabled: permission === "granted", permission });
    if (permission === "granted") await registerWorker();
  };
  const disableNotifications = () => updateUi({ notificationsEnabled: false });
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
      const updatedRun = { ...run, days: run.days.map((item) => item.dayNumber === run.currentDay ? { ...item, completedRuleIds: completed } : item) };
      const next = normalizeState({ ...current, runs: evaluateRuns({ activeRun: updatedRun, history: current.runs.history }) });
      return awardStrictBonuses(next);
    });
  };
  const createTodo = (draft) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: [normalizeTodo({ ...draft, id: newId(), status: "open", createdAt: new Date().toISOString() }), ...current.xp.todos] } }));
  const updateTodo = (todoId, patch) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.map((todo) => todo.id === todoId ? normalizeTodo({ ...todo, ...patch, id: todo.id }) : todo) } }));
  const completeTodo = (todoId) => {
    audio.unlock();
    audio.play("xp");
    vibrate([10]);
    commitState((current) => {
      const todo = current.xp.todos.find((item) => item.id === todoId);
      if (!todo || todo.status === "completed") return current;
      const dateKey = todayKey();
      const comboCount = current.xp.rewards.lastCompletionDayKey === dateKey ? Math.min(12, current.xp.rewards.comboCount + 1) : 1;
      let rewards = addRewardEvent({ ...current.xp.rewards, comboCount, lastCompletionAt: new Date().toISOString(), lastCompletionDayKey: dateKey }, { type: "todo", title: todo.title, amount: todo.xp, dateKey });
      if (comboCount > 1) rewards = addRewardEvent({ ...rewards, comboCount }, { type: "combo", title: String(comboCount) + "x command combo", amount: Math.min(50, (comboCount - 1) * 5), dateKey });
      const completed = { ...todo, status: "completed", completedAt: new Date().toISOString(), completedDateKey: dateKey, today: false };
      const recurring = todo.recurrence !== "none" ? normalizeTodo({ ...todo, id: newId(), status: "open", completedAt: null, completedDateKey: null, today: false, dueDate: nextDueDate(todo.recurrence, dateKey), createdAt: new Date().toISOString(), lastGeneratedFrom: todo.id }) : null;
      const todos = current.xp.todos.map((item) => item.id === todoId ? completed : item);
      return checkPerfectDay(normalizeState({ ...current, xp: { todos: recurring ? [recurring, ...todos] : todos, rewards } }));
    });
  };
  const sendToday = (todoId) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.map((todo) => todo.id === todoId ? { ...todo, today: true, dueDate: todo.dueDate || todayKey() } : todo) } }));
  const seedPreset = (presetId, silent = false) => commitState((current) => {
    const preset = presetById(presetId);
    const existingTitles = new Set(current.xp.todos.map((todo) => todo.title + "-" + todo.category));
    const additions = preset.tasks.filter(([title, category]) => !existingTitles.has(title + "-" + category)).map(([title, category, xp, phase, description], index) => normalizeTodo({ title, category, xp, phase, description, today: true, dueDate: todayKey(), recurrence: preset.id === "dailyRule" ? "daily" : "none", sourcePresetId: preset.id, createdAt: new Date(Date.now() + index).toISOString() }));
    const rewards = silent ? current.xp.rewards : addRewardEvent(current.xp.rewards, { type: "preset", title: preset.title + " installed", amount: preset.id === "dailyRule" ? 75 : 30, dateKey: todayKey(), presetId: preset.id });
    return { ...current, xp: { ...current.xp, todos: [...additions, ...current.xp.todos], rewards }, prep: { ...current.prep, activePreset: preset.id } };
  });
  const lockPlan = (dateKey, plan) => commitState((current) => {
    const normalized = normalizePlan({ ...plan, dateKey, lockedAt: new Date().toISOString() }, dateKey);
    return { ...current, plans: { byDate: { ...current.plans.byDate, [dateKey]: normalized } }, prep: { ...current.prep, activePreset: normalized.presetId, checklists: { ...current.prep.checklists, [dateKey]: current.prep.checklists[dateKey] || makeChecklist(normalized.presetId) } } };
  });
  const togglePrep = (dateKey, section, itemId, presetId) => commitState((current) => {
    const checklist = current.prep.checklists[dateKey] || makeChecklist(presetId || current.prep.activePreset);
    const updated = { ...checklist, [section]: checklist[section].map((item) => item.id === itemId ? { ...item, done: !item.done } : item) };
    return { ...current, prep: { ...current.prep, checklists: { ...current.prep.checklists, [dateKey]: updated } } };
  });
  const markSecuredSeen = useCallback((dayNumber) => commitState((current) => {
    const run = current.runs.activeRun;
    if (!run) return current;
    return { ...current, runs: { ...current.runs, activeRun: { ...run, securedAnimationSeenFor: dayNumber } } };
  }), [commitState]);
  const resetLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = normalizeState(clone(DEFAULT_STATE));
    setState(fresh);
    saveLocal(fresh);
    setSync({ ...LOCAL_SYNC, message: "Local record cleared. Start again from this device." });
  };
  if (screen === "onboarding") return <Onboarding onCreate={createFast} onCancel={() => setScreen("app")} onApplyRoutine={seedPreset} />;
  return <CommandApp user={user} state={state} sync={sync} onStart={() => setScreen("onboarding")} onUpdateUi={updateUi} onToggleRule={toggleRule} onCreateTodo={createTodo} onCompleteTodo={completeTodo} onSendToday={sendToday} onUpdateTodo={updateTodo} onLockPlan={lockPlan} onTogglePrep={togglePrep} onSeedPreset={seedPreset} onSound={toggleSound} onNotify={state.ui.notificationsEnabled ? disableNotifications : enableNotifications} onReset={resetLocal} onReload={() => persist(stateRef.current)} onSignOut={() => updateUi({ activeTab: "today" })} onMarkSecuredSeen={markSecuredSeen} audio={audio} />;
}
`,
  "local-only app root",
  "const user = LOCAL_USER;",
);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[fluid-local-ui] applied local-only fluid UI transformation");
}

const finalApp = readFileSync(appPath, "utf8");
const forbidden = ["@supabase/supabase-js", "createClient(", "supabase.auth", "supabase.from(", "loadCloud", "signIn", "signUp", "session?.user"];
for (const marker of forbidden) {
  if (finalApp.includes(marker)) fail(`Supabase/auth marker remains: ${marker}`);
}
const required = ["LOCAL_USER", "LOCAL_SYNC", "FluidOrbit", "local-welcome", "Stored locally", "const user = LOCAL_USER"];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
console.log("[fluid-local-ui] local UI checks passed");
