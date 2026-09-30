## Context

`today-page.tsx` already places `RaidSchedule` above Today's Attempts and filters real exhausted nodes from Today/Bonus. The multi-day plan is now Plan › Schedule (`move-raids-plan-to-plan-schedule`) with V1's day strip (`port-v1-daily-raids-plan-ui`); Dailies › Raids renders Today directly. The reports may reflect an earlier deployed state, confusing “Max raids” / "attempts used" copy, or specific data/layout cases.

## Goals / Non-Goals

**Goals:** Confirm the reported path, then improve visual hierarchy and wording where it fails. Answer the four UserJot inputs listed in the proposal with a recorded decision each.

**Non-Goals:** Recalculate schedule, reorder goals/resources across priority, treat future simulated caps as real synced availability, or merge Dailies tabs before the walkthrough says so.

## Decisions

- First use a live, populated Dailies walkthrough at a narrow and a wide (≥1440px) viewport, with real exhausted and locked nodes and an already-satisfied Unlock preceding Rank. Capture first-action position, labels, DOM order, whether each item is actually actionable, the Today's Attempts wording as read by a new user, whether the farmed material is identifiable without hover, and how much of a wide viewport Today leaves empty.
- Keep `RaidSchedule`/page UI ownership of grouping and disclosure; the scheduling engine remains canonical. Apply only confirmed display changes. Preserve accessible details even if visually demoted.
- Treat the unified-today question as a navigation decision: if the walkthrough shows users bouncing between Raids and Shops for one session's actions, record it as a follow-up `dailies-navigation` change rather than widening this one.

## Risks / Trade-offs

- The current build may already satisfy part of the reports → record evidence and avoid unnecessary layout churn.
- Visually moving a group can imply a different priority → preserve within-group source order and label the secondary group clearly.
- A wide-desktop multi-column layout touches the Today tutorial targets → update `today-page.tutorial.tsx` in the same change if the layout lands.

## Open Questions

- Which reported symptoms reproduce with current data, and on which breakpoint? The walkthrough is a required sizing gate. If no symptom reproduces, document that result rather than implement speculative changes.
- Which of the four UserJot inputs (unified view, attempts wording, inline upgrade names, wide-desktop layout) become deltas here, and which become separate changes? Decide after the walkthrough and record on the UserJot threads.
