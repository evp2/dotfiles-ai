---
name: config-privacy
description: Scan Claude Code settings.json (user, project, local) for telemetry and tracing config that sends data off-machine, report what can be removed, and harden privacy. Backs the SessionStart privacy nudge; also runnable on demand as /config-privacy.
---

# config-privacy

Audit Claude Code settings against a known-good privacy baseline. Find telemetry and
tracing that ships data off the machine, report it, and remove it with the user's ok.

## When to use

- The SessionStart hook reported "Privacy: N telemetry/tracing setting(s) detected".
- The user runs /config-privacy, or asks to audit, harden, or strip telemetry from their Claude Code config.
- Before sharing a settings.json or onboarding a new machine.

## Known-good baseline

Telemetry and tracing that emit data off-machine (remove these):

| Setting | Leaks | Good state |
|---|---|---|
| `env.CLAUDE_CODE_ENABLE_TELEMETRY` | Turns on OpenTelemetry metrics + traces export | unset or `0` |
| `env.OTEL_*` | OTel exporter endpoint/headers/protocol shipping usage data to a collector | unset |
| `otelHeadersHelper` | Script injecting auth headers for OTel export | unset |
| `autoUploadSessions` | Mirrors local transcripts to claude.ai | unset or `false` |
| `feedbackSurveyRate` | Sampling probability for the in-product survey | `0` or unset |

Privacy off-switches that should be present (add these):

| Setting | Good state | Effect |
|---|---|---|
| `env.DISABLE_TELEMETRY` | `1` | Disables Statsig analytics |
| `env.DISABLE_ERROR_REPORTING` | `1` | Disables Sentry crash reporting |
| `env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | `1` | Umbrella: telemetry, error reporting, and autoupdate pings |
| `attribution.sessionUrl` | `false` | Keeps claude.ai session links out of commits and PRs |

## Steps

1. Run the scanner for a full report:

   ```
   node ~/.claude/skills/config-privacy/scan.mjs --report
   ```

   It reads `~/.claude/settings.json`, `./.claude/settings.json`, and
   `./.claude/settings.local.json`, lists any telemetry found (with the owning file),
   and lists hardening recommendations not yet set.

2. Summarize findings for the user: what is present that leaks, and which file holds it.

3. Propose exact edits. For removals, name the keys. For hardening, show the `env`
   block to add. Apply only after the user confirms.

4. When editing, change the file the setting actually lives in. Per-machine personal
   config is `~/.claude/settings.json`; team config is `./.claude/settings.json`.

## Rules

- Detect and report first. Never strip telemetry without confirmation; an `OTEL_*`
  block may be a deliberate org integration, not an accident.
- Never touch managed or policy settings (`managed-settings.json`). Those are admin
  controlled and out of scope.
- The scan only sees settings.json files. Telemetry forced through shell env vars
  (`export` in a shell profile) or managed policy will not appear; say so when relevant.
- No data leaves the machine during an audit. The scan is read-only and local.
