import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[local-state-guard] ${message}`);
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

if (!app.includes("function Onboarding(")) {
  replaceExact(
    `function BottomNav({ active, onTab }) {`,
    `function Onboarding({ onCreate, onCancel }) {
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(21);
  const [fastingType, setFastingType] = useState("sunrise");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [mission, setMission] = useState("");
  const [installRoutine, setInstallRoutine] = useState(true);
  const canCreate = mission.trim().length >= 12 && rules.every((rule) => rule.trim().length >= 3);
  const create = () => onCreate({ duration, rules, mission, fastingType, installRoutine });
  return <Shell><main className="mx-auto max-w-4xl pb-28"><div className="mb-5 flex items-center justify-between gap-3"><Brand /><Button onClick={onCancel} className="border border-white/10 bg-white/[.04] text-slate-300">Cancel</Button></div><Panel className="p-5 sm:p-6"><SectionTitle icon={step === 1 ? CalendarDays : step === 2 ? Target : BookOpen} title={step === 1 ? "Choose the season" : step === 2 ? "Define six commitments" : "Write the reason"} subtitle="Keep the fast sober, concrete, and Christward." />{step === 1 ? <><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{DURATIONS.map((days) => <button type="button" key={days} onClick={() => setDuration(days)} className={cn("min-h-20 rounded-[24px] border px-4 text-left transition", duration === days ? "border-blue-300/35 bg-blue-500/15 shadow-[0_0_30px_rgba(37,99,235,.16)]" : "border-white/10 bg-white/[.035]")}><div className="text-2xl font-semibold">{days}</div><div className="text-xs uppercase tracking-[.2em] text-slate-500">days</div></button>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{FASTING_TYPES.map(([id, title, description]) => <button type="button" key={id} onClick={() => setFastingType(id)} className={cn("rounded-[24px] border p-4 text-left transition", fastingType === id ? "border-blue-300/35 bg-blue-500/15 shadow-[0_0_30px_rgba(37,99,235,.16)]" : "border-white/10 bg-white/[.035]")}><div className="font-semibold">{title}</div><div className="mt-2 text-sm leading-6 text-slate-400">{description}</div></button>)}</div></> : null}{step === 2 ? <div className="mt-6 grid gap-3">{rules.map((rule, index) => <label key={index}><span className="mb-2 block text-xs uppercase tracking-[.2em] text-slate-500">Commitment {index + 1}</span><Input value={rule} onChange={(event) => setRules(rules.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}</div> : null}{step === 3 ? <><Textarea value={mission} onChange={(event) => setMission(event.target.value)} className="mt-6" placeholder="Lord Jesus, I am fasting to seek You with an undivided heart..." /><button type="button" onClick={() => setInstallRoutine(!installRoutine)} className={cn("mt-4 flex w-full items-center justify-between rounded-[24px] border p-4 text-left transition", installRoutine ? "border-blue-300/25 bg-blue-500/12" : "border-white/10 bg-white/[.035]")}><div><div className="text-sm font-semibold">Install Daily Rule routine</div><div className="mt-1 text-sm text-slate-500">Adds your launch, training, and shutdown routine as editable XP commands.</div></div>{installRoutine ? <Check className="h-5 w-5 text-blue-100" /> : <Plus className="h-5 w-5 text-slate-500" />}</button></> : null}</Panel><div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#02040a]/90 px-[max(18px,env(safe-area-inset-left))] pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"><div className="mx-auto flex max-w-4xl gap-3"><Button onClick={() => { setStep((current) => Math.max(1, current - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={step === 1} className="flex-1 border border-white/10 bg-white/[.04] text-slate-300">Back</Button>{step < 3 ? <Button onClick={() => { setStep((current) => Math.min(3, current + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex-[1.4] bg-blue-600 text-white">Continue</Button> : <Button disabled={!canCreate} onClick={create} className="flex-[1.4] bg-blue-600 text-white">Lock the Fast</Button>}</div></div></main></Shell>;
}
function BottomNav({ active, onTab }) {`,
    "local onboarding component"
  );
}

replacePattern(
  /  const createFast = \(payload\) => \{\n    audio\.unlock\(\);\n    setScreen\("app"\);\n    commitState\(\(current\) => \(\{ \.\.\.current, ui: \{ \.\.\.current\.ui, activeTab: "today" \}, runs: \{ \.\.\.current\.runs, activeRun: makeRun\(payload\) \} \}\)\);\n  \};/,
  `  const createFast = (payload) => {
    audio.unlock();
    setScreen("app");
    commitState((current) => {
      const next = { ...current, ui: { ...current.ui, activeTab: "today" }, runs: { ...current.runs, activeRun: makeRun(payload) } };
      return payload.installRoutine ? applyPresetToState(next, "dailyRule") : next;
    });
  };`,
  "atomic fast creation",
  `applyPresetToState(next, "dailyRule")`
);

replaceExact(
  `  const updateTodo = (todoId, patch) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.map((todo) => todo.id === todoId ? normalizeTodo({ ...todo, ...patch, id: todo.id }) : todo) } }));`,
  `  const updateTodo = (todoId, patch) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.map((todo) => todo.id === todoId ? normalizeTodo({ ...todo, ...patch, id: todo.id }) : todo) } }));
  const deleteTodo = (todoId) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.filter((todo) => todo.id !== todoId) }, plans: { byDate: Object.fromEntries(Object.entries(current.plans.byDate).map(([key, plan]) => [key, { ...plan, topTaskIds: (plan.topTaskIds || []).filter((id) => id !== todoId), firstTaskId: plan.firstTaskId === todoId ? "" : plan.firstTaskId }])) } }));`,
  "delete todo state handler"
);

replacePattern(
  /  const seedPreset = \(presetId, silent = false\) => commitState\(\(current\) => \{\n[\s\S]*?\n  \}\);\n  const lockPlan =/,
  `  const applyPresetToState = (current, presetId, silent = false) => {
    const preset = presetById(presetId);
    const existingTitles = new Set(current.xp.todos.map((todo) => todo.title + "-" + todo.category));
    const additions = preset.tasks.filter(([title, category]) => !existingTitles.has(title + "-" + category)).map(([title, category, xp, phase, description], index) => normalizeTodo({ title, category, xp, phase, description, today: true, dueDate: todayKey(), recurrence: preset.id === "dailyRule" ? "daily" : "none", sourcePresetId: preset.id, createdAt: new Date(Date.now() + index).toISOString() }));
    const rewards = silent ? current.xp.rewards : addRewardEvent(current.xp.rewards, { type: "preset", title: preset.title + " installed", amount: preset.id === "dailyRule" ? 75 : 30, dateKey: todayKey(), presetId: preset.id });
    return { ...current, xp: { ...current.xp, todos: [...additions, ...current.xp.todos], rewards }, prep: { ...current.prep, activePreset: preset.id } };
  };
  const seedPreset = (presetId, silent = false) => commitState((current) => applyPresetToState(current, presetId, silent));
  const lockPlan =`,
  "shared preset applier",
  "const applyPresetToState = (current, presetId, silent = false) =>"
);

app = app.replace(
  `if (screen === "onboarding") return <Onboarding onCreate={createFast} onCancel={() => setScreen("app")} onApplyRoutine={seedPreset} />;`,
  `if (screen === "onboarding") return <Onboarding onCreate={createFast} onCancel={() => setScreen("app")} />;`
);

replaceExact(
  `onUpdateTodo={updateTodo} onLockPlan=`,
  `onUpdateTodo={updateTodo} onDeleteTodo={deleteTodo} onLockPlan=`,
  "command app delete wiring"
);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[local-state-guard] restored local state hardening");
}

const finalApp = readFileSync(appPath, "utf8");
const required = [
  `function Onboarding(`,
  `applyPresetToState(next, "dailyRule")`,
  "setStep((current) => Math.min(3, current + 1))",
  "setStep((current) => Math.max(1, current - 1))",
  "window.scrollTo({ top: 0, behavior: \"smooth\" })",
  "const deleteTodo =",
  "onDeleteTodo={deleteTodo}",
  "const applyPresetToState = (current, presetId, silent = false) =>",
];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
if (finalApp.includes("onApplyRoutine")) fail("stale onboarding routine callback remains");
console.log("[local-state-guard] local state checks passed");
