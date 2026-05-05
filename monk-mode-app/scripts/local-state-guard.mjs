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
  `applyPresetToState(next, "dailyRule")`,
  "const deleteTodo =",
  "onDeleteTodo={deleteTodo}",
  "const applyPresetToState = (current, presetId, silent = false) =>",
];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
if (finalApp.includes("onApplyRoutine")) fail("stale onboarding routine callback remains");
console.log("[local-state-guard] local state checks passed");
