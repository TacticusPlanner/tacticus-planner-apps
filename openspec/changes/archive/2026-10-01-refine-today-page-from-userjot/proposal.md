## Why

Three UserJot threads (2026-09-30 triage: "Dailies", "Daily raids", "Today's raids layout issues") raise concrete problems with the Today page. A live walkthrough must answer each one and record a decision rather than opening a separate change per thread.

Since the proposal was first written, `move-raids-plan-to-plan-schedule` moved the multi-day plan to Plan › Schedule, so Dailies › Raids is now the Today page alone. The earlier feedback issues (`DAILY-01`–`DAILY-04`, `DAILY-07`: action ordering, exhausted/locked nodes, "Max raids", satisfied-Unlock detail) are no longer in scope for this change.

## What Changes

- Walk Today (Dailies › Raids) at narrow, ordinary desktop, and wide (≥1440px) viewports and record a decision for each UserJot input; fold accepted fixes into this change:
  - **One "what do I do today" view** — whether Raids and Shops (and Guild Raids) should read as one page or stay separate tabs; record the decision, do not restructure speculatively.
  - **"X attempts used" wording** on Today's Attempts — users read it as remaining; decide on copy that states used vs. remaining unambiguously.
  - **Upgrade names inline on Today** — the material a row farms is only visible on hover; decide whether the name (or a short form) shows inline on desktop and how on mobile.
  - **Wide-desktop empty space** — Today leaves the right side of wide monitors empty while requiring vertical scroll; decide on a multi-column or wider layout above a named breakpoint.

## Capabilities

### New Capabilities

- `dailies-action-hierarchy`: Unambiguous used/remaining wording for Today's Attempts. (The name is a leftover from the wider original scope.)

### Modified Capabilities

None until the walkthrough. If the inline-name or wide-layout decisions land, add `daily-raids-today` deltas via `/opsx:update` before applying.

## Impact

Apps Today presentation, Today's Attempts copy, and tests; no API or scheduling-engine change intended.
