---
name: vulnerabilities-scan
description: Check this repo's npm/pnpm dependency tree for known vulnerabilities via `pnpm audit`, and fix them with a routine within-range update first before reaching for a manual pin override. Use when asked to check this repo for dependency vulnerabilities, clear `pnpm audit` findings, or address this repo's GitHub security/dependabot page.
---

# Vulnerabilities scan (pnpm dependencies)

Scans this pnpm workspace's dependency tree (`apps/web`, `packages/ui`, and
the other workspace packages) for known CVEs, and fixes them with the
smallest safe change. Validated end-to-end: 14 open GitHub Dependabot
alerts, all closed by a routine within-range update with zero manual
overrides needed.

## Scan

```bash
pnpm audit
```

Optionally cross-check against GitHub's own alert feed — it and the local
scanner can each know about advisories the other doesn't yet, so treat the
union as the real list:

```bash
gh api repos/TacticusPlanner/tacticus-planner-apps/dependabot/alerts --paginate
```

## Why routine-update-first

Reaching straight for a manual `pnpm.overrides` pin on every flagged package
works, but it's the wrong first move: it pins a version by hand,
permanently, for problems a plain within-range update often fixes for free,
because most transitive vulnerabilities sit just past the top of an
already-allowed semver range. Overrides are for what's left after that, not
the default tool — this keeps the diff small and avoids stale pins nobody
remembers to remove.

## Process

1. **Scan first** (`pnpm audit`) to get the current, real list — don't
   assume a GitHub alert page is complete or current.
2. **Run a routine, within-range update before any manual pin:**
   ```bash
   pnpm update -r
   ```
   This also tends to close advisories on **direct** dependencies whose
   caret range already technically allows the patched version but never got
   re-resolved (e.g. `"react-router": "^8.1.0"` allows `8.3.0`, but the
   lockfile stays on `8.1.0` until something bumps it).
3. **Re-run `pnpm audit`** to see what's left.
4. **Fix whatever's still flagged**, per package:
   - **Transitive dependency, patch/minor bump within the same major**:
     force it with a targeted override pinned to the advisory's patched
     version (or the smallest safe version above it):
     ```yaml
     # pnpm-workspace.yaml
     overrides:
       <package>: ^<patched_version>
     ```
     Then `pnpm install` to regenerate the lockfile.
   - **Direct dependency needing a bump beyond its current allowed range**:
     bump the `package.json` specifier itself rather than overriding it.
   - **Fix requires a major-version bump**: do not apply silently. Flag it
     to the user with the advisory, the affected package, and what the
     major bump would touch — that's a judgment call about breaking
     changes, not a routine dependency fix.
5. **Verify nothing broke:**
   ```bash
   pnpm install && pnpm audit && pnpm typecheck && pnpm test:run
   ```
   Also spot-check `pnpm-lock.yaml` directly for a couple of the
   previously-flagged packages to confirm their resolved version clears the
   patched threshold — `pnpm audit` can lag a fresh install.
6. **Commit on a topic branch, not `main`** (this repo's convention — see
   root `AGENTS.md`). Do not push unless the user explicitly asks; creating
   the branch and committing locally is the deliverable of this skill.
7. **Report back**: which advisories closed and how (routine update vs.
   override vs. direct bump), before/after versions of touched packages,
   anything intentionally left open (major bumps) and why, and confirmation
   that install/typecheck/tests all passed.
