import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[command-page-mockup] ${message}`);
}

function replaceFunction(name, replacement) {
  if (app.includes("command-hero-card") && name === "TodayScreen") return;
  const start = app.indexOf(`function ${name}(`);
  if (start < 0) fail(`Could not find ${name}`);
  const candidates = ["\nfunction InboxScreen(", "\nfunction PlanScreen(", "\nfunction RewardsScreen(", "\nfunction SettingsScreen(", "\nfunction CommandApp("];
  const end = candidates.map((candidate) => app.indexOf(candidate, start + 1)).filter((index) => index > start).sort((a, b) => a - b)[0];
  if (!end) fail(`Could not find boundary after ${name}`);
  app = `${app.slice(0, start)}${replacement}\n${app.slice(end + 1)}`;
}

const commandTabs = `const COMMAND_TABS = [
  ["today", "Command", Target],
  ["inbox", "Execute", Database],
  ["plan", "Plan", CalendarDays],
  ["rewards", "OS", Sparkles],
  ["settings", "Settings", Settings],
];
const ROUTINE_PHASES`;
app = app.replace(/const COMMAND_TABS = \[[\s\S]*?\];\nconst ROUTINE_PHASES/, commandTabs);

replaceFunction("TodayScreen", `function TodayScreen({ user, state, seconds, danger, action, onStart, onPrimaryAction, onToggleRule, onCompleteTodo, onSendToday, onUpdateUi }) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const completed = day?.completedRuleIds.length || 0;
  const percent = Math.round((completed / 6) * 100);
  const kept = run ? wonDays(run) : 0;
  const type = fastType(run?.fastingType || "sunrise");
  const rewards = state.xp.rewards;
  const level = Math.max(1, Math.floor((rewards.totalXp || 0) / 500) + 1);
  const rank = rewards.totalXp >= 2500 ? "Consecrated" : rewards.streakDays >= 3 ? "Steadfast" : "Unstoppable";
  const strictItems = run ? run.rules : DEFAULT_RULES.map((label, index) => ({ id: "preview-" + index, label, order: index + 1 }));
  const todayTasks = state.xp.todos.filter((todo) => todo.status === "open" && (todo.today || todo.dueDate === todayKey())).slice(0, 4);
  const openTodos = state.xp.todos.filter((todo) => todo.status === "open");
  const statusLabel = completed === 6 ? "Kept" : "Open";
  const primaryLabel = run ? action.label : "Begin the fast";
  const primaryBody = run ? action.body : "Create the covenant, set six strict commitments, and enter the day under command.";

  return <div className="command-screen space-y-6">
    <Panel className={cn("command-hero-card p-5 sm:p-7", "risk-" + danger.level)}>
      <div className="command-mode-row">
        <span><Smartphone className="h-4 w-4" />{user?.id === "local" ? "Local device" : "Cloud account"}</span>
        <span className="is-active"><Target className="h-4 w-4" />{user?.id === "local" ? "Device mode" : "Synced mode"}</span>
        <span><BookOpen className="h-4 w-4" />{type[1]}</span>
      </div>

      <div className="command-current-grid">
        <div className="min-w-0">
          <div className="command-eyebrow">Current fast</div>
          <h1>{run ? "Day " + run.currentDay + " of " + run.duration : "No active fast"}</h1>
          <p>{run ? "Strict commitments close before midnight New York time." : "Set the fast, define the six non-negotiables, and enter the day deliberately."}</p>
        </div>
        <div className="command-kept-tile">
          <div>Kept</div>
          <strong>{kept}</strong>
        </div>
      </div>

      <div className="command-time-orb" aria-label="Time left today">
        <div className="command-time-label">Time left today</div>
        <div className="command-time-value">{countdown(seconds)}</div>
        <div className="command-moon" aria-hidden="true" />
        <div className="command-time-note">Daily reset at midnight<br />New York time</div>
      </div>

      <div className="command-metric-strip">
        <div className="command-metric"><span className="metric-icon"><ShieldCheck className="h-6 w-6" /></span><div><small>Strict</small><strong>{completed}/6</strong></div></div>
        <div className="command-metric"><span className="metric-icon"><Sparkles className="h-6 w-6" /></span><div><small>Fast</small><strong>{percent}%</strong></div></div>
        <div className="command-metric"><span className="metric-icon is-green"><Lock className="h-6 w-6" /></span><div><small>Status</small><strong>{statusLabel}</strong></div></div>
      </div>
    </Panel>

    <Panel className="command-score-strip p-4 sm:p-5">
      <div className="command-score-item"><span className="score-orb"><Sparkles className="h-6 w-6" /></span><div><small>Score</small><strong>{rewards.totalXp || 0}</strong></div></div>
      <div className="command-score-item"><span className="score-bars"><i /><i /><i /></span><div><small>Level</small><strong>{level}</strong></div></div>
      <div className="command-score-item"><span className="score-crown"><Target className="h-6 w-6" /></span><div><small>Rank</small><strong>{rank}</strong></div></div>
    </Panel>

    <Panel className="command-next-card p-5">
      <div className="flex items-start gap-4">
        <div className="command-next-icon"><ArrowRight className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="command-eyebrow">Do this now</div>
          <h2>{primaryLabel}</h2>
          <p>{primaryBody}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button onClick={run ? onPrimaryAction : onStart} className="w-full bg-blue-600 text-white"><ArrowRight className="mr-2 h-4 w-4" />Execute command</Button>
        <Button onClick={() => onUpdateUi({ activeTab: "plan" })} className="w-full border border-white/10 bg-white/[.04] text-slate-200"><CalendarDays className="mr-2 h-4 w-4" />Lock tomorrow</Button>
      </div>
    </Panel>

    <div className="command-layer-grid">
      <Panel className="command-covenant-panel p-5">
        <div className="command-section-head"><div><span>Layer 1</span><h2>Strict commitments</h2></div><strong>{completed}/6</strong></div>
        <div className="mt-4 space-y-3">
          {strictItems.map((rule) => {
            const checked = Boolean(day?.completedRuleIds.includes(rule.id));
            return <button key={rule.id} type="button" disabled={!run} onClick={() => run && onToggleRule(rule.id)} className={cn("command-rule-row", checked ? "is-kept" : "is-open")}>
              <span className="rule-check">{checked ? <Check className="h-4 w-4" /> : rule.order}</span>
              <span>{rule.label}</span>
            </button>;
          })}
        </div>
      </Panel>

      <Panel className="command-execute-panel p-5">
        <div className="command-section-head"><div><span>Layer 2</span><h2>Execution tasks</h2></div><strong>{todayTasks.length}/{openTodos.length}</strong></div>
        <div className="mt-4 space-y-3">
          {todayTasks.length ? todayTasks.map((todo) => <div key={todo.id} className="command-xp-row">
            <button type="button" onClick={() => onCompleteTodo(todo.id)} aria-label={"Complete " + todo.title}><Check className="h-4 w-4" /></button>
            <div className="min-w-0 flex-1"><h3>{todo.title}</h3><p>{todo.category} / {todo.phase}</p></div>
            <span>{todo.xp} XP</span>
          </div>) : <div className="command-empty-state"><Database className="h-5 w-5" /><p>No execution tasks are marked for today.</p><Button onClick={() => onUpdateUi({ activeTab: "inbox" })} className="mt-3 w-full border border-white/10 bg-white/[.04] text-slate-200">Open Execute</Button></div>}
          {openTodos.slice(0, 3).filter((todo) => !todo.today && todo.dueDate !== todayKey()).map((todo) => <button key={todo.id} type="button" onClick={() => onSendToday(todo.id)} className="command-send-row"><Plus className="h-4 w-4" />Send {todo.title} to today</button>)}
        </div>
      </Panel>
    </div>
  </div>;
}`);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[command-page-mockup] applied command page mockup UI");
}

const finalApp = readFileSync(appPath, "utf8");
const required = ["command-hero-card", "command-time-orb", "command-metric-strip", "command-score-strip", "Command", "Execute", "OS"];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
console.log("[command-page-mockup] command page checks passed");
