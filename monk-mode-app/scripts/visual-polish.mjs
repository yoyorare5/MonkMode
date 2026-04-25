import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[visual-polish] ${message}`);
}

function replaceExact(before, after, label) {
  if (app.includes(after)) return true;
  if (app.includes(before)) {
    app = app.split(before).join(after);
    return true;
  }
  console.warn(`[visual-polish] skipped ${label}`);
  return false;
}

function replaceFunction(name, nextName, replacement, marker) {
  if (marker && app.includes(marker)) return true;
  const start = app.indexOf(`function ${name}(`);
  if (start < 0) fail(`Could not find ${name}`);
  const end = app.indexOf(`\nfunction ${nextName}(`, start);
  if (end < 0) fail(`Could not find boundary after ${name}`);
  app = `${app.slice(0, start)}${replacement}\n${app.slice(end + 1)}`;
  return true;
}

replaceExact(
  'const pageMotion = { initial: { opacity: 0, y: 10, filter: "blur(4px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -8, filter: "blur(4px)" }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } };',
  'const pageMotion = { initial: { opacity: 0, y: 18, filter: "blur(10px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -12, filter: "blur(8px)" }, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } };',
  "page motion"
);
replaceExact(
  'const cardMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } };',
  'const cardMotion = { initial: { opacity: 0, y: 16, scale: 0.985, filter: "blur(8px)" }, animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } };',
  "card motion"
);

replaceExact(
  'const Button = ({ className = "", children, ...props }) => <button type="button" className={cn("inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50", className)} {...props}>{children}</button>;',
  'const Button = ({ className = "", children, ...props }) => <button type="button" className={cn("ui-button inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-[transform,background,border-color,color,box-shadow,filter] duration-300 ease-out active:scale-[0.975] disabled:pointer-events-none disabled:opacity-45", className)} {...props}>{children}</button>;',
  "Button primitive"
);
replaceExact(
  'const Panel = ({ className = "", children, motionProps = {} }) => <motion.div {...cardMotion} {...motionProps} className={cn("rounded-[28px] border border-blue-400/15 bg-white/[0.055] shadow-[0_18px_80px_rgba(0,0,0,.38)] backdrop-blur-xl", className)}>{children}</motion.div>;',
  'const Panel = ({ className = "", children, motionProps = {} }) => <motion.div {...cardMotion} {...motionProps} className={cn("ui-panel fluid-panel rounded-[30px] border backdrop-blur-2xl", className)}>{children}</motion.div>;',
  "Panel primitive"
);
replaceExact(
  'const Badge = ({ className = "", children }) => <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", className)}>{children}</span>;',
  'const Badge = ({ className = "", children }) => <span className={cn("ui-badge inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", className)}>{children}</span>;',
  "Badge primitive"
);
replaceExact(
  'const Input = (props) => <input className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/40" {...props} />;',
  'const Input = (props) => <input className="ui-input premium-input min-h-12 w-full rounded-[22px] border px-4 text-white outline-none placeholder:text-slate-600" {...props} />;',
  "Input primitive"
);
replaceExact(
  'const Textarea = ({ className = "", ...props }) => <textarea className={cn("min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/40", className)} {...props} />;',
  'const Textarea = ({ className = "", ...props }) => <textarea className={cn("ui-input premium-input min-h-28 w-full resize-none rounded-[24px] border px-4 py-3 text-white outline-none placeholder:text-slate-600", className)} {...props} />;',
  "Textarea primitive"
);

replaceExact(
  'return <div className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(37,99,235,.22),transparent_34%),linear-gradient(to_bottom,#02040a,#050916_46%,#02040a)]" /><div className="relative min-h-dvh px-[max(14px,env(safe-area-inset-left))] pb-[max(14px,env(safe-area-inset-bottom))] pt-[max(10px,env(safe-area-inset-top))]">{children}</div></div>;',
  'return <div className="ui-shell relative min-h-dvh overflow-hidden text-white"><div className="ui-shell-glow pointer-events-none fixed inset-0" /><div className="relative min-h-dvh px-[max(14px,env(safe-area-inset-left))] pb-[max(14px,env(safe-area-inset-bottom))] pt-[max(10px,env(safe-area-inset-top))]">{children}</div></div>;',
  "Shell background"
);
replaceExact(
  'return <div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-blue-300/20 bg-blue-500/10 text-blue-200"><Flame className="h-5 w-5" /></div><div className="min-w-0"><div className="truncate text-sm font-semibold uppercase tracking-[.22em] text-blue-200">Fasting Mode</div><div className="truncate text-xs text-slate-500">Command system</div></div></div>;',
  'return <div className="flex min-w-0 items-center gap-3"><div className="ui-brand-mark grid h-11 w-11 shrink-0 place-items-center rounded-full border text-blue-100"><Flame className="h-5 w-5" /></div><div className="min-w-0"><div className="truncate text-sm font-semibold uppercase tracking-[.18em] text-blue-100">Fasting Mode</div><div className="truncate text-xs text-slate-500">Command system</div></div></div>;',
  "Brand mark"
);
replaceExact(
  'return <div className="sticky top-0 z-30 -mx-2 mb-4 border-b border-white/10 bg-[#02040a]/82 px-2 py-3 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Brand /><div className="flex shrink-0 items-center gap-2">{user ? <Badge className="hidden border border-white/10 bg-white/[.04] text-slate-300 sm:inline-flex"><Icon className="mr-2 h-3.5 w-3.5" />{sync.label}</Badge> : null}<button type="button" onClick={onSound} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300">{ui.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>{user ? <button type="button" onClick={() => onTab("settings")} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300"><Settings className="h-4 w-4" /></button> : null}</div></div></div>;',
  'return <div className="ui-topbar app-topbar sticky top-0 z-30 -mx-2 mb-5 border-b px-2 py-3 backdrop-blur-2xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Brand /><div className="flex shrink-0 items-center gap-2">{user ? <Badge className="hidden border border-white/10 bg-white/[.04] text-slate-300 sm:inline-flex"><Icon className="mr-2 h-3.5 w-3.5" />{sync.label}</Badge> : null}<button type="button" onClick={onSound} className="ui-icon-button grid h-11 w-11 place-items-center rounded-full border text-slate-300">{ui.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>{user ? <button type="button" onClick={() => onTab("settings")} className="ui-icon-button grid h-11 w-11 place-items-center rounded-full border text-slate-300"><Settings className="h-4 w-4" /></button> : null}</div></div></div>;',
  "TopBar"
);
replaceExact(
  'return <div className="flex items-start gap-3"><div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-3 text-blue-200"><Icon className="h-5 w-5" /></div><div className="min-w-0"><h2 className="text-lg font-semibold leading-tight">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}</div></div>;',
  'return <div className="flex items-start gap-3"><div className="ui-section-icon rounded-full border p-3"><Icon className="h-5 w-5" /></div><div className="min-w-0"><h2 className="text-lg font-semibold leading-tight text-slate-100">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}</div></div>;',
  "SectionTitle"
);
replaceExact(
  'return <div className="mb-5"><div className="text-[0.68rem] font-semibold uppercase tracking-[.28em] text-blue-200/75">{eyebrow}</div><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{body ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{body}</p> : null}</div>;',
  'return <div className="screen-title mb-6"><div className="text-[0.68rem] font-semibold uppercase tracking-[.22em] text-blue-200/70">{eyebrow}</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">{title}</h1>{body ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{body}</p> : null}</div>;',
  "ScreenHeader"
);
replaceExact(
  'return <div className={cn("min-w-0 rounded-2xl border p-3", tone === "danger" ? "border-red-400/20 bg-red-500/10" : "border-white/10 bg-white/[.035]")}><div className="truncate text-[0.68rem] uppercase tracking-[.12em] text-slate-500">{label}</div><div className="mt-2 min-w-0 truncate text-2xl font-semibold">{value}</div></div>;',
  'return <div className={cn("ui-stat min-w-0 rounded-[22px] border p-3", tone === "danger" ? "is-danger" : "is-default")}><div className="truncate text-[0.68rem] uppercase tracking-[.12em] text-slate-500">{label}</div><div className="mt-2 min-w-0 truncate text-2xl font-semibold">{value}</div></div>;',
  "StatCard"
);

replaceFunction("Auth", "Onboarding", `function Auth({ onSignIn, onSignUp, onLocal, loading, message, ui, onSound }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async () => {
    setError("");
    const result = mode === "signup" ? await onSignUp(form) : await onSignIn(form);
    if (result?.error) setError(result.error);
    if (result?.message) setError(result.message);
  };
  const pillars = [["Faith", "Anchor", ShieldCheck], ["Discipline", "Strength", Target], ["Focus", "Clarity", Sparkles], ["Freedom", "Reward", Flame]];
  return <Shell><main className="auth-stage mx-auto flex min-h-[calc(100dvh-28px)] max-w-5xl flex-col justify-center px-1 py-4 sm:py-8"><motion.section initial={{ opacity: 0, y: 22, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }} className="auth-shell relative overflow-hidden rounded-[38px] border p-5 shadow-2xl sm:p-8"><div className="auth-bg-orb auth-bg-orb-one" /><div className="auth-bg-orb auth-bg-orb-two" /><header className="relative z-10 flex items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><div className="auth-logo grid h-16 w-16 shrink-0 place-items-center rounded-full border"><Flame className="h-8 w-8" /></div><div className="min-w-0"><div className="truncate text-sm font-semibold uppercase tracking-[.42em] text-slate-100">Fasting Mode</div><div className="mt-1 text-xs uppercase tracking-[.2em] text-blue-100/55">Orthodox discipline system</div></div></div><button type="button" onClick={onSound} className="auth-sound grid h-12 w-12 shrink-0 place-items-center rounded-full border text-slate-300">{ui.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button></header><div className="relative z-10 mx-auto mt-8 max-w-3xl text-center"><Badge className="auth-kicker border text-blue-100"><ShieldCheck className="mr-2 h-3.5 w-3.5" />Consecrated command system</Badge><h1 className="auth-title mt-5 text-5xl font-semibold leading-[0.92] tracking-tight text-slate-50 sm:text-7xl"><span>Master</span><span className="block text-blue-300">the fast.</span></h1><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Strict commitments. Prayerful execution. Synced discipline across iPhone and desktop.</p></div><div className="relative z-10 mx-auto my-8 h-44 w-44 sm:h-56 sm:w-56"><div className="auth-orbit absolute inset-0 rounded-full" /><div className="auth-orbit auth-orbit-two absolute inset-5 rounded-full" /><div className="auth-core absolute inset-10 grid place-items-center rounded-full border"><Flame className="h-10 w-10 text-blue-100" /></div></div><div className="relative z-10 mx-auto grid max-w-2xl grid-cols-4 gap-3">{pillars.map(([label, caption, Icon]) => <div key={label} className="auth-pillar rounded-[24px] border px-2 py-3 text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full border text-blue-100"><Icon className="h-4 w-4" /></div><div className="mt-3 text-[0.64rem] font-semibold uppercase tracking-[.22em] text-slate-200">{label}</div><div className="mt-1 text-xs text-slate-500">{caption}</div></div>)}</div><Panel className="auth-panel relative z-10 mx-auto mt-7 w-full max-w-2xl p-4 sm:p-5"><div className="auth-toggle mb-5 grid grid-cols-2 rounded-full border p-1">{[["signin", "Sign in", User], ["signup", "Create account", Plus]].map(([value, label, Icon]) => <button type="button" key={value} onClick={() => setMode(value)} className={cn("min-h-12 rounded-full px-4 text-sm font-semibold transition duration-300", mode === value ? "is-active text-white" : "text-slate-400")}><span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span></button>)}</div>{!supabaseReady ? <div className="mb-4 rounded-[24px] border border-amber-300/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable real auth. Device-only mode still works.</div> : null}{mode === "signup" ? <label className="mb-4 block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Name</span><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label> : null}<label className="mb-4 block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Email address</span><Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="block"><span className="mb-2 block text-xs uppercase tracking-[.22em] text-slate-500">Password</span><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{error || message ? <div className="mt-4 rounded-[24px] border border-blue-300/20 bg-blue-500/10 p-4 text-sm text-blue-100">{error || message}</div> : null}<Button onClick={submit} disabled={loading || !supabaseReady} className="auth-primary mt-6 w-full bg-blue-600 text-white"><ArrowRight className="mr-3 h-5 w-5" />{mode === "signup" ? "Create Fasting Mode" : "Enter Fasting Mode"}</Button><div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-white/10" /><span className="text-[0.65rem] uppercase tracking-[.24em] text-slate-600">or</span><div className="h-px flex-1 bg-white/10" /></div><Button onClick={onLocal} className="auth-local w-full border border-white/10 bg-white/[.04] text-slate-300"><Smartphone className="mr-2 h-4 w-4" />Continue on this device</Button></Panel><div className="relative z-10 mt-5 text-center text-xs text-slate-500"><Lock className="mr-2 inline h-3.5 w-3.5 text-blue-200/70" />Your discipline. Your data. <span className="text-blue-200">Your command.</span></div></motion.section></main></Shell>;
}`, "auth-stage");

replaceExact(
  'return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#02040a]/94 px-[max(8px,env(safe-area-inset-left))] pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">{COMMAND_TABS.map(([id, label, Icon]) => <button type="button" key={id} onClick={() => onTab(id)} className={cn("flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] text-[0.68rem] font-semibold transition", active === id ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,.22)]" : "text-slate-500")}><Icon className="h-4 w-4" /><span>{label}</span></button>)}</div></nav>;',
  'return <nav className="ui-bottom-nav native-tabbar fixed inset-x-0 bottom-0 z-40 px-[max(10px,env(safe-area-inset-left))] pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl"><div className="native-tabbar-inner mx-auto grid max-w-3xl grid-cols-5 gap-1 rounded-full border p-1.5">{COMMAND_TABS.map(([id, label, Icon]) => <button type="button" key={id} onClick={() => onTab(id)} className={cn("ui-bottom-tab native-tab flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-full text-[0.68rem] font-semibold transition", active === id ? "is-active bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,.22)]" : "text-slate-500")}><Icon className="h-4 w-4" /><span>{label}</span></button>)}</div></nav>;',
  "BottomNav"
);

replaceExact('const colors = { safe: "border-blue-300/20 bg-blue-500/10 text-blue-100", caution: "border-sky-300/20 bg-sky-500/10 text-sky-100", danger: "border-amber-300/25 bg-amber-500/10 text-amber-100", critical: "border-red-300/30 bg-red-500/12 text-red-100" };', 'const colors = { safe: "ui-danger-safe", caution: "ui-danger-caution", danger: "ui-danger-danger", critical: "ui-danger-critical" };', "danger color map");
replaceExact('className={cn("rounded-[28px] border p-5", colors[danger.level])}', 'className={cn("ui-danger-meter rounded-[30px] border p-5", colors[danger.level])}', "DangerMeter shell");
replaceExact('className="mt-5 h-2 overflow-hidden rounded-full bg-black/30"', 'className="ui-progress-rail mt-5 h-2 overflow-hidden rounded-full"', "danger progress rail");
replaceExact('className="p-5 command-focus"', 'className="ui-command-card p-5 command-focus"', "NextActionCard surface");
replaceExact('className="border-blue-300/25 bg-blue-950/[.18] p-5 sm:p-6"', 'className="ui-commitment-panel fluid-commitment-panel p-5 sm:p-6"', "commitment panel");
replaceExact('className={cn("flex min-h-16 items-center justify-between rounded-2xl border p-4 text-left transition", checked ? "border-blue-300/25 bg-blue-500/15" : "border-white/10 bg-black/20")}', 'className={cn("ui-commitment-card flex min-h-16 items-center justify-between rounded-[24px] border p-4 text-left transition", checked ? "is-kept" : "is-open")}', "commitment card");
replaceExact('className="rounded-2xl border border-blue-300/20 bg-blue-500/[.08] p-4"', 'className="xp-task-editor rounded-[24px] border p-4"', "task editor");
replaceExact('className="rounded-2xl border border-white/10 bg-white/[.035] p-4"', 'className="xp-task-card rounded-[24px] border p-4"', "task card");
replaceExact('className="mt-6 rounded-[30px] border border-blue-300/15 bg-[#030712] p-5 text-center"', 'className="time-capsule mt-6 rounded-[32px] border p-5 text-center"', "time capsule");
replaceExact('className="min-h-12 rounded-2xl border border-white/10 bg-[#070b17] px-4 text-white outline-none"', 'className="ui-select min-h-12 rounded-[22px] border px-4 text-white outline-none"', "select controls");
replaceExact('className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-[#02040a]/74 p-4 backdrop-blur-md"', 'className="ui-modal-scrim pointer-events-none fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-md"', "day secured scrim");
replaceExact('className="rounded-[34px] border border-blue-300/20 bg-[#071022]/92 px-7 py-8 text-center"', 'className="ui-day-secured rounded-[34px] border px-7 py-8 text-center"', "day secured modal");
replaceExact('className="fixed inset-x-4 bottom-[calc(92px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-2xl border border-blue-300/20 bg-[#071022]/95 p-4 text-sm shadow-2xl backdrop-blur"', 'className="ui-toast fixed inset-x-4 bottom-[calc(92px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-[24px] border p-4 text-sm shadow-2xl backdrop-blur"', "toast surfaces");

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[visual-polish] applied fluid obsidian visual polish");
}

const finalApp = readFileSync(appPath, "utf8");
const required = ["ui-shell", "fluid-panel", "auth-stage", "auth-panel", "auth-orbit", "native-tabbar", "ui-command-card", "fluid-commitment-panel", "xp-task-card", "ui-day-secured"];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing visual marker: ${marker}`);
}
console.log("[visual-polish] visual checks passed");
