import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.cwd(), "src", "FastingModeApp.jsx");
let source = readFileSync(file, "utf8");
const skipped = [];
let applied = 0;

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
