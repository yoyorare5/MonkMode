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
];

for (const [needle, message] of required) {
  if (!finalApp.includes(needle)) fail(message);
}
if (finalApp.includes("onApplyRoutine")) fail("stale onboarding routine callback remains");

console.log("[release-final-check] final app checks passed");
