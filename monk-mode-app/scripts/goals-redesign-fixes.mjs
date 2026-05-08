import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.cwd(), "src", "FastingModeApp.jsx");
let source = readFileSync(file, "utf8");
const skipped = [];
let applied = 0;

const replace = (before, after, label = before.slice(0, 90)) => {
  if (source.includes(after)) return;
  if (!source.includes(before)) {
    skipped.push(label);
    return;
  }
  source = source.replace(before, after);
  applied += 1;
};

const replaceFunction = (name, nextName, after) => {
  if (source.includes(after)) return;
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf(`function ${nextName}(`, start);
  if (start === -1 || end === -1 || end <= start) {
    skipped.push(name);
    return;
  }
  source = `${source.slice(0, start)}${after}\n${source.slice(end)}`;
  applied += 1;
};

replaceFunction(
  "GoalModal",
  "GoalsScreen",
  `function GoalModal({ onClose, onCreate }) {
  const [draft, setDraft] = useState({ title: "", category: "Focus", targetValue: 21, currentValue: 0, unit: "sessions", deadline: addDays(todayKey(), 30), why: "", steps: "Daily execution block\\nMinimum version: 5 honest minutes" });
  const [error, setError] = useState("");
  const submit = (event) => {
    event?.preventDefault?.();
    const title = draft.title.trim();
    if (!title) {
      setError("Name the goal first.");
      return;
    }
    setError("");
    onCreate({ ...draft, title, targetValue: Math.max(1, Number(draft.targetValue) || 1), currentValue: Math.max(0, Number(draft.currentValue) || 0), category: draft.category.trim() || "Discipline", unit: draft.unit.trim() || "sessions", deadline: draft.deadline || addDays(todayKey(), 30) });
    onClose();
  };
  return <motion.div className="modal-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.form className="modal-card goal-modal-card" onSubmit={submit} initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}><button type="button" className="modal-close" onClick={onClose} aria-label="Close goal form"><X /></button><h2>Create Goal</h2><p>Set the target, deadline, and daily steps that reverse-engineer the outcome.</p>{error ? <div className="form-error" role="alert">{error}</div> : null}<div className="form-grid"><label><span>Goal title</span><input autoFocus placeholder="Example: finish 21 focus sessions" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label><span>Category</span><input placeholder="Focus, fitness, faith..." value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label><label><span>Target amount</span><input type="number" min="1" inputMode="numeric" value={draft.targetValue} onChange={(event) => setDraft({ ...draft, targetValue: event.target.value })} /></label><label><span>Unit</span><input placeholder="sessions, pounds, pages..." value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} /></label><label><span>Deadline</span><input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} /></label><label><span>Daily steps</span><textarea placeholder="One daily step per line" value={draft.steps} onChange={(event) => setDraft({ ...draft, steps: event.target.value })} /></label><label><span>Why this matters</span><textarea placeholder="Why does this matter before God?" value={draft.why} onChange={(event) => setDraft({ ...draft, why: event.target.value })} /></label></div><GradientButton className="goal-submit" type="submit">Create Goal<ArrowRight /></GradientButton></motion.form></motion.div>;
}`,
);

replace(
  `  const createGoal = (draft) => {
    const steps = String(draft.steps || "").split("\\n").map((step) => step.trim()).filter(Boolean);
    const linkedDailyActions = (steps.length ? steps : ["Daily execution block"]).slice(0, 8).map((step, index) => normalizeGoalAction({ title: step, minimumVersion: index === 0 ? "Minimum version: 5 honest minutes" : \`Smallest version of: \${step}\`, estimatedMinutes: index === 0 ? 25 : 15, difficulty: index === 0 ? "medium" : "easy" }));
    const goal = normalizeGoal({ id: newId(), title: draft.title, category: draft.category, targetValue: draft.targetValue, currentValue: draft.currentValue, unit: draft.unit, deadline: draft.deadline, why: draft.why, status: "active", createdAt: todayKey(), linkedDailyActions, progressHistory: [{ dateKey: todayKey(), value: 0 }] });
    persist({ ...stateRef.current, goals: { items: [goal, ...stateRef.current.goals.items] }, ui: { ...stateRef.current.ui, activeTab: "goals" } });
  };`,
  `  const createGoal = (draft) => {
    const current = normalizeState(stateRef.current || {});
    const steps = String(draft.steps || "").split("\\n").map((step) => step.trim()).filter(Boolean);
    const linkedDailyActions = (steps.length ? steps : ["Daily execution block"]).slice(0, 8).map((step, index) => normalizeGoalAction({ title: step, minimumVersion: index === 0 ? "Minimum version: 5 honest minutes" : \`Smallest version of: \${step}\`, estimatedMinutes: index === 0 ? 25 : 15, difficulty: index === 0 ? "medium" : "easy" }));
    const goal = normalizeGoal({ id: newId(), title: draft.title, category: draft.category, targetValue: draft.targetValue, currentValue: draft.currentValue, unit: draft.unit, deadline: draft.deadline, why: draft.why, status: "active", createdAt: todayKey(), linkedDailyActions, progressHistory: [{ dateKey: todayKey(), value: Math.max(0, Number(draft.currentValue) || 0) }] });
    persist({ ...current, goals: { items: [goal, ...(current.goals?.items || [])] }, ui: { ...current.ui, activeTab: "goals" } });
  };`,
  "defensive goal creation"
);

replaceFunction(
  "GoalProgressChart",
  "GoalCard",
  `function GoalProgressChart({ goals }) {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(todayKey(), index - 6));
  const series = dates.map((date, index) => {
    if (!goals.length) return 0;
    const values = goals.map((goal) => {
      const sorted = [...(goal.progressHistory || [])].sort((a, b) => String(a.dateKey).localeCompare(String(b.dateKey)));
      const point = sorted.filter((item) => item.dateKey <= date).pop();
      if (point) return Math.min(100, Math.round((Number(point.value) / Math.max(1, goal.targetValue)) * 100));
      const current = goalPercent(goal);
      return Math.max(0, Math.round(current * (0.62 + index * 0.055)));
    });
    return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
  });
  const points = series.map((value, index) => String(index * 48 + 12) + "," + String(112 - value)).join(" ");
  return <svg className="goal-chart" viewBox="0 0 312 128" role="img" aria-label="Weekly goal progress chart"><defs><linearGradient id="lineGlow" x1="0" x2="1"><stop offset="0%" stopColor="#2fffe2" /><stop offset="55%" stopColor="#80f780" /><stop offset="100%" stopColor="#dfff3f" /></linearGradient></defs>{[0, 25, 50, 75, 100].map((value) => <line key={value} x1="0" x2="312" y1={112 - value} y2={112 - value} className="chart-grid" />)}<polyline points={points} fill="none" stroke="url(#lineGlow)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{series.map((value, index) => <circle key={index} cx={index * 48 + 12} cy={112 - value} r="5" className="chart-dot" />)}</svg>;
}`,
);

replaceFunction(
  "GoalsScreen",
  "HeatmapCalendar",
  `function GoalsScreen({ state, onCreateGoal, onToggleGoalAction }) {
  const [open, setOpen] = useState(false);
  const goals = state.goals.items;
  const score = Math.round(goals.reduce((sum, goal) => sum + goalPercent(goal), 0) / Math.max(1, goals.length));
  const counts = goals.reduce((acc, goal) => { acc[goalPace(goal).status] += 1; return acc; }, { "on-track": 0, behind: 0, ahead: 0 });
  const dayStreak = state.xp.rewards.streakDays || wonDays(state.runs.activeRun) || 0;
  const onPace = goals.length ? Math.round(((counts["on-track"] + counts.ahead) / goals.length) * 100) : 0;
  return <div className="screen-stack goals-screen goals-redesign">
    <GlassCard className="goals-hero-card">
      <div className="goals-hero-copy">
        <span className="goals-eyebrow">Goals Progress</span>
        <h1><span>Set a goal.</span><strong>Build your momentum.</strong></h1>
        <p>Choose one outcome, set a deadline, and we&apos;ll break it into daily steps.</p>
        <div className="goals-progress-line" aria-hidden="true"><span style={{ width: goals.length ? score + "%" : "30%" }} /></div>
        <div className="goals-hero-stats">
          <div><i><CalendarDays /></i><strong>{dayStreak}</strong><span>Day streak</span></div>
          <div><i><Target /></i><strong>{goals.length}</strong><span>Goals set</span></div>
          <div><i><TrendingUp /></i><strong>{onPace}%</strong><span>On pace</span></div>
        </div>
        <GradientButton className="goals-primary-cta" onClick={() => setOpen(true)}><Plus />New Goal<ChevronRight /></GradientButton>
      </div>
      <div className="goal-orbit" aria-hidden="true"><span /><span /><span /><Target /></div>
    </GlassCard>
    {goals.length ? <GlassCard className="floating-chart-card goals-chart-card"><div className="chart-head"><div><span>Goals Progress</span><strong>{score}%</strong><p>This week</p></div><span className="status-pill on-track">{onPace}% on pace</span></div><GoalProgressChart goals={goals} /><div className="status-rows"><span><i className="green" />On Track <b>{counts["on-track"]} goals</b></span><span><i className="yellow" />Behind <b>{counts.behind} goals</b></span><span><i className="cyan" />Ahead <b>{counts.ahead} goals</b></span></div></GlassCard> : <GlassCard className="goals-empty-card"><div className="empty-orb"><Sparkles /></div><div><h3>No goals yet</h3><p>Pick one target. Fasting Mode will turn it into daily steps and show whether your pace is enough.</p><button type="button" className="outlined-goal-button" onClick={() => setOpen(true)}><Target />Set your first goal<ChevronRight /></button></div></GlassCard>}
    <div className="goal-grid">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} onToggleAction={onToggleGoalAction} />)}</div>
    <AnimatePresence>{open ? <GoalModal onClose={() => setOpen(false)} onCreate={onCreateGoal} /> : null}</AnimatePresence>
  </div>;
}`,
);

writeFileSync(file, source);
const suffix = skipped.length ? `; skipped missing functions: ${skipped.join(", ")}` : "";
console.log(`[goals-redesign-fixes] completed (${applied} applied${suffix})`);
