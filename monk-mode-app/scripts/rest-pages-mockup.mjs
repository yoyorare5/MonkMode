import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[rest-pages-mockup] ${message}`);
}

function replaceFunction(name, replacement, marker) {
  if (marker && app.includes(marker)) return;
  const start = app.indexOf(`function ${name}(`);
  if (start < 0) fail(`Could not find ${name}`);
  const boundaries = [
    "\nfunction TodayScreen(",
    "\nfunction InboxScreen(",
    "\nfunction PlanScreen(",
    "\nfunction RewardsScreen(",
    "\nfunction SettingsScreen(",
    "\nfunction CommandApp(",
  ];
  const end = boundaries.map((candidate) => app.indexOf(candidate, start + 1)).filter((index) => index > start).sort((a, b) => a - b)[0];
  if (!end) fail(`Could not find boundary after ${name}`);
  app = `${app.slice(0, start)}${replacement}\n${app.slice(end + 1)}`;
}

replaceFunction("InboxScreen", `function InboxScreen({ state, onCreateTodo, onCompleteTodo, onSendToday, onUpdateTodo }) {
  const [draft, setDraft] = useState({ title: "", description: "", category: "Command", xp: 35, dueDate: "", today: true, recurrence: "none" });
  const open = state.xp.todos.filter((todo) => todo.status === "open");
  const todayTodos = open.filter((todo) => todo.today || todo.dueDate === todayKey());
  const inboxTodos = open.filter((todo) => !todo.today && todo.dueDate !== todayKey());
  const completedToday = state.xp.todos.filter((todo) => todo.completedDateKey === todayKey());
  const submit = () => {
    if (!draft.title.trim()) return;
    onCreateTodo({ ...draft, title: draft.title.trim(), xp: Number(draft.xp) || 35 });
    setDraft({ title: "", description: "", category: "Command", xp: 35, dueDate: "", today: true, recurrence: "none" });
  };
  return <div className="mock-screen execute-screen space-y-6">
    <Panel className="mock-hero execute-hero p-5 sm:p-7">
      <div className="mock-hero-top"><span className="mock-orb"><Database className="h-6 w-6" /></span><Badge>Layer 2 / Execute</Badge></div>
      <h1>Execute the work.</h1>
      <p>Capture commands fast. Move the right tasks into today. XP builds momentum without weakening the strict fast.</p>
      <div className="mock-stat-grid mt-6"><StatCard label="Today" value={todayTodos.length} /><StatCard label="Inbox" value={inboxTodos.length} /><StatCard label="Closed" value={completedToday.length} /></div>
    </Panel>

    <Panel className="mock-card p-5">
      <div className="command-section-head"><div><span>Quick capture</span><h2>Brain dump without clutter</h2></div><strong>{draft.xp}</strong></div>
      <div className="mt-5 space-y-3">
        <Input placeholder="What must be executed?" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        <Textarea placeholder="Optional detail, standard, or context." value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-20" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input placeholder="Tag" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
          <Input type="number" min="5" max="250" value={draft.xp} onChange={(event) => setDraft({ ...draft, xp: event.target.value })} />
          <select className="ui-select min-h-12 rounded-[22px] border px-4 text-white outline-none" value={draft.recurrence} onChange={(event) => setDraft({ ...draft, recurrence: event.target.value })}><option value="none">One-time</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select>
          <Button onClick={() => setDraft({ ...draft, today: !draft.today })} className={cn("border border-white/10 text-slate-200", draft.today ? "bg-blue-600 text-white" : "bg-white/[.04]")}>{draft.today ? "Today" : "Inbox"}</Button>
        </div>
        <Button onClick={submit} className="w-full bg-blue-600 text-white"><Plus className="mr-2 h-4 w-4" />Capture command</Button>
      </div>
    </Panel>

    <div className="mock-grid">
      <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Today</span><h2>Active commands</h2></div><strong>{todayTodos.length}</strong></div><div className="mt-4 space-y-3">{todayTodos.length ? todayTodos.map((todo) => <div key={todo.id} className="screen-mock-row"><button type="button" onClick={() => onCompleteTodo(todo.id)}><Check className="h-4 w-4" /></button><div><h3>{todo.title}</h3><p>{todo.category} / {todo.phase}</p></div><span>{todo.xp} XP</span></div>) : <div className="screen-empty">No commands are assigned to today.</div>}</div></Panel>
      <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Inbox</span><h2>Unscheduled commands</h2></div><strong>{inboxTodos.length}</strong></div><div className="mt-4 space-y-3">{inboxTodos.length ? inboxTodos.slice(0, 8).map((todo) => <div key={todo.id} className="screen-mock-row"><button type="button" onClick={() => onSendToday(todo.id)}><ArrowRight className="h-4 w-4" /></button><div><h3>{todo.title}</h3><p>{todo.category} / {todo.recurrence}</p></div><span>{todo.xp} XP</span></div>) : <div className="screen-empty">Inbox clear. Capture only what matters.</div>}</div></Panel>
    </div>
  </div>;
}`, "execute-screen");

replaceFunction("PlanScreen", `function PlanScreen({ state, onLockPlan, onTogglePrep, onSeedPreset }) {
  const tomorrow = addDays(todayKey(), 1);
  const existing = state.plans.byDate[tomorrow] || normalizePlan({}, tomorrow);
  const openTodos = state.xp.todos.filter((todo) => todo.status === "open");
  const [plan, setPlan] = useState(existing);
  const preset = presetById(plan.presetId || state.prep.activePreset);
  const checklist = state.prep.checklists[tomorrow] || makeChecklist(preset.id);
  const toggleTop = (todoId) => {
    const current = plan.topTaskIds || [];
    const next = current.includes(todoId) ? current.filter((id) => id !== todoId) : [...current, todoId].slice(0, 3);
    setPlan({ ...plan, topTaskIds: next, firstTaskId: plan.firstTaskId || todoId });
  };
  return <div className="mock-screen plan-screen space-y-6">
    <Panel className="mock-hero plan-hero p-5 sm:p-7">
      <div className="mock-hero-top"><span className="mock-orb"><CalendarDays className="h-6 w-6" /></span><Badge>Nightly ritual</Badge></div>
      <h1>Lock tomorrow.</h1>
      <p>Decide the day before it gets loud. Pick the top three, name the danger point, and prepare the launch.</p>
      <div className="mock-stat-grid mt-6"><StatCard label="Date" value={tomorrow.slice(5)} /><StatCard label="Top 3" value={(plan.topTaskIds || []).length} /><StatCard label="Preset" value={preset.title} /></div>
    </Panel>

    <div className="mock-grid">
      <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Priority</span><h2>Top three commands</h2></div><strong>{(plan.topTaskIds || []).length}/3</strong></div><div className="mt-4 space-y-3">{openTodos.length ? openTodos.slice(0, 10).map((todo) => <button key={todo.id} type="button" onClick={() => toggleTop(todo.id)} className={cn("screen-select-row", plan.topTaskIds.includes(todo.id) && "is-selected")}><span>{plan.topTaskIds.includes(todo.id) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span><div><h3>{todo.title}</h3><p>{todo.category} / {todo.xp} XP</p></div></button>) : <div className="screen-empty">Capture execution tasks first, then lock tomorrow.</div>}</div></Panel>
      <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Rule</span><h2>Tomorrow's setup</h2></div><strong>{preset.title}</strong></div><div className="mt-4 space-y-3"><select className="ui-select min-h-12 w-full rounded-[22px] border px-4 text-white outline-none" value={plan.presetId} onChange={(event) => setPlan({ ...plan, presetId: event.target.value })}>{PREP_PRESETS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><Textarea placeholder="Danger point to avoid" value={plan.dangerPoint} onChange={(event) => setPlan({ ...plan, dangerPoint: event.target.value })} className="min-h-20" /><Textarea placeholder="Prayer, intention, or standard for tomorrow" value={plan.intention} onChange={(event) => setPlan({ ...plan, intention: event.target.value })} className="min-h-24" /><Button onClick={() => onLockPlan(tomorrow, plan)} className="w-full bg-blue-600 text-white"><Lock className="mr-2 h-4 w-4" />Lock tomorrow</Button><Button onClick={() => onSeedPreset(plan.presetId)} className="w-full border border-white/10 bg-white/[.04] text-slate-200"><Plus className="mr-2 h-4 w-4" />Apply preset tasks</Button></div></Panel>
    </div>

    <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Prep</span><h2>Night and morning checklist</h2></div><strong>{checklist.night.filter((item) => item.done).length + checklist.morning.filter((item) => item.done).length}</strong></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{[["night", "Night before"], ["morning", "Morning launch"]].map(([section, title]) => <div key={section} className="screen-check-block"><h3>{title}</h3>{checklist[section].map((item) => <button key={item.id} type="button" onClick={() => onTogglePrep(tomorrow, section, item.id, plan.presetId)} className={cn("screen-check-row", item.done && "is-done")}><span>{item.done ? <Check className="h-4 w-4" /> : null}</span>{item.label}</button>)}</div>)}</div></Panel>
  </div>;
}`, "plan-screen");

replaceFunction("RewardsScreen", `function RewardsScreen({ state }) {
  const rewards = state.xp.rewards;
  const level = Math.max(1, Math.floor((rewards.totalXp || 0) / 500) + 1);
  const rank = rewards.totalXp >= 2500 ? "Consecrated" : rewards.streakDays >= 3 ? "Steadfast" : "Unstoppable";
  const nextLevel = level * 500;
  const progress = Math.min(100, Math.round(((rewards.totalXp || 0) / nextLevel) * 100));
  return <div className="mock-screen rewards-screen space-y-6">
    <Panel className="mock-hero rewards-hero p-5 sm:p-7">
      <div className="mock-hero-top"><span className="mock-orb"><Sparkles className="h-6 w-6" /></span><Badge>Identity OS</Badge></div>
      <h1>Discipline score.</h1>
      <p>XP records execution. The strict fast remains the covenant; this layer shows the identity being built through repeated obedience.</p>
      <div className="mock-stat-grid mt-6"><StatCard label="Score" value={rewards.totalXp || 0} /><StatCard label="Level" value={level} /><StatCard label="Rank" value={rank} /></div>
    </Panel>

    <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Progression</span><h2>Next level</h2></div><strong>{progress}%</strong></div><div className="screen-progress mt-5"><span style={{ width: progress + "%" }} /></div><div className="mock-stat-grid mt-5"><StatCard label="Streak" value={rewards.streakDays || 0} /><StatCard label="Combo" value={rewards.comboCount || 0} /><StatCard label="Perfect" value={rewards.perfectDays || 0} /></div></Panel>

    <div className="mock-grid"><Panel className="mock-card p-5"><div className="command-section-head"><div><span>Unlocked</span><h2>Achievements</h2></div><strong>{rewards.achievements.length}</strong></div><div className="mt-4 space-y-3">{rewards.achievements.length ? rewards.achievements.map((item) => <div key={item.id} className="screen-mock-row"><span className="mock-mini-orb"><ShieldCheck className="h-4 w-4" /></span><div><h3>{item.title}</h3><p>{item.description}</p></div></div>) : <div className="screen-empty">No achievements yet. Execute the first command.</div>}</div></Panel><Panel className="mock-card p-5"><div className="command-section-head"><div><span>Ledger</span><h2>Recent XP</h2></div><strong>{rewards.events.length}</strong></div><div className="mt-4 space-y-3">{rewards.events.length ? rewards.events.slice(0, 8).map((event) => <div key={event.id} className="screen-mock-row"><span className="mock-mini-orb">+{event.amount}</span><div><h3>{event.title}</h3><p>{event.dateKey}</p></div></div>) : <div className="screen-empty">The ledger is empty.</div>}</div></Panel></div>
  </div>;
}`, "rewards-screen");

replaceFunction("SettingsScreen", `function SettingsScreen({ user, state, sync, onSound, onNotify, onReset, onReload, onSignOut }) {
  const support = "Notification" in window;
  const openTodos = state.xp.todos.filter((todo) => todo.status === "open").length;
  const plans = Object.keys(state.plans.byDate).length;
  return <div className="mock-screen settings-screen space-y-6">
    <Panel className="mock-hero settings-hero p-5 sm:p-7">
      <div className="mock-hero-top"><span className="mock-orb"><Settings className="h-6 w-6" /></span><Badge>{sync.label}</Badge></div>
      <h1>System settings.</h1>
      <p>{sync.message}</p>
      <div className="mock-stat-grid mt-6"><StatCard label="Strict" value={state.runs.activeRun ? "Active" : "None"} /><StatCard label="Todos" value={openTodos} /><StatCard label="Plans" value={plans} /></div>
    </Panel>

    <div className="mock-grid">
      <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Account</span><h2>{user?.email || "Device mode"}</h2></div><User className="h-5 w-5 text-slate-400" /></div><p className="screen-copy mt-4">Cloud sync is used when Supabase is connected. Device cache remains available as fallback.</p></Panel>
      <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Sound</span><h2>Premium feedback</h2></div><strong>{state.ui.soundEnabled ? "On" : "Off"}</strong></div><Button onClick={onSound} className="mt-5 w-full bg-blue-600 text-white">{state.ui.soundEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}Sound {state.ui.soundEnabled ? "on" : "off"}</Button></Panel>
      <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Warnings</span><h2>Red-zone reminders</h2></div><Bell className="h-5 w-5 text-slate-400" /></div><p className="screen-copy mt-4">{support ? "App-side warnings run while the app is open. Push hooks remain ready for production scheduling." : "Notifications are not supported in this browser."}</p><Button disabled={!support} onClick={onNotify} className="mt-5 w-full bg-blue-600 text-white">{state.ui.notificationsEnabled ? "Disable reminders" : "Enable reminders"}</Button></Panel>
      <Panel className="mock-card p-5"><div className="command-section-head"><div><span>Reliability</span><h2>Cache and cloud</h2></div><Database className="h-5 w-5 text-slate-400" /></div><div className="mt-5 space-y-3"><Button onClick={onReload} className="w-full border border-white/10 bg-white/[.04] text-slate-200"><RotateCcw className="mr-2 h-4 w-4" />Reload cloud</Button><Button onClick={onReset} className="w-full border border-white/10 bg-white/[.04] text-slate-200"><Trash2 className="mr-2 h-4 w-4" />Reset local cache</Button></div></Panel>
    </div>

    <Button onClick={onSignOut} className="settings-signout w-full border border-red-400/25 bg-red-500/10 text-red-100"><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
  </div>;
}`, "settings-screen");

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[rest-pages-mockup] applied mockup layouts to remaining screens");
}

const finalApp = readFileSync(appPath, "utf8");
const required = ["execute-screen", "plan-screen", "rewards-screen", "settings-screen", "System settings", "Discipline score", "Lock tomorrow"];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
console.log("[rest-pages-mockup] remaining screen checks passed");
