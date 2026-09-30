## Why

Several reports say users scroll past secondary, exhausted, or already-satisfied information before finding what to farm now (`DAILY-01`–`DAILY-04`, `DAILY-07`). A code read shows Today's schedule already precedes Today's Attempts and filters real exhausted nodes, so the current live behavior must be observed before changing information architecture.

Since the proposal was written, `move-raids-plan-to-plan-schedule` moved the multi-day plan to Plan › Schedule, so Dailies › Raids is now the Today page alone. Three UserJot threads (2026-09-30 triage: "Dailies", "Daily raids", "Today's raids layout issues") add concrete inputs that the walkthrough must answer rather than a separate change each.

## What Changes

- Walk Today (Dailies › Raids) and Plan › Schedule on mobile/desktop with actionable, exhausted, locked, and already-satisfied prerequisites; record where the first useful action appears and what “Max raids” means.
- Demote or group genuinely non-actionable information where the problem reproduces, while retaining explanations and preserving scheduling/priority semantics.
- Answer the UserJot inputs during the same walkthrough and fold accepted fixes into this change:
  - **One "what do I do today" view** — whether Raids and Shops (and Guild Raids) should read as one page or stay separate tabs; record the decision, do not restructure speculatively.
  - **"X attempts used" wording** on Today's Attempts — users read it as remaining; decide on copy that states used vs. remaining unambiguously.
  - **Upgrade names inline on Today** — the material a row farms is only visible on hover; decide whether the name (or a short form) shows inline on desktop and how on mobile.
  - **Wide-desktop empty space** — Today leaves the right side of wide monitors empty while requiring vertical scroll; decide on a multi-column or wider layout above a named breakpoint.

## Capabilities

### New Capabilities

- `dailies-action-hierarchy`: Visual hierarchy that makes current farming actions discoverable without losing explanatory context.

### Modified Capabilities

None until the walkthrough; existing daily-raid schedule and ordering contracts remain intact. If the inline-name or wide-layout decisions land, add `daily-raids-today` deltas via `/opsx:update` before applying.

## Impact

Apps Today presentation, Today's Attempts copy, Plan › Schedule where the same hierarchy applies, and tests; no API or scheduling-engine change intended. `add-daily-raids-availability-filter` has shipped; the Day-1 toggle it added is an input to the walkthrough, not a coordination point.
