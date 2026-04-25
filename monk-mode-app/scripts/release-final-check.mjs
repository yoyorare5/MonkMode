import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = process.cwd();
const appPath = resolve(appRoot, "src", "App.jsx");
let app = readFileSync(appPath, "utf8");

function fail(message) {
  throw new Error(`[release-final-check] ${message}`);
}

if (app.includes("AlertTriangle") && !app.includes("  AlertTriangle,")) {
  app = app.replace("import {\n  ArrowRight,", "import {\n  AlertTriangle,\n  ArrowRight,");
  writeFileSync(appPath, app);
  console.log("[release-final-check] added AlertTriangle import for archive state");
}

const finalApp = readFileSync(appPath, "utf8");
const required = [
  ["AlertTriangle,", "archive state icon import missing"],
  ["applyPresetToState(next, \"dailyRule\")", "onboarding preset install is not atomic"],
  ["setStep((current) => Math.min(3, current + 1))", "onboarding Continue must use functional step navigation"],
  ["setStep((current) => Math.max(1, current - 1))", "onboarding Back must use functional step navigation"],
  ["window.scrollTo({ top: 0, behavior: \"smooth\" })", "onboarding step transition must reset scroll"],
  ["const deleteTodo =", "XP delete handler missing"],
  ["onDeleteTodo={deleteTodo}", "XP delete handler not wired"],
  ["Fast broken", "failed archive copy missing"],
  ["Fast completed", "completed archive copy missing"],
  ["Strict commitments", "strict commitment layer missing"],
  ["Layer 2", "XP layer framing missing"],
  ["Do this now", "next-action command missing"],
  ["Identity OS", "identity OS screen missing"],
  ["MODULE_DEFINITIONS", "life operating modules missing"],
  ["Orthodox watchfulness", "Orthodox fasting mode missing"],
  ["Hard monk mode day", "hard monk preset missing"],
  ["Distraction control", "distraction-control layer missing"],
  ["Discipline score", "discipline score progression missing"],
  ["ui-shell", "obsidian shell visual marker missing"],
  ["fluid-panel", "fluid panel visual marker missing"],
  ["auth-stage", "cinematic auth screen missing"],
  ["auth-panel", "spherical auth panel missing"],
  ["auth-orbit", "auth orbit visual system missing"],
  ["native-tabbar", "native bottom nav visual marker missing"],
  ["fluid-commitment-panel", "strict commitment visual hierarchy missing"],
  ["xp-task-card", "XP task visual polish missing"],
  ["command-hero-card", "mockup command hero missing"],
  ["command-time-orb", "mockup command timer missing"],
  ["command-metric-strip", "mockup command metrics missing"],
  ["command-score-strip", "mockup command score strip missing"],
  ["\"Command\", Target", "command tab label missing"],
  ["\"Execute\", Database", "execute tab label missing"],
  ["\"OS\", Sparkles", "OS tab label missing"],
  ["execute-screen", "execute mockup screen missing"],
  ["plan-screen", "plan mockup screen missing"],
  ["rewards-screen", "OS mockup screen missing"],
  ["settings-screen", "settings mockup screen missing"],
  ["System settings", "settings mockup title missing"],
  ["Lock tomorrow", "plan lock ritual missing"],
  ["local-device-guard", "local device auth fallback guard missing"],
  ["setSession(null); setLocalMode(true); setAuthMessage", "local fallback does not clear auth state"],
  ["setScreen((current) => (current === \"app\" ? current : \"auth\"))", "auth listener can still bounce local mode back to auth"],
];

for (const [needle, message] of required) {
  if (!finalApp.includes(needle)) fail(message);
}
if (finalApp.includes("onApplyRoutine")) fail("stale onboarding routine callback remains");

console.log("[release-final-check] final app checks passed");
