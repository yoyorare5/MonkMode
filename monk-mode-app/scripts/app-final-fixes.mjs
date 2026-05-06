import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.cwd(), "src", "FastingModeApp.jsx");
let source = readFileSync(file, "utf8");

const replace = (before, after) => {
  if (source.includes(after)) return;
  if (!source.includes(before)) {
    throw new Error(`[app-final-fixes] missing fragment: ${before.slice(0, 90)}`);
  }
  source = source.replace(before, after);
};

replace(
  `const EmptyState = ({ title, body, action, onAction }) => <GlassCard className="empty-state"><Sparkles className="h-7 w-7 text-cyan-200" /><h3>{title}</h3><p>{body}</p>{action ? <GradientButton onClick={onAction}>{action}</GradientButton> : null}</GlassCard>;`,
  `const EmptyState = ({ title, body, action, onAction }) => <GlassCard className="empty-state"><Sparkles className="empty-icon h-7 w-7 text-cyan-200" /><div><h3>{title}</h3><p>{body}</p></div>{action ? <GradientButton onClick={onAction}>{action}</GradientButton> : null}</GlassCard>;`
);

replace(`Flame className="h-3.5 w-3.5"`, `Flame className="streak-flame h-3.5 w-3.5"`);

replace(
  `  const stats = routineStats(state);
  return <GlassCard className="routine-card">`,
  `  const stats = routineStats(state);
  const visibleItems = stats.items.slice(0, Math.min(stats.items.length, 5 + stats.done));
  const hiddenCount = Math.max(0, stats.items.length - visibleItems.length);
  return <GlassCard className="routine-card">`
);

replace(
  `    <div className="routine-list">{stats.items.map((item) => <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={cn("routine-item", stats.completed[item.id] && "done")}><span className="check-dot">{stats.completed[item.id] ? <Check className="h-3.5 w-3.5" /> : null}</span><span><strong>{item.title}</strong><small>{item.category} / {item.xp} XP</small></span></button>)}</div>
  </GlassCard>;`,
  `    <div className="routine-list">{visibleItems.map((item) => <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={cn("routine-item", stats.completed[item.id] && "done")}><span className="check-dot">{stats.completed[item.id] ? <Check className="h-3.5 w-3.5" /> : null}</span><span><strong>{item.title}</strong><small>{item.category} / {item.xp} XP</small></span></button>)}</div>
    {hiddenCount ? <p className="routine-more">{hiddenCount} more unlock as you complete the visible routine.</p> : null}
  </GlassCard>;`
);

replace(`className="modal-card" initial`, `className="modal-card goal-modal-card" initial`);
replace(`<GradientButton onClick={submit}>Create Goal`, `<GradientButton className="goal-submit" onClick={submit}>Create Goal`);
replace(`return <div className="screen-stack"><ScreenHero eyebrow="Goals Progress"`, `return <div className="screen-stack goals-screen"><ScreenHero eyebrow="Goals Progress"`);
replace(`Create a goal, deadline, and daily steps. The app tracks whether the pace is enough to reach it.`, `Create one outcome, then define the deadline and the daily steps that reach it.`);
replace(`Start with one clear outcome. Add the deadline and the daily steps required to reach it.`, `Pick one target. Fasting Mode will turn it into daily steps and show whether your pace is enough.`);

writeFileSync(file, source);
console.log("[app-final-fixes] applied final mobile UX fixes");
