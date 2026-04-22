import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = process.cwd();
const repoRoot = resolve(appRoot, "..");
const appPath = resolve(appRoot, "src", "App.jsx");
const packagePath = resolve(appRoot, "package.json");
const htmlPath = resolve(appRoot, "index.html");
const manifestPath = resolve(appRoot, "public", "manifest.webmanifest");
const serviceWorkerPath = resolve(appRoot, "public", "sw.js");
const netlifyPath = resolve(repoRoot, "netlify.toml");

function fail(message) {
  throw new Error(`[release-hardening] ${message}`);
}

function replaceExact(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) fail(`Could not patch ${label}`);
  return source.replace(before, after);
}

function replacePattern(source, pattern, replacement, label, marker) {
  if (marker && source.includes(marker)) return source;
  if (!pattern.test(source)) fail(`Could not patch ${label}`);
  return source.replace(pattern, replacement);
}

let app = readFileSync(appPath, "utf8");
const original = app;

app = replaceExact(app, "function Onboarding({ onCreate, onCancel, onApplyRoutine })", "function Onboarding({ onCreate, onCancel })", "onboarding routine prop");
app = replacePattern(
  app,
  /const create = \(\) => \{\n\s+onCreate\(\{ duration, rules, mission, fastingType \}\);\n\s+if \(installRoutine\) onApplyRoutine\("dailyRule", true\);\n\s+\};/,
  `const create = () => {\n    onCreate({ duration, rules, mission, fastingType, installRoutine });\n  };`,
  "atomic onboarding create",
  "onCreate({ duration, rules, mission, fastingType, installRoutine });"
);
app = replaceExact(app, "function TaskCard({ task, onComplete, onToday, onUpdate })", "function TaskCard({ task, onComplete, onToday, onUpdate, onDelete })", "task delete prop");
app = replaceExact(
  app,
  `<Button onClick={() => onComplete(task.id)} className="shrink-0 bg-blue-600 text-white">Done</Button>`,
  `{task.status === "completed" ? <Badge className="shrink-0 border border-blue-300/20 bg-blue-500/10 text-blue-100">Complete</Badge> : <Button onClick={() => onComplete(task.id)} className="shrink-0 bg-blue-600 text-white">Done</Button>}`,
  "completed task action state"
);
app = replaceExact(
  app,
  `<div className="mt-3 grid grid-cols-2 gap-2">{!task.today && onToday ? <Button onClick={() => onToday(task.id)} className="border border-white/10 bg-white/[.04] text-slate-300">Today</Button> : null}<Button onClick={() => setEditing(true)} className={cn("border border-white/10 bg-white/[.04] text-slate-300", task.today || !onToday ? "col-span-2" : "")}>Edit</Button></div>`,
  `<div className={cn("mt-3 grid gap-2", task.status === "open" && !task.today && onToday ? "grid-cols-3" : "grid-cols-2")}>{task.status === "open" && !task.today && onToday ? <Button onClick={() => onToday(task.id)} className="border border-white/10 bg-white/[.04] text-slate-300">Today</Button> : null}<Button onClick={() => setEditing(true)} className="border border-white/10 bg-white/[.04] text-slate-300">Edit</Button><Button onClick={() => onDelete?.(task.id)} className="border border-red-400/20 bg-red-500/10 text-red-200">Delete</Button></div>`,
  "task secondary actions"
);
app = replaceExact(app, "function XpTaskList({ title, subtitle, tasks, onComplete, onToday, onUpdate, empty })", "function XpTaskList({ title, subtitle, tasks, onComplete, onToday, onUpdate, onDelete, empty })", "XP list delete prop");
app = replaceExact(app, `<TaskCard key={task.id} task={task} onComplete={onComplete} onToday={onToday} onUpdate={onUpdate} />`, `<TaskCard key={task.id} task={task} onComplete={onComplete} onToday={onToday} onUpdate={onUpdate} onDelete={onDelete} />`, "XP list passes delete");
app = replaceExact(app, "function TodayScreen({ user, state, seconds, danger, action, onStart, onPrimaryAction, onToggleRule, onCompleteTodo, onSendToday, onUpdateTodo, onUpdateUi })", "function TodayScreen({ user, state, seconds, danger, action, onStart, onPrimaryAction, onToggleRule, onCompleteTodo, onSendToday, onUpdateTodo, onDeleteTodo, onUpdateUi })", "today delete prop");
const todayTasksMarker = `const todayTasks = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === dateKey));`;
if (!app.includes("const latestRun = state.runs.history[0];")) app = app.replace(todayTasksMarker, `${todayTasksMarker}\n  const latestRun = state.runs.history[0];`);
app = replaceExact(
  app,
  `<Button onClick={onStart} className="mt-7 w-full bg-blue-600 text-white sm:w-auto">Start Fasting Mode<ArrowRight className="ml-2 h-4 w-4" /></Button></Panel><NextActionCard action={action} onAction={onPrimaryAction} />`,
  `<Button onClick={onStart} className="mt-7 w-full bg-blue-600 text-white sm:w-auto">Start Fasting Mode<ArrowRight className="ml-2 h-4 w-4" /></Button></Panel>{latestRun ? <Panel className={cn("p-5", latestRun.status === "failed" ? "border-red-400/20 bg-red-500/[.06]" : "border-blue-300/20 bg-blue-500/[.07]")}><SectionTitle icon={latestRun.status === "failed" ? AlertTriangle : ShieldCheck} title={latestRun.status === "failed" ? "Fast broken" : "Fast completed"} subtitle={latestRun.status === "failed" ? \`Stopped on day \${latestRun.failedDay || latestRun.currentDay || 1}.\` : \`\${latestRun.duration} day season archived.\`} /><p className="mt-4 text-sm leading-6 text-slate-400">{latestRun.status === "failed" ? "Return without drama. Confess, reset, and begin again with watchfulness." : "The season was completed. Begin the next fast only with a clear reason before Christ."}</p></Panel> : null}<NextActionCard action={action} onAction={onPrimaryAction} />`,
  "latest fast archive state"
);
app = app.replaceAll("onUpdate={onUpdateTodo} empty=", "onUpdate={onUpdateTodo} onDelete={onDeleteTodo} empty=");
app = replaceExact(app, "function InboxScreen({ state, onCreateTodo, onCompleteTodo, onSendToday, onUpdateTodo })", "function InboxScreen({ state, onCreateTodo, onCompleteTodo, onSendToday, onUpdateTodo, onDeleteTodo })", "inbox delete prop");
app = replaceExact(app, "function CommandApp({ user, state, sync, onStart, onUpdateUi, onToggleRule, onCreateTodo, onCompleteTodo, onSendToday, onUpdateTodo, onLockPlan, onTogglePrep, onSeedPreset, onSound, onNotify, onReset, onReload, onSignOut, onMarkSecuredSeen, audio })", "function CommandApp({ user, state, sync, onStart, onUpdateUi, onToggleRule, onCreateTodo, onCompleteTodo, onSendToday, onUpdateTodo, onDeleteTodo, onLockPlan, onTogglePrep, onSeedPreset, onSound, onNotify, onReset, onReload, onSignOut, onMarkSecuredSeen, audio })", "command app delete prop");
app = replaceExact(app, "onUpdateTodo={onUpdateTodo} onUpdateUi={onUpdateUi} />", "onUpdateTodo={onUpdateTodo} onDeleteTodo={onDeleteTodo} onUpdateUi={onUpdateUi} />", "today screen delete wiring");
app = replaceExact(app, "onUpdateTodo={onUpdateTodo} />", "onUpdateTodo={onUpdateTodo} onDeleteTodo={onDeleteTodo} />", "inbox screen delete wiring");
app = replaceExact(
  app,
  `  const updateTodo = (todoId, patch) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.map((todo) => todo.id === todoId ? normalizeTodo({ ...todo, ...patch, id: todo.id }) : todo) } }));`,
  `  const updateTodo = (todoId, patch) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.map((todo) => todo.id === todoId ? normalizeTodo({ ...todo, ...patch, id: todo.id }) : todo) } }));\n  const deleteTodo = (todoId) => commitState((current) => ({ ...current, xp: { ...current.xp, todos: current.xp.todos.filter((todo) => todo.id !== todoId) }, plans: { byDate: Object.fromEntries(Object.entries(current.plans.byDate).map(([key, plan]) => [key, { ...plan, topTaskIds: (plan.topTaskIds || []).filter((id) => id !== todoId), firstTaskId: plan.firstTaskId === todoId ? "" : plan.firstTaskId }])) } }));`,
  "delete todo state handler"
);
app = replacePattern(
  app,
  /  const createFast = \(payload\) => \{\n    audio\.unlock\(\);\n    setScreen\("app"\);\n    commitState\(\(current\) => \(\{ \.\.\.current, ui: \{ \.\.\.current\.ui, activeTab: "today" \}, runs: \{ \.\.\.current\.runs, activeRun: makeRun\(payload\) \} \}\)\);\n  \};/,
  `  const createFast = (payload) => {\n    audio.unlock();\n    setScreen("app");\n    commitState((current) => {\n      const next = { ...current, ui: { ...current.ui, activeTab: "today" }, runs: { ...current.runs, activeRun: makeRun(payload) } };\n      return payload.installRoutine ? applyPresetToState(next, "dailyRule") : next;\n    });\n  };`,
  "atomic fast creation",
  "return payload.installRoutine ? applyPresetToState(next, \"dailyRule\") : next;"
);
app = replacePattern(
  app,
  /  const seedPreset = \(presetId, silent = false\) => commitState\(\(current\) => \{\n[\s\S]*?\n  \}\);\n  const lockPlan =/,
  `  const applyPresetToState = (current, presetId, silent = false) => {\n    const preset = presetById(presetId);\n    const existingTitles = new Set(current.xp.todos.map((todo) => \`\${todo.title}-\${todo.category}\`));\n    const additions = preset.tasks.filter(([title, category]) => !existingTitles.has(\`\${title}-\${category}\`)).map(([title, category, xp, phase, description]) => normalizeTodo({ title, category, xp, phase, description, today: true, dueDate: todayKey(), recurrence: preset.id === "dailyRule" ? "daily" : "none", sourcePresetId: preset.id }));\n    const rewards = silent ? current.xp.rewards : addRewardEvent(current.xp.rewards, { type: "preset", title: \`\${preset.title} installed\`, amount: preset.id === "dailyRule" ? 75 : 30, dateKey: todayKey(), presetId: preset.id });\n    return { ...current, xp: { ...current.xp, todos: [...additions, ...current.xp.todos], rewards }, prep: { ...current.prep, activePreset: preset.id } };\n  };\n  const seedPreset = (presetId, silent = false) => commitState((current) => applyPresetToState(current, presetId, silent));\n  const lockPlan =`,
  "shared preset applier",
  "const applyPresetToState = (current, presetId, silent = false) =>"
);
app = replaceExact(app, `if (screen === "onboarding") return <Onboarding onCreate={createFast} onCancel={() => setScreen("app")} onApplyRoutine={seedPreset} />;`, `if (screen === "onboarding") return <Onboarding onCreate={createFast} onCancel={() => setScreen("app")} />;`, "single-write onboarding render");
app = replaceExact(app, "onUpdateTodo={updateTodo} onLockPlan=", "onUpdateTodo={updateTodo} onDeleteTodo={deleteTodo} onLockPlan=", "command app delete handler wiring");

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[release-hardening] patched App.jsx launch hardening issues");
}

const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const html = readFileSync(htmlPath, "utf8");
const manifest = readFileSync(manifestPath, "utf8");
const serviceWorker = readFileSync(serviceWorkerPath, "utf8");
const netlify = readFileSync(netlifyPath, "utf8");
const finalApp = readFileSync(appPath, "utf8");

function assert(condition, message) {
  if (!condition) fail(message);
}

assert(pkg.scripts?.build?.includes("vite build"), "package build script must still run Vite");
assert(netlify.includes('command = "npm --prefix monk-mode-app run build"'), "Netlify build command drifted");
assert(netlify.includes('publish = "monk-mode-app/dist"'), "Netlify publish directory drifted");
assert(netlify.includes('to = "/index.html"'), "SPA hard-refresh fallback missing");
assert(html.includes("viewport-fit=cover"), "iPhone viewport-fit=cover missing");
assert(manifest.includes('"display": "standalone"'), "PWA standalone display missing");
assert(serviceWorker.includes("notificationclick"), "service worker notification click handler missing");
assert(finalApp.includes("Fasting Mode"), "visible brand missing");
assert(finalApp.includes("Strict commitments"), "strict commitment layer missing");
assert(finalApp.includes("Layer 2"), "XP Layer 2 framing missing");
assert(finalApp.includes("Daily Rule"), "Daily Rule preset missing");
assert(finalApp.includes("Do this now"), "dominant next-action CTA missing");
assert(finalApp.includes("Notification.requestPermission"), "notification permission flow missing");
assert(finalApp.includes("applyPresetToState(next, \"dailyRule\")"), "onboarding routine install is not atomic");
assert(!finalApp.includes("onApplyRoutine"), "stale onboarding routine callback still present");
assert(finalApp.includes("const deleteTodo ="), "XP delete handler missing");
assert(finalApp.includes("onDeleteTodo={deleteTodo}"), "XP delete handler not wired into app shell");
assert(finalApp.includes("Fast broken") && finalApp.includes("Fast completed"), "no-active-fast archive state missing");

console.log("[release-hardening] smoke checks passed");
