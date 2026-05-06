import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const app = readFileSync(resolve(root, "src", "FastingModeApp.jsx"), "utf8");
const css = [
  readFileSync(resolve(root, "src", "index.css"), "utf8"),
  readFileSync(resolve(root, "src", "routine-goals.css"), "utf8")
].join("\n");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");

function fail(message) {
  throw new Error(`[smoke-check] ${message}`);
}

const forbidden = [
  "@supabase/supabase-js",
  "createClient(",
  "supabase.auth",
  "supabase.from(",
  "auth-config-guard",
  "fluid-local-ui",
  "local-state-guard",
  "os-transformation-lite"
];

for (const marker of forbidden) {
  if (app.includes(marker) || pkg.includes(marker)) fail(`Forbidden marker remains: ${marker}`);
}

const requiredApp = [
  "STORAGE_KEY = \"fasting_mode_local_v3\"",
  "LEGACY_KEYS",
  "function AppShell",
  "function BottomNav",
  "const GlassCard",
  "const GradientButton",
  "function ProgressRing",
  "function ActionGroupCard",
  "function GoalCard",
  "function GoalProgressChart",
  "function HeatmapCalendar",
  "function FastBuilder",
  "function normalizeGoals",
  "function evaluateRuns",
  "Today",
  "Goals",
  "Analytics",
  "Settings",
  "16:8 Intermittent",
  "Today's Discipline Score",
  "Next Best Action",
  "Non-Negotiables",
  "Daily Routine",
  "Goal Steps",
  "Level System",
  "Set the target.",
  "Proverbs 16:3"
];

for (const marker of requiredApp) {
  if (!app.includes(marker)) fail(`Missing app marker: ${marker}`);
}

const requiredCss = [
  ".app-shell",
  ".glass-card",
  ".progress-ring-wrap",
  ".bottom-nav",
  ".goal-chart",
  ".heatmap",
  ".routine-card",
  ".level-card",
  ".builder-shell",
  "@media (prefers-reduced-motion: reduce)"
];

for (const marker of requiredCss) {
  if (!css.includes(marker)) fail(`Missing CSS marker: ${marker}`);
}

console.log("[smoke-check] premium discipline OS checks passed");
