import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[device-session-migration-guard] ${message}`);
}

function replaceExact(before, after, label) {
  if (app.includes(after)) return;
  if (!app.includes(before)) fail(`Could not patch ${label}`);
  app = app.replace(before, after);
}

replaceExact(
  `function readDeviceSession() {
  try {
    return localStorage.getItem(DEVICE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}`,
  `function readDeviceSession() {
  try {
    const stored = localStorage.getItem(DEVICE_SESSION_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
    if (localStorage.getItem(STORAGE_KEY)) return true;
    return LEGACY_KEYS.some((key) => Boolean(localStorage.getItem(key)));
  } catch {
    return false;
  }
}`,
  "device session migration",
);

replaceExact(
  '    else localStorage.removeItem(DEVICE_SESSION_KEY);',
  '    else localStorage.setItem(DEVICE_SESSION_KEY, "0");',
  "explicit local signout marker",
);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[device-session-migration-guard] patched device session migration");
}

const finalApp = readFileSync(appPath, "utf8");
const required = [
  'stored === "0"',
  "LEGACY_KEYS.some",
  'localStorage.setItem(DEVICE_SESSION_KEY, "0")',
];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
console.log("[device-session-migration-guard] device session checks passed");
