## Context

`today-page.tsx` already places `RaidSchedule` above Today's Attempts and filters real exhausted nodes from Today/Bonus. `RaidsPlanPage` starts with a multi-stat summary and models future days without real attempts-left. The reports may reflect a different deployed state, confusing “Max raids” copy, or specific data/layout cases.

## Goals / Non-Goals

**Goals:** Confirm the reported path, then improve visual hierarchy and wording where it fails.

**Non-Goals:** Recalculate schedule, reorder goals/resources across priority, or treat future simulated caps as real synced availability.

## Decisions

- First use a live, populated Dailies walkthrough at a narrow and a wide viewport, with real exhausted and locked nodes and an already-satisfied Unlock preceding Rank. Capture first-action position, labels, DOM order, and whether each item is actually actionable.
- Keep `RaidSchedule`/page UI ownership of grouping and disclosure; the scheduling engine remains canonical. Apply only confirmed display changes. Preserve accessible details even if visually demoted.
- Coordinate Day-1 control/copy with `add-daily-raids-availability-filter`; the toggle only hides real exhausted Day-1 nodes, not future-day projections.

## Risks / Trade-offs

- The current build may already satisfy part of the reports → record evidence and avoid unnecessary layout churn.
- Visually moving a group can imply a different priority → preserve within-group source order and label the secondary group clearly.

## Open Questions

- Which reported symptoms reproduce with current data, and on which breakpoint? The walkthrough is a required sizing gate. If no symptom reproduces, document that result rather than implement speculative changes.
