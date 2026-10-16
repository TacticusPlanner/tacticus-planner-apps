# Proposal

Apps-only change. Independent of the other four validation changes except that it edits a different set of requirements (no overlap with them).

## Why

Desktop validation of the Legendary Event pages on 2026-10-16 found five small UI defects that each fail an existing spec or a basic accessibility rule: selected filter chips are almost indistinguishable from unselected ones in the light theme (master table, tier list); the event page tour's Token plan step shows a tooltip cut off at the top of the viewport when the plan is long, although the spec says the step targets the Token plan header; the lane summary reads "2 / 18 battles" where V1's equivalent figure (defeat-all) reads 12 / 18, so the label hides that it counts fully cleared battles; Run status shows "60 currency" where V1's "3,770 / 5,250" is a cumulative figure, so users compare unlike numbers; and imported teams named after their lane ("alpha") read "Set how far alpha clears" and cannot be told apart by name.

## What Changes

- Selected chips get a thick primary border and tinted fill in both themes (master table, tier list, leaderboard controls), keeping the pressed state exposed.
- The Token plan tour step targets the Token plan header and keeps its tooltip inside the viewport for long plans.
- The lane summary reads "N / M battles fully cleared"; Run status reads "N currency in hand".
- A team whose stored name is empty or equals its lane id is shown by its covered objectives ("Max 2 hits · Melee") or "Team N" everywhere it is named, and the editor prefills that name when such a team is edited. Stored names are not rewritten by display.
- Not changed: the shared toggle-group component used by other pages (the fix is at the Legendary Event call sites), team editing flows, the "kill points per battle" lane overview label (a separate finding: the catalog value is the defeat-all score and disagrees with `defeatAll` for Uthar).

## Capabilities

### New Capabilities

- `legendary-event-filter-chips`: the visible selected state of the chips on the master table, tier list and leaderboard controls in both themes.

### Modified Capabilities

- `legendary-events-hub`: Run status labels the currency "in hand"; the Overview lane summary reads "fully cleared"; the event page tour keeps tooltips inside the viewport and targets the Token plan header.
- `legendary-event-teams`: a readable display name for teams named after their lane or unnamed, and the editor's prefill of it.

## Impact

- Code (`apps/web/src/fsd`): `pages/legendary-events/ui/master-table/master-table-controls.tsx`, `tier-list/tier-list-filters.tsx` and `legendary-event/leaderboard/leaderboard-controls.tsx` (chip styling through one shared class or small component), `pages/legendary-events/ui/legendary-event/legendary-event.tutorial.tsx` and the Token plan header (`data-testid`), `overview/lane-summary.tsx`, the Run status card, a new `entities/legendary-event/lib/team-display-name.ts` used by the team card, token plan groups and rows, the Next token card and prompts, upgrade-impact rows, run-history team lines and the editor prefill.
- Copy: `laneSummary.battles`, the run status currency line and the tour step in `public/locales/{en,de,es,fr}/legendaryEvents.json` (and the tour namespace).
- Tests: chip class tests, tour tooltip placement, lane summary, run status, display-name unit and component tests.
- No API, schema or catalog change.
