import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[os-transformation] ${message}`);
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

app = replacePattern(
  app,
  /const PREP_PRESETS = \[[\s\S]*?\];\nconst ACHIEVEMENTS/,
  `const PREP_PRESETS = [
  {
    id: "dailyRule",
    title: "Daily Rule",
    description: "Your full launch, training, and shutdown routine, cleaned into a serious operating template.",
    night: ["Set phone to Airplane Mode", "Lay out gym clothes", "Prepare water and supplements", "Choose the first deep-work block", "Set sleep boundary before 12:30"],
    morning: ["Wake up instantly", "Pray and read before phone", "Complete the launch sequence", "Move into training without drift"],
    tasks: DAILY_RULE_TASKS,
  },
  {
    id: "orthodoxFast",
    title: "Orthodox fasting day",
    description: "Prayer, fasting, almsgiving, watchfulness, and quiet service ordered into one day.",
    night: ["Choose the prayer rule", "Prepare simple food boundaries", "Set aside mercy or almsgiving", "Remove entertainment noise", "Name the temptation to watch"],
    morning: ["Begin with the Trisagion prayers", "Read Scripture before phone", "Give or serve quietly", "Guard the senses until noon"],
    tasks: [["Morning prayer rule", "Prayer", 70, "Morning", "Begin the day before God, not the phone."], ["Simple fasting meal plan", "Nutrition", 35, "Morning", "Keep appetite plain and obedient."], ["Hidden act of mercy", "Mercy", 60, "Training", "Let fasting move outward into love."], ["Guard the senses block", "Watchfulness", 55, "Training", "No idle scrolling, lust, gossip, or vanity."], ["Examination before sleep", "Repentance", 50, "Night", "Tell the truth before God and reset cleanly."]],
  },
  {
    id: "hardMonk",
    title: "Hard monk mode day",
    description: "A severe execution preset for no phone, deep work, training, purity, and early sleep.",
    night: ["Phone outside bedroom", "Write tomorrow's first command", "Block entertainment", "Lay out training clothes", "Set hard sleep time"],
    morning: ["Wake without snooze", "No phone until launch sequence ends", "Prayer and Scripture first", "Start deep work before messages"],
    tasks: [["No phone launch block", "Guardrail", 75, "Morning", "Phone stays away until the launch sequence is complete."], ["Two-hour deep work block", "Deep Work", 110, "Training", "Enter the work before checking noise."], ["Hard training session", "Fitness", 85, "Training", "Train the body without bargaining."], ["No entertainment day", "Distraction", 80, "Training", "No streaming, reels, porn, or idle browsing."], ["Sleep before 12:30", "Recovery", 65, "Night", "Tomorrow is protected by tonight." ]],
  },
  {
    id: "deepWork",
    title: "Deep work day",
    description: "A focused execution day built around one major output and strict attention boundaries.",
    night: ["Define the one output", "Clear desk", "Set phone away", "Prepare water", "Pick first work block"],
    morning: ["Open the work before messages", "Complete first 90 minutes", "Write the next checkpoint", "Pray for steadiness"],
    tasks: [["Define the one output", "Deep Work", 40, "Morning", "The day needs one clear win."], ["First 90-minute block", "Deep Work", 90, "Morning", "Work before noise."], ["Second focused block", "Deep Work", 75, "Training", "Return after break without wandering."], ["Ship or submit output", "Execution", 85, "Training", "Finish what can be finished today."], ["Review and reset desk", "Order", 30, "Night", "Close the loop." ]],
  },
  {
    id: "school",
    title: "School day",
    description: "Classes, study blocks, and phone discipline before pressure arrives.",
    night: ["Pack bag and clothes", "Set tomorrow's fasting window", "Choose study block and prayer time", "Charge phone outside the bed"],
    morning: ["Pray before checking phone", "Read the assigned Scripture", "Review the top three commands", "Leave with water and plan visible"],
    tasks: [["Review class work", "School", 45, "Training", "One clean school block."], ["Complete one study block", "School", 55, "Training", "Focused work before noise."], ["Pack tomorrow before bed", "Prep", 25, "Night", "Reduce tomorrow's friction."]],
  },
  {
    id: "gym",
    title: "Gym day",
    description: "Train hard, stay sober, and keep appetite under obedience.",
    night: ["Lay out training clothes", "Plan meal boundaries", "Set water and electrolytes", "Name the weakest hour"],
    morning: ["Pray before training", "Warm up deliberately", "Keep music clean", "Close with gratitude"],
    tasks: [["Complete training session", "Body", 60, "Training", "Train deliberately."], ["Prepare clean food", "Discipline", 35, "Training", "Protect appetite."], ["Walk ten minutes after dinner", "Body", 25, "Night", "End clean."]],
  },
  {
    id: "church",
    title: "Church day",
    description: "Arrive prepared, serve quietly, and listen before speaking.",
    night: ["Prepare clothes and Bible", "Pray for pastor and church", "Set giving or service intention", "Sleep early"],
    morning: ["Read before leaving", "Serve one person quietly", "Take one sermon note to obey", "Protect the afternoon from noise"],
    tasks: [["Pray for church leadership", "Prayer", 30, "Morning", "Carry the church in prayer."], ["Write one sermon obedience point", "Faith", 35, "Training", "Turn hearing into obedience."], ["Serve without being seen", "Service", 45, "Training", "Serve quietly."]],
  },
  {
    id: "outreach",
    title: "Outreach/work day",
    description: "Execute the work, keep your witness clean, and do not negotiate with distraction.",
    night: ["Define first work block", "Clear one distraction source", "Prepare outreach or work materials", "Set a check-in prayer"],
    morning: ["Start with prayer", "Open the first work block", "Send the needed message", "Refuse idle scrolling"],
    tasks: [["Complete first work block", "Work", 60, "Training", "Start with the real work."], ["Send the important message", "Execution", 35, "Training", "Move what matters."], ["Make one faithful contact", "Outreach", 45, "Training", "Reach out cleanly."]],
  },
  {
    id: "recovery",
    title: "Recovery/reset day",
    description: "Recover without compromise. Reset the room, the mind, and the schedule.",
    night: ["Write the reset reason", "Prepare a simple morning", "Remove one trigger", "Set sleep boundary"],
    morning: ["Pray slowly", "Clean one space", "Walk without phone", "Choose the first simple task"],
    tasks: [["Clean one space", "Reset", 35, "Morning", "Create order."], ["Walk without phone", "Body", 30, "Training", "Recover attention."], ["Write a sober reflection", "Reflection", 40, "Night", "Tell the truth before God."]],
  },
];
const ACHIEVEMENTS`,
  "routine presets",
  `"Hard monk mode day"`
);

app = replacePattern(
  app,
  /const DEFAULT_STATE = \{[\s\S]*?\n\};\nconst pageMotion/,
  `const MODULE_DEFINITIONS = [
  ["focus", "Focus", "Attention, deep work, and phone resistance", ["No phone launch block", "One deep work block", "Evening screen boundary"]],
  ["fitness", "Fitness", "Training, posture, strength, and recovery", ["Train today", "Walk or stretch", "Sleep boundary"]],
  ["nutrition", "Nutrition", "Fasting-friendly food, hydration, and appetite discipline", ["Hydration target", "Simple meal boundary", "No grazing"]],
  ["appearance", "Appearance", "Grooming, style, skin, and order", ["Morning grooming", "Night skincare", "Clean clothes prepared"]],
  ["confidence", "Confidence", "Outreach, service, exposure, and clean speech", ["One honest outreach", "Serve quietly", "Speak without vanity"]],
  ["prayer", "Prayer", "Scripture, reflection, repentance, and watchfulness", ["Prayer rule", "Scripture reading", "Evening examination"]],
];
const DEFAULT_MODULES = Object.fromEntries(MODULE_DEFINITIONS.map(([id]) => [id, { enabled: true, notes: "", progress: 0 }]));
const DEFAULT_SEASON = { name: "Consecrated season", theme: "Prayer, fasting, execution", emphasis: "Orthodox watchfulness", targetIdentity: "Sober, watchful, obedient, and hard to distract", banned: ["Porn", "Idle scrolling", "Phone in bed", "Entertainment drift"], successCriteria: ["Six strict commitments kept", "Daily prayer and Scripture", "Top priorities executed", "Night shutdown completed"] };
const DEFAULT_IDENTITY = { rank: "Catechumen", disciplineScore: 0, daysConsecrated: 0, level: 1 };
const DEFAULT_DISCIPLINE = { earnedAccess: false, redZoneIntensity: "standard", lastReviewDateKey: null };
const DEFAULT_STATE = {
  runs: { activeRun: null, history: [] },
  ui: { soundEnabled: true, notificationsEnabled: false, permission: "default", installedPromptDismissed: false, sentWarnings: {}, activeTab: "today" },
  xp: { todos: [], rewards: DEFAULT_REWARDS },
  plans: { byDate: {} },
  prep: { activePreset: "dailyRule", checklists: {} },
  season: DEFAULT_SEASON,
  identity: DEFAULT_IDENTITY,
  modules: DEFAULT_MODULES,
  discipline: DEFAULT_DISCIPLINE,
};
const pageMotion`,
  "OS state defaults",
  `const MODULE_DEFINITIONS = [`
);

app = replaceExact(
  app,
  `function normalizeState(raw) {`,
  `function normalizeSeason(season = {}) {
  return { ...DEFAULT_SEASON, ...season, banned: Array.isArray(season.banned) && season.banned.length ? season.banned : DEFAULT_SEASON.banned, successCriteria: Array.isArray(season.successCriteria) && season.successCriteria.length ? season.successCriteria : DEFAULT_SEASON.successCriteria };
}
function normalizeIdentity(identity = {}) {
  return { ...DEFAULT_IDENTITY, ...identity, disciplineScore: Math.max(0, Math.min(100, Number(identity.disciplineScore) || 0)), daysConsecrated: Math.max(0, Number(identity.daysConsecrated) || 0), level: Math.max(1, Number(identity.level) || 1) };
}
function normalizeModules(modules = {}) {
  return Object.fromEntries(MODULE_DEFINITIONS.map(([id]) => [id, { ...DEFAULT_MODULES[id], ...(modules[id] || {}) }]));
}
function normalizeDiscipline(discipline = {}) {
  return { ...DEFAULT_DISCIPLINE, ...discipline };
}
function normalizeState(raw) {`,
  "state normalizers"
);

app = replaceExact(
  app,
  `    prep: { activePreset: presetById(state.prep?.activePreset).id, checklists },
  };`,
  `    prep: { activePreset: presetById(state.prep?.activePreset).id, checklists },
    season: normalizeSeason(state.season),
    identity: normalizeIdentity(state.identity),
    modules: normalizeModules(state.modules),
    discipline: normalizeDiscipline(state.discipline),
  };`,
  "state normalization output"
);

app = replaceExact(
  app,
  `function makeRun({ duration, rules, mission, fastingType }) {
  const dateKey = todayKey();
  return { id: newId(), duration, mission: mission.trim(), fastingType, status: "active", currentDay: 1, startDateKey: dateKey, startedAt: new Date().toISOString(), securedAnimationSeenFor: null, rules: normalizeRules(rules), days: [{ dayNumber: 1, dateKey, status: "pending", completedRuleIds: [] }] };
}`,
  `function makeRun({ duration, rules, mission, fastingType }) {
  const dateKey = todayKey();
  const [, typeTitle] = fastType(fastingType);
  return { id: newId(), duration, mission: mission.trim(), fastingType, seasonName: typeTitle, vow: "I will keep the rule before Christ, resist distraction, and finish each day in watchfulness.", targetIdentity: "Sober, obedient, strong, and difficult to distract", banned: DEFAULT_SEASON.banned, successCriteria: DEFAULT_SEASON.successCriteria, status: "active", currentDay: 1, startDateKey: dateKey, startedAt: new Date().toISOString(), securedAnimationSeenFor: null, rules: normalizeRules(rules), days: [{ dayNumber: 1, dateKey, status: "pending", completedRuleIds: [] }] };
}`,
  "season run metadata"
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
  const planScore = plan?.lockedAt ? 15 : 0;
  const strictScore = run ? Math.round((strictDone / 6) * 45) : 0;
  const executionScore = todayTasks.length ? Math.min(25, Math.round((todayDone / todayTasks.length) * 25)) : 8;
  const dangerPenalty = danger.level === "critical" ? 20 : danger.level === "danger" ? 12 : danger.level === "caution" ? 6 : 0;
  const score = Math.max(0, Math.min(100, strictScore + executionScore + planScore + 15 - dangerPenalty));
  const level = Math.max(1, Math.floor((state.xp.rewards.totalXp || 0) / 500) + 1);
  const rank = score >= 90 ? "Watchman" : score >= 75 ? "Disciplined" : score >= 55 ? "In formation" : "Unstable";
  return { score, level, rank, strictDone, todayDone, todayTasks: todayTasks.length, planLocked: Boolean(plan?.lockedAt), daysConsecrated: wonDays(run) + (state.xp.rewards.streakDays || 0) };
}
function moduleProgress(state) {
  const dateKey = todayKey();
  const tasks = state.xp.todos;
  return MODULE_DEFINITIONS.map(([id, title, description, checklist]) => {
    const related = tasks.filter((todo) => [id, title.toLowerCase(), ...checklist.map((item) => item.toLowerCase())].some((needle) => `${todo.title} ${todo.category} ${todo.phase} ${todo.description}`.toLowerCase().includes(needle.split(" ")[0])));
    const done = related.filter((todo) => todo.status === "completed" && todo.completedDateKey === dateKey).length;
    const progress = related.length ? Math.round((done / related.length) * 100) : Math.round((state.modules?.[id]?.progress || 0));
    return { id, title, description, checklist, progress, done, total: related.length };
  });
}
function IdentityStrip({ state, danger }) {
  const metrics = disciplineMetrics(state, danger);
  return <Panel className="os-panel p-4"><div className="grid grid-cols-3 gap-3"><StatCard label="Score" value={metrics.score} tone={danger.level === "critical" ? "danger" : "default"} /><StatCard label="Level" value={metrics.level} /><StatCard label="Rank" value={metrics.rank} /></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/50"><div className="h-full rounded-full bg-blue-200/80 transition-all" style={{ width: `${metrics.score}%` }} /></div></Panel>;
}
function CommandCenter({ state, run, day, danger, seconds }) {
  const metrics = disciplineMetrics(state, danger);
  const [, typeTitle] = run ? fastType(run.fastingType) : ["", "No active fast"];
  const progress = run ? Math.round(((run.currentDay - 1 + metrics.strictDone / 6) / run.duration) * 100) : 0;
  return <Panel className="os-command p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[.28em] text-blue-100/70">Mission control</div><h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{run?.seasonName || typeTitle}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{run?.targetIdentity || state.season.targetIdentity}</p></div><Badge className="border border-blue-200/15 bg-blue-200/8 text-blue-100">{danger.label}</Badge></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><StatCard label="Season" value={`${progress}%`} /><StatCard label="Strict" value={`${metrics.strictDone}/6`} /><StatCard label="Today" value={`${metrics.todayDone}/${Math.max(metrics.todayTasks, 1)}`} /><StatCard label="Plan" value={metrics.planLocked ? "Locked" : "Open"} /></div><div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs uppercase tracking-[.22em] text-slate-500">Rule of life</div><div className="mt-3 grid gap-2">{(run?.successCriteria || state.season.successCriteria).slice(0, 4).map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-300"><Check className="h-3.5 w-3.5 text-blue-200" /><span>{item}</span></div>)}</div></div></Panel>;
}
function ModuleGrid({ state }) {
  return <div className="grid gap-3 sm:grid-cols-2">{moduleProgress(state).map((item) => <Panel key={item.id} className="os-panel p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{item.title}</div><p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p></div><Badge className="border border-white/10 bg-white/[.035] text-slate-300">{item.progress}%</Badge></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/50"><div className="h-full rounded-full bg-blue-200/75" style={{ width: `${Math.max(8, item.progress)}%` }} /></div><div className="mt-4 grid gap-2">{item.checklist.slice(0, 3).map((check) => <div key={check} className="flex items-center gap-2 text-xs leading-5 text-slate-500"><Lock className="h-3.5 w-3.5 text-slate-600" /><span>{check}</span></div>)}</div></Panel>)}</div>;
}
function DangerMeter({ danger, seconds }) {`,
  "OS command components"
);

app = replaceExact(
  app,
  `<DangerMeter danger={danger} seconds={seconds} /><NextActionCard action={action} onAction={onPrimaryAction} /><CommitmentList run={run} day={day} onToggle={onToggleRule} />`,
  `<IdentityStrip state={state} danger={danger} /><CommandCenter state={state} run={run} day={day} danger={danger} seconds={seconds} /><DangerMeter danger={danger} seconds={seconds} /><NextActionCard action={action} onAction={onPrimaryAction} /><CommitmentList run={run} day={day} onToggle={onToggleRule} />`,
  "active command center"
);

app = replaceExact(
  app,
  `Begin a fast with a command system around it.`,
  `Enter a consecrated operating system.` ,
  "empty dashboard headline"
);
app = replaceExact(
  app,
  `Layer 1 is the strict fast. Layer 2 is the XP execution system that keeps life moving without confusing tasks with obedience.`,
  `Layer 1 is sacred fasting. Layer 2 executes the day. Layer 3 removes friction. Layer 4 forms the whole life.` ,
  "empty dashboard OS copy"
);

app = replacePattern(
  app,
  /function RewardsScreen\(\{ state \}\) \{[\s\S]*?\n\}\nfunction SettingsScreen/,
  `function RewardsScreen({ state }) {
  const rewards = state.xp.rewards;
  const danger = calculateDanger(state);
  const metrics = disciplineMetrics(state, danger);
  const run = state.runs.activeRun;
  return <div><ScreenHeader eyebrow="Identity OS" title="Formation, modules, and command history" body="Progress is not decoration. It tracks whether the man is becoming sober, watchful, and difficult to distract." /><div className="grid gap-5 lg:grid-cols-[.92fr_1.08fr]"><section className="space-y-5"><Panel className="os-command p-5"><SectionTitle icon={Sparkles} title="Identity engine" subtitle="Discipline score, rank, level, and consecrated days." /><div className="mt-5 grid grid-cols-2 gap-3"><StatCard label="Discipline" value={metrics.score} tone={danger.level === "critical" ? "danger" : "default"} /><StatCard label="Rank" value={metrics.rank} /><StatCard label="Level" value={metrics.level} /><StatCard label="Consecrated" value={metrics.daysConsecrated} /></div><div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-xs uppercase tracking-[.22em] text-slate-500">Current season</div><div className="mt-2 text-lg font-semibold">{run?.seasonName || state.season.name}</div><p className="mt-2 text-sm leading-6 text-slate-400">{run?.vow || "Keep the rule, guard the senses, execute the plan, and finish in prayer."}</p></div></Panel><Panel className="os-panel p-5"><SectionTitle icon={ShieldCheck} title="Progression ledger" subtitle="XP remains secondary to the sacred fast." /><div className="mt-5 grid grid-cols-2 gap-3"><StatCard label="Total XP" value={rewards.totalXp} /><StatCard label="Today XP" value={rewards.todayXp} /><StatCard label="Streak" value={rewards.streakDays} /><StatCard label="Combo" value={`${rewards.comboCount}x`} /></div></Panel><Panel className="os-panel p-5"><SectionTitle icon={BookOpen} title="Orthodox core" subtitle="Prayer, fasting, almsgiving, repentance, and watchfulness." /><div className="mt-5 grid gap-2">{["Prayer rule before phone", "Guard the senses", "Simple food and sober appetite", "Hidden mercy or almsgiving", "Evening examination"].map((item) => <div key={item} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-slate-300"><Check className="h-4 w-4 text-blue-100" /><span>{item}</span></div>)}</div></Panel></section><section className="space-y-5"><Panel className="os-panel p-5"><SectionTitle icon={Database} title="Life operating modules" subtitle="Useful now, ready for deeper integrations later." /><div className="mt-5"><ModuleGrid state={state} /></div></Panel><Panel className="os-panel p-5"><SectionTitle icon={Bell} title="Distraction control" subtitle="Friction before failure." /><div className="mt-5 grid gap-3">{(run?.banned || state.season.banned).map((item) => <div key={item} className="flex items-center justify-between rounded-xl border border-red-400/15 bg-red-500/[.055] px-4 py-3"><span className="text-sm font-semibold text-red-100">{item}</span><Lock className="h-4 w-4 text-red-200/70" /></div>)}</div></Panel><Panel className="os-panel p-5"><SectionTitle icon={Database} title="Recent XP events" subtitle="Work completed around the fast." /><div className="mt-5 grid gap-3">{rewards.events.length ? rewards.events.slice(0, 10).map((event) => <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4"><div><div className="font-semibold">{event.title}</div><div className="mt-1 text-xs uppercase tracking-[.16em] text-slate-500">{event.dateKey}</div></div><Badge className="border border-blue-300/20 bg-blue-500/10 text-blue-100">+{event.amount}</Badge></div>) : <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-slate-500">Complete commands, secure days, and lock plans to build the record.</div>}</div></Panel></section></div></div>;
}
function SettingsScreen`,
  "identity OS screen",
  `Identity OS`
);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[os-transformation] applied OS product transformation");
}

const finalApp = readFileSync(appPath, "utf8");
const required = ["Identity OS", "MODULE_DEFINITIONS", "Orthodox watchfulness", "Hard monk mode day", "Distraction control", "Life operating modules", "Discipline score", "Enter a consecrated operating system"];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing OS marker: ${marker}`);
}

console.log("[os-transformation] OS checks passed");
