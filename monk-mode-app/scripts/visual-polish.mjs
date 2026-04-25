import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[visual-polish] ${message}`);
}

function replaceExact(before, after, label) {
  if (app.includes(before)) {
    app = app.split(before).join(after);
    return;
  }
  if (app.includes(after)) return;
  fail(`Could not patch ${label}`);
}

replaceExact(
  'const pageMotion = { initial: { opacity: 0, y: 10, filter: "blur(4px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -8, filter: "blur(4px)" }, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } };',
  'const pageMotion = { initial: { opacity: 0, y: 14, filter: "blur(8px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -10, filter: "blur(6px)" }, transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] } };',
  "page motion"
);
replaceExact(
  'const cardMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } };',
  'const cardMotion = { initial: { opacity: 0, y: 14, filter: "blur(6px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } };',
  "card motion"
);

replaceExact(
  'const Button = ({ className = "", children, ...props }) => <button type="button" className={cn("inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50", className)} {...props}>{children}</button>;',
  'const Button = ({ className = "", children, ...props }) => <button type="button" className={cn("ui-button inline-flex min-h-11 items-center justify-center rounded-[8px] px-4 py-2 text-sm font-semibold transition-[transform,background,border-color,color,box-shadow] duration-200 ease-out active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45", className)} {...props}>{children}</button>;',
  "Button primitive"
);
replaceExact(
  'const Panel = ({ className = "", children, motionProps = {} }) => <motion.div {...cardMotion} {...motionProps} className={cn("rounded-[28px] border border-blue-400/15 bg-white/[0.055] shadow-[0_18px_80px_rgba(0,0,0,.38)] backdrop-blur-xl", className)}>{children}</motion.div>;',
  'const Panel = ({ className = "", children, motionProps = {} }) => <motion.div {...cardMotion} {...motionProps} className={cn("ui-panel rounded-[8px] border backdrop-blur-2xl", className)}>{children}</motion.div>;',
  "Panel primitive"
);
replaceExact(
  'const Badge = ({ className = "", children }) => <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", className)}>{children}</span>;',
  'const Badge = ({ className = "", children }) => <span className={cn("ui-badge inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", className)}>{children}</span>;',
  "Badge primitive"
);
replaceExact(
  'const Input = (props) => <input className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/40" {...props} />;',
  'const Input = (props) => <input className="ui-input min-h-12 w-full rounded-[8px] border px-4 text-white outline-none placeholder:text-slate-600" {...props} />;',
  "Input primitive"
);
replaceExact(
  'const Textarea = ({ className = "", ...props }) => <textarea className={cn("min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/40", className)} {...props} />;',
  'const Textarea = ({ className = "", ...props }) => <textarea className={cn("ui-input min-h-28 w-full resize-none rounded-[8px] border px-4 py-3 text-white outline-none placeholder:text-slate-600", className)} {...props} />;',
  "Textarea primitive"
);

replaceExact(
  'return <div className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(37,99,235,.22),transparent_34%),linear-gradient(to_bottom,#02040a,#050916_46%,#02040a)]" /><div className="relative min-h-dvh px-[max(14px,env(safe-area-inset-left))] pb-[max(14px,env(safe-area-inset-bottom))] pt-[max(10px,env(safe-area-inset-top))]">{children}</div></div>;',
  'return <div className="ui-shell relative min-h-dvh overflow-hidden text-white"><div className="ui-shell-glow pointer-events-none fixed inset-0" /><div className="relative min-h-dvh px-[max(14px,env(safe-area-inset-left))] pb-[max(14px,env(safe-area-inset-bottom))] pt-[max(10px,env(safe-area-inset-top))]">{children}</div></div>;',
  "Shell background"
);
replaceExact(
  'return <div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-blue-300/20 bg-blue-500/10 text-blue-200"><Flame className="h-5 w-5" /></div><div className="min-w-0"><div className="truncate text-sm font-semibold uppercase tracking-[.22em] text-blue-200">Fasting Mode</div><div className="truncate text-xs text-slate-500">Command system</div></div></div>;',
  'return <div className="flex min-w-0 items-center gap-3"><div className="ui-brand-mark grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border text-blue-100"><Flame className="h-5 w-5" /></div><div className="min-w-0"><div className="truncate text-sm font-semibold uppercase tracking-[.18em] text-blue-100">Fasting Mode</div><div className="truncate text-xs text-slate-500">Command system</div></div></div>;',
  "Brand mark"
);
replaceExact(
  'return <div className="sticky top-0 z-30 -mx-2 mb-4 border-b border-white/10 bg-[#02040a]/82 px-2 py-3 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Brand /><div className="flex shrink-0 items-center gap-2">{user ? <Badge className="hidden border border-white/10 bg-white/[.04] text-slate-300 sm:inline-flex"><Icon className="mr-2 h-3.5 w-3.5" />{sync.label}</Badge> : null}<button type="button" onClick={onSound} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300">{ui.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>{user ? <button type="button" onClick={() => onTab("settings")} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.045] text-slate-300"><Settings className="h-4 w-4" /></button> : null}</div></div></div>;',
  'return <div className="ui-topbar sticky top-0 z-30 -mx-2 mb-5 border-b px-2 py-3 backdrop-blur-2xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Brand /><div className="flex shrink-0 items-center gap-2">{user ? <Badge className="hidden border border-white/10 bg-white/[.04] text-slate-300 sm:inline-flex"><Icon className="mr-2 h-3.5 w-3.5" />{sync.label}</Badge> : null}<button type="button" onClick={onSound} className="ui-icon-button grid h-11 w-11 place-items-center rounded-[8px] border text-slate-300">{ui.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>{user ? <button type="button" onClick={() => onTab("settings")} className="ui-icon-button grid h-11 w-11 place-items-center rounded-[8px] border text-slate-300"><Settings className="h-4 w-4" /></button> : null}</div></div></div>;',
  "TopBar"
);
replaceExact(
  'return <div className="flex items-start gap-3"><div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-3 text-blue-200"><Icon className="h-5 w-5" /></div><div className="min-w-0"><h2 className="text-lg font-semibold leading-tight">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}</div></div>;',
  'return <div className="flex items-start gap-3"><div className="ui-section-icon rounded-[8px] border p-3"><Icon className="h-5 w-5" /></div><div className="min-w-0"><h2 className="text-lg font-semibold leading-tight text-slate-100">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}</div></div>;',
  "SectionTitle"
);
replaceExact(
  'return <div className="mb-5"><div className="text-[0.68rem] font-semibold uppercase tracking-[.28em] text-blue-200/75">{eyebrow}</div><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{body ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{body}</p> : null}</div>;',
  'return <div className="mb-6"><div className="text-[0.68rem] font-semibold uppercase tracking-[.22em] text-blue-200/70">{eyebrow}</div><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">{title}</h1>{body ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{body}</p> : null}</div>;',
  "ScreenHeader"
);
replaceExact(
  'return <div className={cn("min-w-0 rounded-2xl border p-3", tone === "danger" ? "border-red-400/20 bg-red-500/10" : "border-white/10 bg-white/[.035]")}><div className="truncate text-[0.68rem] uppercase tracking-[.12em] text-slate-500">{label}</div><div className="mt-2 min-w-0 truncate text-2xl font-semibold">{value}</div></div>;',
  'return <div className={cn("ui-stat min-w-0 rounded-[8px] border p-3", tone === "danger" ? "is-danger" : "is-default")}><div className="truncate text-[0.68rem] uppercase tracking-[.12em] text-slate-500">{label}</div><div className="mt-2 min-w-0 truncate text-2xl font-semibold">{value}</div></div>;',
  "StatCard"
);
replaceExact(
  'return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#02040a]/94 px-[max(8px,env(safe-area-inset-left))] pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">{COMMAND_TABS.map(([id, label, Icon]) => <button type="button" key={id} onClick={() => onTab(id)} className={cn("flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] text-[0.68rem] font-semibold transition", active === id ? "bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,.22)]" : "text-slate-500")}><Icon className="h-4 w-4" /><span>{label}</span></button>)}</div></nav>;',
  'return <nav className="ui-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t px-[max(8px,env(safe-area-inset-left))] pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl"><div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">{COMMAND_TABS.map(([id, label, Icon]) => <button type="button" key={id} onClick={() => onTab(id)} className={cn("ui-bottom-tab flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[8px] text-[0.68rem] font-semibold transition", active === id ? "is-active bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,.22)]" : "text-slate-500")}><Icon className="h-4 w-4" /><span>{label}</span></button>)}</div></nav>;',
  "BottomNav"
);

replaceExact(
  'const colors = { safe: "border-blue-300/20 bg-blue-500/10 text-blue-100", caution: "border-sky-300/20 bg-sky-500/10 text-sky-100", danger: "border-amber-300/25 bg-amber-500/10 text-amber-100", critical: "border-red-300/30 bg-red-500/12 text-red-100" };',
  'const colors = { safe: "ui-danger-safe", caution: "ui-danger-caution", danger: "ui-danger-danger", critical: "ui-danger-critical" };',
  "danger color map"
);
replaceExact(
  'className={cn("rounded-[28px] border p-5", colors[danger.level])}',
  'className={cn("ui-danger-meter rounded-[8px] border p-5", colors[danger.level])}',
  "DangerMeter shell"
);
replaceExact('className="mt-5 h-2 overflow-hidden rounded-full bg-black/30"', 'className="ui-progress-rail mt-5 h-2 overflow-hidden rounded-full"', "danger progress rail");
replaceExact('className="p-5 command-focus"', 'className="ui-command-card p-5 command-focus"', "NextActionCard surface");
replaceExact('className="border-blue-300/25 bg-blue-950/[.18] p-5 sm:p-6"', 'className="ui-commitment-panel p-5 sm:p-6"', "commitment panel");
replaceExact(
  'className={cn("flex min-h-16 items-center justify-between rounded-2xl border p-4 text-left transition", checked ? "border-blue-300/25 bg-blue-500/15" : "border-white/10 bg-black/20")}',
  'className={cn("ui-commitment-card flex min-h-16 items-center justify-between rounded-[8px] border p-4 text-left transition", checked ? "is-kept" : "is-open")}',
  "commitment card"
);
replaceExact('className="rounded-2xl border border-blue-300/20 bg-blue-500/[.08] p-4"', 'className="xp-task-editor rounded-[8px] border p-4"', "task editor");
replaceExact('className="rounded-2xl border border-white/10 bg-white/[.035] p-4"', 'className="xp-task-card rounded-[8px] border p-4"', "task card");
replaceExact('className="mt-6 rounded-[30px] border border-blue-300/15 bg-[#030712] p-5 text-center"', 'className="time-capsule mt-6 rounded-[8px] border p-5 text-center"', "time capsule");
replaceExact('className="min-h-12 rounded-2xl border border-white/10 bg-[#070b17] px-4 text-white outline-none"', 'className="ui-select min-h-12 rounded-[8px] border px-4 text-white outline-none"', "select controls");
replaceExact('className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-[#02040a]/74 p-4 backdrop-blur-md"', 'className="ui-modal-scrim pointer-events-none fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-md"', "day secured scrim");
replaceExact('className="rounded-[34px] border border-blue-300/20 bg-[#071022]/92 px-7 py-8 text-center"', 'className="ui-day-secured rounded-[8px] border px-7 py-8 text-center"', "day secured modal");
replaceExact('className="fixed inset-x-4 bottom-[calc(92px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-2xl border border-blue-300/20 bg-[#071022]/95 p-4 text-sm shadow-2xl backdrop-blur"', 'className="ui-toast fixed inset-x-4 bottom-[calc(92px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-[8px] border p-4 text-sm shadow-2xl backdrop-blur"', "toast surfaces");

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[visual-polish] applied obsidian visual polish");
}

const finalApp = readFileSync(appPath, "utf8");
const required = ["ui-shell", "ui-panel", "ui-bottom-nav", "ui-command-card", "ui-commitment-panel", "xp-task-card", "ui-day-secured"];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing visual marker: ${marker}`);
}
console.log("[visual-polish] visual checks passed");
