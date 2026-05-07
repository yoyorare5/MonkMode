import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.cwd(), "src", "FastingModeApp.jsx");
let source = readFileSync(file, "utf8");
const skipped = [];
let applied = 0;

const skip = (label) => {
  skipped.push(label);
};

const replace = (before, after, label = before.slice(0, 90)) => {
  if (source.includes(after)) return;
  if (!source.includes(before)) {
    skip(label);
    return;
  }
  source = source.replace(before, after);
  applied += 1;
};

const replaceAny = (befores, after, label) => {
  if (source.includes(after)) return;
  const before = befores.find((fragment) => source.includes(fragment));
  if (!before) {
    skip(label);
    return;
  }
  source = source.replace(before, after);
  applied += 1;
};

replace(
  `const EmptyState = ({ title, body, action, onAction }) => <GlassCard className="empty-state"><Sparkles className="h-7 w-7 text-cyan-200" /><h3>{title}</h3><p>{body}</p>{action ? <GradientButton onClick={onAction}>{action}</GradientButton> : null}</GlassCard>;`,
  `const EmptyState = ({ title, body, action, onAction }) => <GlassCard className="empty-state"><Sparkles className="empty-icon h-7 w-7 text-cyan-200" /><div><h3>{title}</h3><p>{body}</p></div>{action ? <GradientButton onClick={onAction}>{action}</GradientButton> : null}</GlassCard>;`,
  "empty state layout"
);

replace(`Flame className="h-3.5 w-3.5"`, `Flame className="streak-flame h-3.5 w-3.5"`, "streak flame alignment class");

replace(
  `function disciplineScore(state) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const strict = day ? (day.completedRuleIds.length / 6) * 42 : 8;
  const actions = goalActionsToday(state);
  const goals = actions.length ? (actions.filter((item) => item.done).length / actions.length) * 16 : 6;
  const routine = routineStats(state).percent * 0.22;
  const xpToday = state.xp.rewards.todayXp ? Math.min(10, state.xp.rewards.todayXp / 10) : 0;
  const streak = Math.min(10, (state.xp.rewards.streakDays || wonDays(run)) * 3);
  return Math.max(0, Math.min(100, Math.round(strict + goals + routine + xpToday + streak)));
}`,
  `function disciplineScore(state) {
  const run = state.runs.activeRun;
  const day = currentDay(run);
  const strictTotal = Math.max(1, run?.rules?.length || 6);
  const strictDone = day?.completedRuleIds?.length || 0;
  const strict = (strictDone / strictTotal) * 55;
  const actions = goalActionsToday(state);
  const goals = actions.length ? (actions.filter((item) => item.done).length / actions.length) * 15 : 0;
  const routine = routineStats(state).percent * 0.25;
  const xpToday = Math.min(5, (state.xp.rewards.todayXp || 0) / 40);
  return Math.max(0, Math.min(100, Math.round(strict + goals + routine + xpToday)));
}`,
  "discipline score math"
);

replaceAny(
  [
    `  const stats = routineStats(state);
  const visibleItems = stats.items.slice(0, Math.min(stats.items.length, 5 + stats.done));
  const hiddenCount = Math.max(0, stats.items.length - visibleItems.length);
  return <GlassCard className="routine-card">`,
    `  const stats = routineStats(state);
  return <GlassCard className="routine-card">`,
  ],
  `  const stats = routineStats(state);
  const remainingItems = stats.items.filter((item) => !stats.completed[item.id]);
  const visibleItems = remainingItems.slice(0, 5);
  const hiddenCount = Math.max(0, remainingItems.length - visibleItems.length);
  return <GlassCard className="routine-card">`,
  "routine visible item setup"
);

replace(
  `    <div className="routine-list">{stats.items.map((item) => <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={cn("routine-item", stats.completed[item.id] && "done")}><span className="check-dot">{stats.completed[item.id] ? <Check className="h-3.5 w-3.5" /> : null}</span><span><strong>{item.title}</strong><small>{item.category} / {item.xp} XP</small></span></button>)}</div>
  </GlassCard>;`,
  `    <div className="routine-list">{visibleItems.map((item) => <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={cn("routine-item", stats.completed[item.id] && "done")}><span className="check-dot">{stats.completed[item.id] ? <Check className="h-3.5 w-3.5" /> : null}</span><span><strong>{item.title}</strong><small>{item.category} / {item.xp} XP</small></span></button>)}</div>
    {hiddenCount ? <p className="routine-more">{hiddenCount} more unlock as you complete the visible routine.</p> : null}
  </GlassCard>;`,
  "routine visible item render"
);

replace(`className="modal-card" initial`, `className="modal-card goal-modal-card" initial`, "goal modal class");
replace(`<GradientButton onClick={submit}>Create Goal`, `<GradientButton className="goal-submit" onClick={submit}>Create Goal`, "goal submit button class");
replace(`return <div className="screen-stack"><ScreenHero eyebrow="Goals Progress"`, `return <div className="screen-stack goals-screen"><ScreenHero eyebrow="Goals Progress"`, "goals screen class");
replace(`Create a goal, deadline, and daily steps. The app tracks whether the pace is enough to reach it.`, `Create one outcome, then define the deadline and the daily steps that reach it.`, "goals hero copy");
replace(`Start with one clear outcome. Add the deadline and the daily steps required to reach it.`, `Pick one target. Fasting Mode will turn it into daily steps and show whether your pace is enough.`, "goals empty copy");

writeFileSync(file, source);
const suffix = skipped.length ? `; skipped already-applied/missing patches: ${skipped.join(", ")}` : "";
console.log(`[app-final-fixes] completed final mobile UX fixes (${applied} applied${suffix})`);
