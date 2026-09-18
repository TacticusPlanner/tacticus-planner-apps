## Why

A player feedback report ("Rank Upgrade Goal Estimate Mismatch") flagged the Goals list's "Est." column as disagreeing with V1's "Done By" column for the same goal. Investigation found no computation bug — V2's figure is the priority-aware completion day count, which matches V1's "Done By" exactly; the mismatch was the reporter comparing it against V1's _other_, differently-defined column ("Total days," a count of days actually raided, which V2 has no equivalent of). The label "Est." doesn't communicate what the number actually is (a completion point, not a raw duration/count), which invites exactly this kind of cross-version comparison against the wrong metric. Renaming the column to "Done By" and showing the date inline (already computed, currently hidden in a hover-only tooltip) makes the figure self-explanatory without touching any estimate math.

## What Changes

- The Goals list column header (`goals.columns.estimate`, currently "Est.") is renamed to "Done By", on both the desktop table and the mobile card view (`EstimateCell` is shared between them).
- The cell itself changes from a single line ("12d") to two lines: a short formatted date on top (e.g. "Sep 28") led by a calendar icon, and an "in {{days}} days" caption below — matching V1's `doneByCol` presentation. Same two-line rendering on both desktop and mobile (no compact mobile variant).
- The already-computed `EstimateOutcome.date` (currently only exposed via a raw, unformatted `title` tooltip attribute) becomes the visible primary content of the cell; a new short-date formatting helper is added since none currently exists in this repo (V1 has `getEstimatedDateShort`, V2 doesn't).
- **Explicitly out of scope**: the goal-detail sheet's "Estimate" section (`goals.detail.estimateTitle` / `goals.create.previewEstimate`, "≈ {{days}} days") is untouched. That section sometimes shows an _isolated_ estimate (`estimateGoal`, ignoring priority contention with other goals — flagged there with an "Isolated estimate" badge), which can diverge from the true completion date the same way V1's own "Total days" diverges from "Done By." Calling that figure "Done By" would overstate its accuracy; only the goals-list column (which always uses the priority-aware `estimatePlan` result) is renamed.
- No estimate calculation changes. This is a label and presentation change only.

## Capabilities

### New Capabilities

- `goal-list-estimate-display`: how the Goals list (desktop table and mobile card) presents a goal's completion estimate — column label, and the date/day-count cell content. No existing capability covers this; `goals-navigation` is scoped to the shared header/toolbar, and `goal-farming-estimates` covers estimate _computation_ semantics (already documents the Day-1/N-1 completion-date math this change reads from, unchanged here), not how the result is displayed.

## Impact

- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-list.tsx` (`EstimateCell`, `GoalsTable`, `GoalsMobileCards`)
- `apps/web/src/fsd/pages/goals/model/insights/plan-insights-calc.ts` and `EstimateOutcome` (`goal-farming/model/estimate.domain.ts`) — read-only consumers, no shape change; `date` already exists
- A new small date-formatting helper (exact location decided in design.md)
- `apps/web/public/locales/{en,de,es,fr}/common.json` — `goals.columns.estimate` string, plus new keys for the date/caption cell content
