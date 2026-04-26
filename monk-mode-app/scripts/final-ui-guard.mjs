import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[final-ui-guard] ${message}`);
}

const oldRank = 'const rank = rewards.totalXp >= 2500 ? "Consecrated" : rewards.streakDays >= 3 ? "Steadfast" : "Unstoppable";';
const rankBlock = 'const rankSteps = [[0, "Initiate"], [250, "Novice"], [750, "Disciple"], [1500, "Watchman"], [2500, "Steadfast"], [4000, "Vanguard"], [6500, "Consecrated"], [10000, "Elder"]];\n  const rank = rankSteps.filter(([xp]) => (rewards.totalXp || 0) >= xp).at(-1)?.[1] || "Initiate";';
app = app.split(oldRank).join(rankBlock);

const presetLine = 'const preset = presetById(plan.presetId || state.prep.activePreset);\n  const checklist = state.prep.checklists[tomorrow] || makeChecklist(preset.id);';
const presetBlock = 'const preset = presetById(plan.presetId || state.prep.activePreset);\n  const presetShort = preset.title === "Hard monk mode day" ? "Monk" : preset.title.split(" ")[0];\n  const checklist = state.prep.checklists[tomorrow] || makeChecklist(preset.id);';
if (app.includes(presetLine)) app = app.replace(presetLine, presetBlock);
app = app.split('<StatCard label="Preset" value={preset.title} />').join('<StatCard label="Preset" value={presetShort || preset.title} />');
app = app.split('value={state.runs.activeRun ? "Active" : "None"}').join('value={state.runs.activeRun ? "On" : "None"}');

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[final-ui-guard] patched final iPhone text fit and ranks");
}

const finalApp = readFileSync(appPath, "utf8");
const required = ["rankSteps", "Initiate", "Watchman", "presetShort", 'value={state.runs.activeRun ? "On" : "None"}'];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
if (finalApp.includes('"Unstoppable"')) fail('old placeholder rank remains');
console.log("[final-ui-guard] final UI checks passed");
