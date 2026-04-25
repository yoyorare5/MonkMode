import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[os-transformation-lite] ${message}`);
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

app = replaceExact(app, "const DURATIONS = [7, 14, 21, 30, 40];", "const DURATIONS = [7, 14, 21, 30, 40, 60, 90];", "campaign durations");

app = replacePattern(
  app,
  /const COMMAND_TABS = \[[\s\S]*?\];/,
  `const COMMAND_TABS = [
  ["today", "Command", Target],
  ["inbox", "Execute", Database],
  ["plan", "Plan", CalendarDays],
  ["rewards", "OS", Sparkles],
  ["settings", "Settings", Settings],
];`,
  "command tabs",
  `"OS", Sparkles`
);

app = replacePattern(
  app,
  /const FASTING_TYPES = \[[\s\S]*?\];\nconst SCRIPTURES/,
  `const FASTING_TYPES = [
  ["sunrise", "Sunrise fast", "Food is laid aside through the day for prayer, Scripture, and watchfulness."],
  ["daniel", "Daniel focus", "Simple food, sober appetite, and a clear heart before the Lord."],
  ["media", "Media abstinence", "Remove noise and distraction so prayer can become primary."],
  ["orthodox", "Orthodox watchfulness", "Prayer, fasting, almsgiving, repentance, guarding the senses, and quiet obedience."],
  ["greatfast", "Great Fast rule", "A stricter season ordered around repentance, mercy, worship preparation, and self-denial."],
  ["monk", "Monk Mode covenant", "A fixed campaign against distraction, lust, comfort, and wasted attention."],
  ["custom", "Custom consecration", "Define a fast with your pastor, conscience, and health in view."],
];
const SCRIPTURES`,
  "fasting types",
  `"Orthodox watchfulness"`
);

app = replacePattern(
  app,
  /const SCRIPTURES = \[[\s\S]*?\];\nconst WARNING_LEVELS/,
  `const SCRIPTURES = [
  ["Matthew 6:17-18", "When you fast, anoint your head and wash your face, that your fasting may not be seen by others but by your Father.", "Practice secrecy today. Let the Father see what no one else needs to applaud."],
  ["Joel 2:12", "Return to me with all your heart, with fasting, with weeping, and with mourning.", "Return with your whole heart. Do not treat the fast as performance."],
  ["Matthew 4:4", "Man shall not live by bread alone, but by every word that comes from the mouth of God.", "When hunger speaks, answer with the Word."],
  ["Isaiah 58:6", "Is not this the fast that I choose: to loose the bonds of wickedness?", "Ask the Lord to expose what must be broken, healed, or surrendered."],
  ["1 Peter 5:8", "Be sober-minded; be watchful.", "Guard attention today. Do not let appetite, lust, or noise govern the heart."],
  ["Psalm 51:10", "Create in me a clean heart, O God, and renew a right spirit within me.", "Repentance is not drama. Tell the truth, receive mercy, and obey the next command."],
  ["Tobit 12:8", "Prayer is good when accompanied by fasting, almsgiving, and righteousness.", "Let the fast move outward into mercy, generosity, and hidden service."],
];
const WARNING_LEVELS`,
  "scripture system",
  `"Tobit 12:8"`
);

app = replaceExact(
  app,
  `const PREP_PRESETS = [`,
  `const PREP_PRESETS = [
  {
    id: "hardMonk",
    title: "Hard monk mode day",
    description: "Severe focus, no phone drift, deep work, training, purity, and early sleep.",
    night: ["Phone outside bedroom", "Block entertainment", "Lay out training clothes", "Write the first command"],
    morning: ["Wake without snooze", "Prayer and Scripture first", "No phone until launch is complete", "Start deep work before messages"],
    tasks: [["No phone launch block", "Guardrail", 75, "Morning", "Phone stays away until launch is complete."], ["Two-hour deep work block", "Deep Work", 110, "Training", "Enter the work before checking noise."], ["Hard training session", "Fitness", 85, "Training", "Train the body without bargaining."], ["No entertainment day", "Distraction", 80, "Training", "No streaming, reels, porn, or idle browsing."], ["Sleep before 12:30", "Recovery", 65, "Night", "Tomorrow is protected by tonight."]],
  },
  {
    id: "orthodoxFast",
    title: "Orthodox fasting day",
    description: "Prayer, fasting, almsgiving, watchfulness, repentance, and quiet service.",
    night: ["Choose the prayer rule", "Prepare simple food boundaries", "Set aside mercy or almsgiving", "Name the temptation to watch"],
    morning: ["Begin with prayer", "Read Scripture before phone", "Give or serve quietly", "Guard the senses until noon"],
    tasks: [["Morning prayer rule", "Prayer", 70, "Morning", "Begin before God, not the phone."], ["Simple fasting meal plan", "Nutrition", 35, "Morning", "Keep appetite plain and obedient."], ["Hidden act of mercy", "Mercy", 60, "Training", "Let fasting move outward into love."], ["Evening examination", "Repentance", 50, "Night", "Tell the truth before God and reset cleanly."]],
  },`,
  "elite presets"
);

app = replacePattern(
  app,
  /const DEFAULT_STATE = \{[\s\S]*?\n\};\nconst pageMotion/,
  `const MODULE_DEFINITIONS = [
  ["focus", "Focus", "Attention, deep work, and phone resistance", ["No phone launch", "Deep work", "Screen boundary"]],
  ["fitness", "Fitness", "Training, posture, strength, and recovery", ["Train", "Walk or stretch", "Sleep boundary"]],
  ["nutrition", "Nutrition", "Fasting-friendly food, hydration, and appetite discipline", ["Hydration", "Simple food", "No grazing"]],
  ["appearance", "Appearance", "Grooming, style, skin, and order", ["Morning grooming", "Night skincare", "Clean clothes"]],
  ["confidence", "Confidence", "Outreach, service, exposure, and clean speech", ["Outreach", "Serve quietly", "Speak cleanly"]],
  ["prayer", "Prayer", "Scripture, reflection, repentance, and watchfulness", ["Prayer rule", "Scripture", "Examination"]],
];
const DEFAULT_STATE = {
  runs: { activeRun: null, history: [] },
  ui: { soundEnabled: true, notificationsEnabled: false, permission: "default", installedPromptDismissed: false, sentWarnings: {}, activeTab: "today" },
  xp: { todos: [], rewards: DEFAULT_REWARDS },
  plans: { byDate: {} },
  prep: { activePreset: "dailyRule", checklists: {} },
};
const pageMotion`,
  "module definitions",
  `const MODULE_DEFINITIONS = [`
);

app = replaceExact(
  app,
  `function DangerMeter({ danger, seconds }) {`,
  `function disciplineMetrics(state, danger) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const strictDone = day?.completedRuleIds.length || 0;
  const dateKey = todayKey();
  const todayTasks = state.xp.todos.filter((todo) => todo.today || todo.dueDate === dateKey);
  const todayDone = todayTasks.filter((todo) => todo.status === "completed" && todo.completedDateKey === dateKey).length;
  const plan = state.plans.byDate[dateKey];
  const strictScore = run ? Math.round((strictDone / 6) * 45) : 0;
  const executionScore = todayTasks.length ? Math.min(25, Math.round((todayDone / todayTasks.length) * 25)) : 8;
  const planScore = plan?.lockedAt ? 15 : 0;
  const dangerPenalty = danger.level === "critical" ? 20 : danger.level === "danger" ? 12 : danger.level === "caution" ? 6 : 0;
  const score = Math.max(0, Math.min(100, strictScore + executionScore + planScore + 15 - dangerPenalty));
  const level = Math.max(1, Math.floor((state.xp.rewards.totalXp || 0) / 500) + 1);
  const rank = score >= 90 ? "Watchman" : score >= 75 ? "Disciplined" : score >= 55 ? "In formation" : "Unstable";
  return { score, level, rank, strictDone, todayDone, todayTasks: todayTasks.length, planLocked: Boolean(plan?.lockedAt), daysConsecrated: wonDays(run) + (state.xp.rewards.streakDays || 0) };
}
function moduleProgress(state) {
  const dateKey = todayKey();
  return MODULE_DEFINITIONS.map(([id, title, description, checklist]) => {
    const haystack = state.xp.todos.map((todo) => (todo.title + " " + todo.category + " " + todo.phase + " " + todo.description).toLowerCase()).join(" ");
    const matched = checklist.filter((item) => haystack.includes(item.toLowerCase().split(" ")[0])).length;
    const progress = Math.min(100, Math.round((matched / Math.max(1, checklist.length)) * 100));
    return { id, title, description, checklist, progress, done: state.xp.todos.filter((todo) => todo.status === "completed" && todo.completedDateKey === dateKey).length };
  });
}
function IdentityStrip({ state, danger }) {
  const metrics = disciplineMetrics(state, danger);
  return <Panel className="os-panel p-4"><div className="grid grid-cols-3 gap-3"><StatCard label="Score" value={metrics.score} tone={danger.level === "critical" ? "danger" : "default"} /><StatCard label="Level" value={metrics.level} /><StatCard label="Rank" value={metrics.rank} /></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/50"><div className="h-full rounded-full bg-blue-200/80 transition-all" style={{ width: metrics.score + "%" }} /></div></Panel>;
}
function CommandCenter({ state, run, danger }) {
  const metrics = disciplineMetrics(state, danger);
  const [, typeTitle] = run ? fastType(run.fastingType) : ["", "No active fast"];
  const progress = run ? Math.round(((run.currentDay - 1 + metrics.strictDone / 6) / run.duration) * 100) : 0;
  return <Panel className="os-command p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[.28em] text-blue-100/70">Mission control</div><h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{typeTitle}</h2><p className="mt-2 text-sm leading-6 text-slate-400">Sober, watchful, obedient, strong, and difficult to distract.</p></div><Badge className="border border-blue-200/15 bg-blue-200/8 text-blue-100">{danger.label}</Badge></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><StatCard label="Season" value={String(progress) + "%"} /><StatCard label="Strict" value={String(metrics.strictDone) + "/6"} /><StatCard label="Today" value={String(metrics.todayDone) + "/" + String(Math.max(metrics.todayTasks, 1))} /><StatCard label="Plan" value={metrics.planLocked ? "Locked" : "Open"} /></div><div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs uppercase tracking-[.22em] text-slate-500">Rule of life</div><div className="mt-3 grid gap-2">{["Six strict commitments kept", "Prayer and Scripture before noise", "Top priorities executed", "Night shutdown completed"].map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-300"><Check className="h-3.5 w-3.5 text-blue-200" /><span>{item}</span></div>)}</div></div></Panel>;
}
function ModuleGrid({ state }) {
  return <div className="grid gap-3 sm:grid-cols-2">{moduleProgress(state).map((item) => <Panel key={item.id} className="os-panel p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{item.title}</div><p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p></div><Badge className="border border-white/10 bg-white/[.035] text-slate-300">{item.progress}%</Badge></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/50"><div className="h-full rounded-full bg-blue-200/75" style={{ width: String(Math.max(8, item.progress)) + "%" }} /></div><div className="mt-4 grid gap-2">{item.checklist.map((check) => <div key={check} className="flex items-center gap-2 text-xs leading-5 text-slate-500"><Lock className="h-3.5 w-3.5 text-slate-600" /><span>{check}</span></div>)}</div></Panel>)}</div>;
}
function DangerMeter({ danger, seconds }) {`,
  "OS components"
);

app = replaceExact(
  app,
  `<DangerMeter danger={danger} seconds={seconds} /><NextActionCard action={action} onAction={onPrimaryAction} /><CommitmentList run={run} day={day} onToggle={onToggleRule} />`,
  `<IdentityStrip state={state} danger={danger} /><CommandCenter state={state} run={run} danger={danger} /><DangerMeter danger={danger} seconds={seconds} /><NextActionCard action={action} onAction={onPrimaryAction} /><CommitmentList run={run} day={day} onToggle={onToggleRule} />`,
  "active command center"
);

app = replaceExact(app, `Begin a fast with a command system around it.`, `Enter a consecrated operating system.`, "empty dashboard headline");
app = replaceExact(app, `Layer 1 is the strict fast. Layer 2 is the XP execution system that keeps life moving without confusing tasks with obedience.`, `Layer 1 is sacred fasting. Layer 2 executes the day. Layer 3 removes friction. Layer 4 forms the whole life.`, "empty dashboard OS copy");

app = replacePattern(
  app,
  /function RewardsScreen\(\{ state \}\) \{[\s\S]*?\n\}\nfunction SettingsScreen/,
  `function RewardsScreen({ state }) {
  const rewards = state.xp.rewards;
  const danger = calculateDanger(state);
  const metrics = disciplineMetrics(state, danger);
  const run = state.runs.activeRun;
  return <div><ScreenHeader eyebrow="Identity OS" title="Formation, modules, and command history" body="Progress tracks whether the man is becoming sober, watchful, and difficult to distract." /><div className="grid gap-5 lg:grid-cols-[.92fr_1.08fr]"><section className="space-y-5"><Panel className="os-command p-5"><SectionTitle icon={Sparkles} title="Identity engine" subtitle="Discipline score, rank, level, and consecrated days." /><div className="mt-5 grid grid-cols-2 gap-3"><StatCard label="Discipline" value={metrics.score} tone={danger.level === "critical" ? "danger" : "default"} /><StatCard label="Rank" value={metrics.rank} /><StatCard label="Level" value={metrics.level} /><StatCard label="Consecrated" value={metrics.daysConsecrated} /></div><div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs uppercase tracking-[.22em] text-slate-500">Current season</div><div className="mt-2 text-lg font-semibold">{run ? fastType(run.fastingType)[1] : "No active season"}</div><p className="mt-2 text-sm leading-6 text-slate-400">Keep the rule, guard the senses, execute the plan, and finish in prayer.</p></div></Panel><Panel className="os-panel p-5"><SectionTitle icon={ShieldCheck} title="Progression ledger" subtitle="XP remains secondary to the sacred fast." /><div className="mt-5 grid grid-cols-2 gap-3"><StatCard label="Total XP" value={rewards.totalXp} /><StatCard label="Today XP" value={rewards.todayXp} /><StatCard label="Streak" value={rewards.streakDays} /><StatCard label="Combo" value={String(rewards.comboCount) + "x"} /></div></Panel><Panel className="os-panel p-5"><SectionTitle icon={BookOpen} title="Orthodox core" subtitle="Prayer, fasting, almsgiving, repentance, and watchfulness." /><div className="mt-5 grid gap-2">{["Prayer rule before phone", "Guard the senses", "Simple food and sober appetite", "Hidden mercy or almsgiving", "Evening examination"].map((item) => <div key={item} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-slate-300"><Check className="h-4 w-4 text-blue-100" /><span>{item}</span></div>)}</div></Panel></section><section className="space-y-5"><Panel className="os-panel p-5"><SectionTitle icon={Database} title="Life operating modules" subtitle="Useful now, ready for deeper integrations later." /><div className="mt-5"><ModuleGrid state={state} /></div></Panel><Panel className="os-panel p-5"><SectionTitle icon={Bell} title="Distraction control" subtitle="Friction before failure." /><div className="mt-5 grid gap-3">{["Porn", "Idle scrolling", "Phone in bed", "Entertainment drift"].map((item) => <div key={item} className="flex items-center justify-between rounded-xl border border-red-400/15 bg-red-500/[.055] px-4 py-3"><span className="text-sm font-semibold text-red-100">{item}</span><Lock className="h-4 w-4 text-red-200/70" /></div>)}</div></Panel><Panel className="os-panel p-5"><SectionTitle icon={Database} title="Recent XP events" subtitle="Work completed around the fast." /><div className="mt-5 grid gap-3">{rewards.events.length ? rewards.events.slice(0, 10).map((event) => <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4"><div><div className="font-semibold">{event.title}</div><div className="mt-1 text-xs uppercase tracking-[.16em] text-slate-500">{event.dateKey}</div></div><Badge className="border border-blue-300/20 bg-blue-500/10 text-blue-100">+{event.amount}</Badge></div>) : <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-slate-500">Complete commands, secure days, and lock plans to build the record.</div>}</div></Panel></section></div></div>;
}
function SettingsScreen`,
  "identity OS screen",
  `Identity OS`
);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[os-transformation-lite] applied OS product transformation");
}

const finalApp = readFileSync(appPath, "utf8");
const required = ["Identity OS", "MODULE_DEFINITIONS", "Orthodox watchfulness", "Hard monk mode day", "Distraction control", "Life operating modules", "Discipline score", "Enter a consecrated operating system"];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing OS marker: ${marker}`);
}

console.log("[os-transformation-lite] OS checks passed");
