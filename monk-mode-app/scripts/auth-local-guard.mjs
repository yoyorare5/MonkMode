import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[auth-local-guard] ${message}`);
}

if (!app.includes("local-device-guard")) {
  app = app.replace(
    /<Button onClick=\{onLocal\} className="([^"]*)">([\s\S]*?Continue on this device[\s\S]*?)<\/Button>/,
    '<Button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onLocal(); }} className="local-device-guard $1">$2</Button>',
  );
}

const localCallback = 'onLocal={() => { setLocalMode(true); setScreen("app"); }}';
const guardedCallback = 'onLocal={() => { setSession(null); setLocalMode(true); setAuthMessage(""); setScreen("app"); }}';
if (app.includes(localCallback)) app = app.replace(localCallback, guardedCallback);

const authListener = '      } else {\n        setScreen("auth");\n      }';
const guardedListener = '      } else {\n        setScreen((current) => (current === "app" ? current : "auth"));\n      }';
if (app.includes(authListener)) app = app.replace(authListener, guardedListener);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[auth-local-guard] patched local device auth fallback");
}

const finalApp = readFileSync(appPath, "utf8");
const required = [
  "local-device-guard",
  "setSession(null); setLocalMode(true); setAuthMessage",
  "setScreen((current) => (current === \"app\" ? current : \"auth\"))",
];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
console.log("[auth-local-guard] local device fallback checks passed");
