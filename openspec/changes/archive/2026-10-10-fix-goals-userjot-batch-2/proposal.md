## Why

Three UserJot reports against the V2 planner are small, frontend-only defects:

- "Rank Upgrade Slider Locked to One Level" (Bugs, Planned): on Library > Characters, moving either rank slider handle snaps the other one to exactly one rank away, so a range like Iron 1 → Bronze 1 can't be set.
- A comment on "Clarify Onslaught Tier and Sector Progression": the Onslaught source in an Ascension goal tells the user to set Onslaught progress even after they've saved it. The Edit goal dialog always reports "no saved progress".
- "Show Prerequisites for Restricted Goals" (merged into "Confusing and Inconsistent Restrictions"): the Restricted tooltip says only "Waiting on a prerequisite goal", without naming the goal or explaining what Restricted means.

## What Changes

- Character Lookup rank range: moving one side adjusts the other only when the range would otherwise become empty or inverted. A move that keeps start below end leaves the other side where it is, on both desktop (slider) and mobile (selects).
- Edit goal dialog: the Onslaught source group shows the same shards/day yield as goal creation, from the saved Onslaught progress and the character's current progression. It prompts for progress only when none is saved.
- Restricted tooltip: starts with a one-line explanation of Restricted, and names each unreached prerequisite goal by unit and goal kind. While a prerequisite's details are still loading, it falls back to the existing generic sentence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `character-lookup-range-controls`: a range edit that stays valid keeps the other side.
- `goal-acquisition-source-picker`: the Edit goal dialog shows the Onslaught yield from saved progress.
- `goal-blocker-reasons`: prerequisite reasons name the blocking goal, and the Restricted tooltip explains the state.

## Impact

`apps/web` only:

- `pages/library/ui/character/hooks/use-lookup-selection.ts`
- `pages/goals/model/goal-creation-form/onslaught-yield.ts` (new, extracted from `use-progression-preview.ts`)
- `pages/goals/model/goal-edit/use-goal-edit-acquisition.ts` and `ui/goal-edit/goal-edit-fields.tsx`
- `pages/goals/model/blockers/goal-blockers.ts`, `model/attainment/use-goals-overview-metrics.ts` and `ui/shared/status-badge.tsx`
- Two new i18n keys in en/de/es/fr

No API, storage or companion `tacticus-planner-api` change.
