## Context

`today-page.tsx` places `RaidSchedule` above Today's Attempts. The multi-day plan is now Plan › Schedule (`move-raids-plan-to-plan-schedule`) with V1's day strip (`port-v1-daily-raids-plan-ui`); Dailies › Raids renders Today directly. Scope is limited to the four UserJot inputs from the 2026-09-30 triage; the earlier `DAILY-01`–`04`/`DAILY-07` feedback issues are out of scope.

## Goals / Non-Goals

**Goals:** Answer the four UserJot inputs listed in the proposal with a recorded decision each, and implement the accepted ones.

**Non-Goals:** Regroup or demote exhausted, locked, or satisfied-prerequisite information; recalculate the schedule; reorder goals/resources across priority; treat future simulated caps as real synced availability; merge Dailies tabs before the walkthrough says so.

## Decisions

- Use a live, populated Dailies walkthrough at a narrow and a wide (≥1440px) viewport. Capture the Today's Attempts wording as read by a new user, whether the farmed material is identifiable without hover, and how much of a wide viewport Today leaves empty.
- Keep the scheduling engine canonical; apply only display and copy changes.
- Treat the unified-today question as a navigation decision: if the walkthrough shows users bouncing between Raids and Shops for one session's actions, record it as a follow-up `dailies-navigation` change rather than widening this one.

## Risks / Trade-offs

- A wide-desktop multi-column layout touches the Today tutorial targets → update `today-page.tutorial.tsx` in the same change if the layout lands.
- Inline upgrade names add text to dense rows, especially on mobile → decide per platform rather than copying desktop.

## Open Questions

- Which of the four UserJot inputs (unified view, attempts wording, inline upgrade names, wide-desktop layout) become deltas here, and which become separate changes? Decide after the walkthrough and record on the UserJot threads.
