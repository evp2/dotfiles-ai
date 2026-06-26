#!/usr/bin/env node
// Audits Claude Code settings for telemetry/tracing that sends data off-machine.
// No args: emits SessionStart hook JSON, but only when telemetry is present.
// --report: prints a full human-readable audit (findings + hardening recommendations).
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const files = [
  join(homedir(), ".claude", "settings.json"),
  join(process.cwd(), ".claude", "settings.json"),
  join(process.cwd(), ".claude", "settings.local.json"),
];

const truthy = (v) => v != null && !["0", "false", ""].includes(String(v).toLowerCase());

const load = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    // Missing or malformed file: skip it. A SessionStart hook must never throw.
    return null;
  }
};

// Settings that actively emit telemetry/tracing. Each returns finding string(s) or a falsy value.
const probes = [
  (s) => Object.keys(s.env ?? {}).filter((k) => /^OTEL_/.test(k)).map((k) => `env.${k} (OpenTelemetry export)`),
  (s) => truthy(s.env?.CLAUDE_CODE_ENABLE_TELEMETRY) && `env.CLAUDE_CODE_ENABLE_TELEMETRY=${s.env.CLAUDE_CODE_ENABLE_TELEMETRY}`,
  (s) => s.otelHeadersHelper != null && "otelHeadersHelper (OTel auth header injection)",
  (s) => s.autoUploadSessions === true && "autoUploadSessions=true (mirrors transcripts to claude.ai)",
  (s) => typeof s.feedbackSurveyRate === "number" && s.feedbackSurveyRate > 0 && `feedbackSurveyRate=${s.feedbackSurveyRate}`,
];

const loaded = files.map((path) => ({ path, s: load(path) })).filter((x) => x.s);

const findings = [];
for (const { path, s } of loaded) {
  for (const probe of probes) {
    const r = probe(s);
    for (const f of Array.isArray(r) ? r : r ? [r] : []) findings.push({ path, finding: f });
  }
}

const report = process.argv.includes("--report");

if (!report) {
  // Hook mode: stay silent unless active telemetry is present.
  if (findings.length === 0) process.exit(0);
  const list = findings.map((f) => f.finding).join("; ");
  const msg = `Privacy: ${findings.length} telemetry/tracing setting(s) detected: ${list}. Run /config-privacy to review and remove.`;
  process.stdout.write(JSON.stringify({
    systemMessage: msg,
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: msg },
  }));
  process.exit(0);
}

// Report mode: evaluate hardening against the merged effective config (user < project < local).
const eff = {};
const env = {};
for (const { s } of loaded) {
  Object.assign(env, s.env ?? {});
  Object.assign(eff, s);
}
eff.env = env;

const hardening = [
  !truthy(eff.env.DISABLE_TELEMETRY) && "env.DISABLE_TELEMETRY=1 (disables Statsig analytics)",
  !truthy(eff.env.DISABLE_ERROR_REPORTING) && "env.DISABLE_ERROR_REPORTING=1 (disables Sentry crash reports)",
  !truthy(eff.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) && "env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 (umbrella off-switch)",
  eff.attribution?.sessionUrl !== false && "attribution.sessionUrl=false (keeps session links out of commits and PRs)",
].filter(Boolean);

if (findings.length === 0) {
  console.log("Telemetry/tracing: none found in settings files. Nothing to remove.");
} else {
  console.log("Telemetry/tracing config found (candidates for removal):");
  for (const { path, finding } of findings) console.log(`  - ${finding}  [${path}]`);
}

if (hardening.length) {
  console.log("\nHardening recommendations (not currently set):");
  for (const h of hardening) console.log(`  - ${h}`);
}
