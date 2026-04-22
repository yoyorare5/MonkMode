import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[mobile-onboarding-guard] ${message}`);
}

function replaceExact(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) fail(`Could not patch ${label}`);
  return source.replace(before, after);
}

app = replaceExact(
  app,
  `  const canCreate = mission.trim().length >= 12 && rules.every((rule) => rule.trim().length >= 3);
  const create = () => {`,
  `  const canCreate = mission.trim().length >= 12 && rules.every((rule) => rule.trim().length >= 3);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, [step]);
  const create = () => {`,
  "onboarding step scroll reset"
);

app = replaceExact(
  app,
  `<Button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}`,
  `<Button onPointerDown={(event) => event.currentTarget.blur()} onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}`,
  "onboarding back button"
);

app = replaceExact(
  app,
  `<Button onClick={() => setStep(step + 1)} className="flex-[1.4] bg-blue-600 text-white">Continue</Button>`,
  `<Button onPointerDown={(event) => event.currentTarget.blur()} onClick={() => setStep((current) => Math.min(3, current + 1))} className="flex-[1.4] bg-blue-600 text-white">Continue</Button>`,
  "onboarding continue button"
);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[mobile-onboarding-guard] patched iPhone onboarding navigation");
}

const finalApp = readFileSync(appPath, "utf8");
if (!finalApp.includes("setStep((current) => Math.min(3, current + 1))")) fail("Continue does not use functional step navigation");
if (!finalApp.includes("setStep((current) => Math.max(1, current - 1))")) fail("Back does not use functional step navigation");
if (!finalApp.includes("window.scrollTo({ top: 0, behavior: \"smooth\" })")) fail("Step transition scroll reset missing");

console.log("[mobile-onboarding-guard] mobile onboarding checks passed");
