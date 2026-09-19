## Why

The Goals list rows are tall (roughly 170–450px per row) because each goal's Actual/Potential progress bars sit above always-visible, full-sentence explanations. Rows also overflow horizontally today: those explanation sentences don't fit their column's width, which — combined with the table's `overflow-x-auto` wrapper being unconstrained inside the page's flex layout — forces the whole page to scroll horizontally rather than just the table. Splitting Actual/Potential into two separate stacked bars, each captioned and explained inline, also makes a two-number comparison ("how much of this is real vs. potential") harder to read at a glance than a single bar with two overlaid fills would be. This change replaces the two-bar-plus-inline-text layout with a compact single stacked bar, a percent readout, and an on-demand info popover (desktop) / inline expand (mobile) for the explanation — cutting row height to a fixed 56px on desktop and giving mobile a dedicated card layout, while fixing the overflow regression as a side effect of removing the long always-visible text.

## What Changes

- **BREAKING** (spec-level, not API): Supersedes the `goal-progress-display` requirement that the Actual/Potential explanations are unconditionally visible inline — added by the `fix-goal-progress-consistency` change — with an on-demand disclosure: an info popover on desktop, an inline expand on mobile. See Impact for the sequencing note.
- Replace the two separate Progress/Potential-Progress `<Progress>` bars with one stacked bar component: a track, a striped "potential" fill, and a solid "actual" fill on top, clamped to 0–100 and degrading to actual-only when there's no potential ratio or it isn't above actual.
- Add a percent label next to the bar: the actual percentage, plus a small "↗ {{potential}}%" indicator when potential exceeds actual.
- Add a per-goal-kind "remaining" text formatter (Level: "N levels", Rank: "N slots · N energy", Unlock: "N shards") with thousands separators, replacing today's ad hoc `GoalRemainingSummary`/`GoalEnergyRemainingSummary` phrasing in the redesigned columns.
- Add an info popover, shown whenever a goal has both an Actual and a Potential ratio to show (Rank, Ability, and Ascension goals can all compute a Potential ratio today — see design.md's Non-Goals) triggered by an "i" button: two captioned lines (Actual/Potential) carrying the explanation text the current design shows inline. Single-open, portal-rendered, closes on outside click/Escape/opening the row menu, returns focus to the trigger on close.
- Add a legend ("Actual" / "Potential" swatches) rendered once per list (desktop column header; mobile list top) instead of per-row captions.
- Move the Unlock goal's "Gather the character's shards…" flavor text from a row caption to a tooltip on the character name.
- Rework the desktop table into fixed-width, static columns (Character, Goal, Progress, Remaining, Status · Done by, Actions) at a fixed 56px row height, all always visible at any desktop width — no responsive column hiding; switch to the mobile card layout only at the app's existing 768px `useIsMobile()` breakpoint, the same one every other page uses.
- Replace the mobile row rendering with a card layout: avatar/name/type-and-date caption header, a goal line, the shared stacked bar, and a footer line (remaining text + "i" affordance) that expands the explanation inline within the card on tap.

### Post-implementation review fixes

A live review round against the shipped feature surfaced four further changes, folded into this same change rather than filed separately since each is a direct refinement of behavior this change introduced:

- **Static columns, not responsive hiding.** The original design hid the Remaining column below a ~1200px table-width threshold (a container query). User feedback: it made the page feel like it was "jumping" as the table resized. Reverted — the Remaining column is now always visible at every desktop width; the remaining-text tooltip on the Progress column (added for the hidden-column case) stays as a second, always-available path to the same figure.
- **Percent no longer rounds up to a premature 100%.** `Math.round(0.996 * 100)` read as "100%" while a nonzero remaining-count figure ("2 shards") rendered right next to it. The percent readout now caps at 99% until the ratio has truly reached 1.
- **"Restricted" replaces a duplicate "Blocked" indicator for prerequisite-only blocks.** A goal blocked solely because a prerequisite goal in the plan hasn't reached its own target now shows a softer "Restricted" indicator instead of "Blocked" — and a second, redundant blocked-text rendering in the estimate cell (which happened to draw from the same underlying reasons in the project-scoped view) was removed as a duplicate of the one indicator.
- **A reachable-ceiling marker on Rank/Level bars.** A Rank or Level goal's own target scale can be capped, right now, by the character's current rarity and (for Rank) current level — independently, whichever is lower binds — before any further Ascension or leveling. The stacked bar now marks that ceiling's position when it falls short of the goal's target, alongside the existing "Restricted" indicator.

## Capabilities

### New Capabilities

- `goal-list-layout`: the Goals list's structural presentation — desktop table columns (widths, row height, a static column set visible at every desktop width, the 768px table→card switch) and the mobile card structure (header/goal-line/bar/footer, legend placement) — independent of how an individual goal's progress bar/percent/explanation renders, which is `goal-progress-display`'s concern. Mirrors the existing `goal-list-estimate-display` capability's scope (that capability's "Done By" column content is reused unchanged inside this change's "Status · Done by" column). (Post-implementation review fix 9.1 reverted an earlier 1200px Remaining-column hide back to always-visible — see "Post-implementation review fixes" above.)

### Modified Capabilities

- `goal-progress-display`: replaces the two-bar layout and always-visible inline explanation text (added by `fix-goal-progress-consistency`, not yet archived — see Impact) with one stacked bar, a percent readout, and an on-demand popover/inline-expand explanation; adds the per-goal-kind remaining-text formatter; adds the percent-rounding cap and the Rank/Level reachable-ceiling marker (post-implementation review fixes above).
- `goal-blocker-reasons`: adds the "Restricted" presentation for a block caused solely by an unreached prerequisite, distinguishing it from "Blocked" (post-implementation review fixes above).

## Impact

- `apps/web/src/fsd/pages/goals/ui/shared/goal-visuals.tsx` (`GoalProgressDisplay`) — replaced by the new stacked-bar + percent + popover component; `GoalRemainingSummary`/`GoalEnergyRemainingSummary` replaced by the new per-kind remaining-text formatter.
- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-list.tsx` — desktop table column rework and new mobile card layout.
- `apps/web/src/fsd/pages/goals/ui/goal-detail/goal-detail-view.tsx` and `goal-detail-sheet.tsx` — consume the redesigned `GoalProgressDisplay`; the detail sheet's own "Estimate" section is unaffected (different, sometimes-isolated figure per `goal-list-estimate-display`'s existing note).
- `apps/web/public/locales/{en,de,es,fr}/common.json` — new/changed keys for the percent-indicator label, remaining-text formatters, popover copy, legend labels, and the Unlock tooltip; the `goals.overview.actualProgressDescription`/`potentialProgressDescription` keys added by `fix-goal-progress-consistency` move into the popover's copy (reworded if needed for the two-line format) rather than being read inline.
- **Sequencing with `fix-goal-progress-consistency`**: that change is implemented but not yet archived, so `goal-progress-display` does not yet exist under `openspec/specs/`. This change's delta spec is written as a modification of the requirements `fix-goal-progress-consistency`'s own delta defines. Apply `fix-goal-progress-consistency` and archive it (`openspec archive`, which syncs its delta into `openspec/specs/goal-progress-display/spec.md`) before archiving this change, so this change's delta resolves against a real base spec instead of another in-flight change's delta.
- No companion `tacticus-planner-api` change — this is a client-only presentation/interaction change over already-available data (`computeGoalProgress`, `computePotentialProgressRatio`, `calculateGoalResourceNeed`), none of which this change alters.
