## Why

The first Arena page (`add-dailies-arena-recommendations`, shipped in PR #114)
puts two near-identical cards on screen — **Active Project Team** and **Overall
Goals Team** routinely show the same characters — while giving the player no way
to steer which project drives the recommendation, no visibility into how
developed each suggested character is, a Random team that contradicts the XP/Power
mode, no way to keep a character across a re-roll, and a team-size switcher that
is duplicated as a `Tabs` control on desktop and a `Select` on mobile.

## What Changes

- **BREAKING (UI + view model):** Replace the **Active Project Team** and
  **Overall Goals Team** categories with a single **Plan Team** category. Its
  candidate priority is the player-selected project, widening to all active goals,
  then the full roster — the same expansion the Active Project Team already did,
  now with the project chosen explicitly rather than fixed to the active plan.
- Add a **project selector** to the Arena page, reusing the shared Dailies
  project selector (`DailiesOutletContext`), defaulting to the active plan then
  the default project. Changing it also changes the selected project for the
  other Dailies tabs in the session, as it already does between Raids sub-tabs.
- Drop the "no active project" and "no active goals" empty states for this
  category. The Plan Team is **never empty** for a player with at least three
  owned characters; it shows a note when it had to widen past the selected
  project.
- **BREAKING (view model):** Replace the per-category three/four/five-character
  variant switcher with **one page-level "Team size" control** (a radio group of
  `3` / `4` / `5`) next to the XP/Power toggle. It applies to both the Plan Team
  and the Random Team. A size the current pool cannot fill with eligible
  characters is offered disabled; the delivered team is clamped down and a note
  explains it.
- The **Random Team respects the XP/Power mode**: in XP Mode it is drawn only
  from characters that can still earn XP (topping up with XP-capped characters
  only when too few are eligible); in Power Mode it is drawn from the whole
  roster with the draw **weighted by combat power** (still random, biased toward
  stronger characters).
- Add a per-character **lock** control on the Random Team. Locked characters are
  kept in place across **Regenerate**; only the unlocked slots are re-rolled.
  Regenerate is disabled when every slot is locked. Locks are session-only (not
  persisted), consistent with the Random Team itself.
- **Team rows become a single column** and each row shows the character's
  **rarity and rank** alongside its name and why-chosen line.

## Capabilities

### New Capabilities

_None._ All behavior changes land in the existing capability below.

### Modified Capabilities

- `dailies-arena-recommendations`: the recommended-team category set (two
  categories, not three); the project basis (player-selected project, not the
  fixed active plan) and removal of the two "no basis" empty states; team size as
  a single page-level control instead of per-category 3/4/5 variants; XP/Power
  mode now also governing the Random Team's pool and draw weighting; a new
  Random-Team per-character lock that survives Regenerate; and per-character
  rarity/rank in the team presentation with a single-column layout at every
  viewport.

## Impact

- **Spec:** `openspec/specs/dailies-arena-recommendations/spec.md` (delta in this
  change).
- **Engine (`apps/web/src/fsd/pages/dailies/model/`):**
  `arena-recommendations.types.ts`, `arena-recommendations.ts`,
  `arena-eligibility.ts` (minor), `use-arena-recommendations.ts`, and their
  colocated tests. New `teamSize` persistence key
  (`tp.dailies.arena.teamSize`).
- **UI (`apps/web/src/fsd/pages/dailies/ui/arena/`):** new `arena-team-size.tsx`;
  delete `arena-variant-switcher.tsx`; rework `arena-team.tsx`,
  `arena-category-section.tsx`, `arena-page.tsx`, `desktop/arena-desktop.tsx`,
  `mobile/arena-mobile.tsx`, `arena-page.tutorial.tsx`, and colocated tests.
  Reuses `ProjectSelect` from `@/entities/project`, `RankBadge` / `RarityIcon`
  from `@/shared/ui`, and `RadioGroup` / `Field` from `@workspace/ui`.
- **i18n:** `apps/web/public/locales/{en,de,es,fr}/arena.json` — remove
  `category.active-project`, `category.overall-goals`, `empty.*`, `variant.*`;
  add `category.plan.*`, `teamSize.*`, `project.label`, `lock.*`, and two new
  tour steps. `arena-translations.test.ts` enforces key parity across all four
  locales; real de/es/fr copy stays tracked in issue #113.
- **No API change.** This is frontend-only; there is no companion
  `tacticus-planner-api` change.
- **Supersedes** parts of the archived `add-dailies-arena-recommendations`
  change; issue #111 (HSE Team category) and #112 (trait/alliance/damage-type
  controls) remain open follow-ups.
