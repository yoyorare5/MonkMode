import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appPath = resolve(process.cwd(), "src", "App.jsx");
let app = readFileSync(appPath, "utf8");
const original = app;

function fail(message) {
  throw new Error(`[auth-config-guard] ${message}`);
}

function replaceExact(before, after, label) {
  if (app.includes(after)) return;
  if (!app.includes(before)) fail(`Could not patch ${label}`);
  app = app.replace(before, after);
}

replaceExact(
  `const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);
const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;`,
  `const RAW_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_URL = normalizeSupabaseUrl(RAW_SUPABASE_URL);
const SUPABASE_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
const supabaseConfigIssue = getSupabaseConfigIssue(RAW_SUPABASE_URL, SUPABASE_URL, SUPABASE_KEY);
const supabaseReady = !supabaseConfigIssue;
const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;`,
  "Supabase config normalization",
);

const helperAnchor = 'const maskEmail = (email = "") => (email.includes("@") ? `${email.slice(0, 2)}***@${email.split("@")[1]}` : email);\n';
const helperBlock = `${helperAnchor}
function normalizeSupabaseUrl(value = "") {
  const raw = String(value || "").trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
  if (!raw) return "";
  const dashboardProject = raw.match(/project\/([a-z0-9]{20})/i);
  if (/supabase\.com/i.test(raw) && dashboardProject?.[1]) return \`https://\${dashboardProject[1]}.supabase.co\`;
  const candidate = /^https?:\/\//i.test(raw) ? raw : \`https://\${raw}\`;
  try {
    const url = new URL(candidate);
    if (url.hostname.toLowerCase() === "supabase.com" && dashboardProject?.[1]) return \`https://\${dashboardProject[1]}.supabase.co\`;
    return url.origin;
  } catch {
    return "";
  }
}

function isAllowedSupabaseHost(hostname = "") {
  const host = hostname.toLowerCase();
  return host.endsWith(".supabase.co") || host === "localhost" || host === "127.0.0.1";
}

function getSupabaseConfigIssue(rawUrl, normalizedUrl, key) {
  if (!String(rawUrl || "").trim() && !key) return "Real login needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.";
  if (!String(rawUrl || "").trim()) return "Missing VITE_SUPABASE_URL. Use the Project URL from Supabase API settings, like https://PROJECT_REF.supabase.co.";
  if (!normalizedUrl) return "VITE_SUPABASE_URL is not a valid URL. Use https://PROJECT_REF.supabase.co, not the dashboard page or an auth endpoint.";
  try {
    const host = new URL(normalizedUrl).hostname;
    if (!isAllowedSupabaseHost(host)) return "VITE_SUPABASE_URL must be the Supabase Project URL, like https://PROJECT_REF.supabase.co.";
  } catch {
    return "VITE_SUPABASE_URL is not a valid URL. Use https://PROJECT_REF.supabase.co.";
  }
  if (!key) return "Missing VITE_SUPABASE_ANON_KEY. Use the Supabase publishable key, not the secret service key.";
  if (!/^sb_publishable_|^eyJ/i.test(key)) return "VITE_SUPABASE_ANON_KEY should be the Supabase publishable key or legacy anon key.";
  return "";
}

function authFailureMessage(error) {
  const message = error?.message || String(error || "Auth failed.");
  if (/Invalid path specified/i.test(message)) return "Supabase rejected the auth URL. Set VITE_SUPABASE_URL to the Project URL only: https://PROJECT_REF.supabase.co. Do not use /auth/v1, /rest/v1, or the dashboard URL.";
  if (/Failed to fetch|NetworkError|fetch/i.test(message)) return "Could not reach Supabase. Check VITE_SUPABASE_URL and your network, then try again.";
  return message;
}
`;
if (!app.includes("function normalizeSupabaseUrl(")) {
  replaceExact(helperAnchor, helperBlock, "auth config helpers");
}

replaceExact(
  `  const submit = async () => {
    setError("");
    const result = mode === "signup" ? await onSignUp(form) : await onSignIn(form);
    if (result?.error) setError(result.error);
    if (result?.message) setError(result.message);
  };`,
  `  const submit = async () => {
    setError("");
    if (!supabaseReady) {
      setError(supabaseConfigIssue || "Real login is not connected yet.");
      return;
    }
    if (!form.email.trim() || !form.password.trim()) {
      setError("Enter your email and password.");
      return;
    }
    const result = mode === "signup" ? await onSignUp(form) : await onSignIn(form);
    if (result?.error) setError(result.error);
    if (result?.message) setError(result.message);
  };`,
  "auth submit validation",
);

replaceExact(
  `{!supabaseReady ? <div className="mb-4 rounded-[24px] border border-amber-300/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable real auth. Device-only mode still works.</div> : null}`,
  `{!supabaseReady ? <div className="mb-4 rounded-[24px] border border-amber-300/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100"><div className="font-semibold text-amber-50">Real login is not connected.</div><div className="mt-1">{supabaseConfigIssue}</div><div className="mt-2 text-amber-100/75">Use https://PROJECT_REF.supabase.co for VITE_SUPABASE_URL and the Supabase publishable key for VITE_SUPABASE_ANON_KEY.</div></div> : null}`,
  "auth config message",
);

replaceExact(
  `  const signIn = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : { ok: true };
  };`,
  `  const signIn = async ({ email, password }) => {
    if (!supabaseReady || !supabase) return { error: supabaseConfigIssue || "Real login is not connected yet." };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? { error: authFailureMessage(error) } : { ok: true };
    } catch (error) {
      return { error: authFailureMessage(error) };
    }
  };`,
  "safe sign in",
);

replaceExact(
  `  const signUp = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) return { error: error.message };
    if (!data.session) return { message: "Account created. Confirm your email if required, then sign in." };
    return { ok: true };
  };`,
  `  const signUp = async ({ name, email, password }) => {
    if (!supabaseReady || !supabase) return { error: supabaseConfigIssue || "Real login is not connected yet." };
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name } } });
      if (error) return { error: authFailureMessage(error) };
      if (!data.session) return { message: "Account created. Confirm your email if required, then sign in." };
      return { ok: true };
    } catch (error) {
      return { error: authFailureMessage(error) };
    }
  };`,
  "safe sign up",
);

if (app !== original) {
  writeFileSync(appPath, app);
  console.log("[auth-config-guard] patched Supabase auth config handling");
}

const finalApp = readFileSync(appPath, "utf8");
const required = [
  "RAW_SUPABASE_URL",
  "normalizeSupabaseUrl",
  "supabaseConfigIssue",
  "authFailureMessage",
  "Invalid path specified",
  "https://PROJECT_REF.supabase.co",
  "email: email.trim()",
];
for (const marker of required) {
  if (!finalApp.includes(marker)) fail(`Missing marker: ${marker}`);
}
console.log("[auth-config-guard] auth config checks passed");
