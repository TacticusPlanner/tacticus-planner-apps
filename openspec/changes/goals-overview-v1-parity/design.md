## Context

See `proposal.md` - Why. Relevant shape, confirmed by reading the code:

- `GoalsList` switches between `GoalsTable` and `GoalsMobileCards` and is
  shared by the Goals page and Project Detail; both also share
  `StatusFilterSelect`. Every list change lands on both pages.
- `GoalsPage` already computes `reachedByGoalId` (from synced progression, not
  the goal's stored `status`) and passes it to `GoalsList`, where it currently
  only gates the Archive menu item. Reached goals are already returned by the
  "Reached" filter; today they render like any row with an Active/Paused badge.
- `GoalRowActions` renders the pause/resume icon for Active/Paused rows on
  Overview and Project Detail alike; nothing about Overview lacks it.
- `formatGoalRemainingText` is the single producer of the Remaining prose
  ("N slots · N energy", "N levels · N XP"), reused by the Remaining cell, the
  Progress percent tooltip, the Unlock name tooltip, and the mobile card
  footer.
- `ResourceNeed` (`features/goal-farming/lib/progression-cost-calc.ts`) carries
  upgrades, shards, mythic shards, orbs by rarity and rank slots, and nothing
  for gold, badges, forge badges or components. `abilityResourceNeed` handles
  Machine of War Ability goals only and reads upgrade recipes; for a Character
  it returns `null`.
- The `mow-upgrade-costs` catalog dataset already carries per-level `gold`,
  `badges`, `forgeBadges` and `components` but is not summed into a goal need.
  There is no character ability cost dataset in V2; V1 sums
  `abilitiesLvlUp` via `CharactersAbilitiesService.getTotals` (gold, badges by
  rarity from level bands).
- V1's chip vocabulary (`resource-items.tsx`): ability badge, forge badge,
  MoW component, orb, coin, each `have/required` after inventory adjustment or
  `xN` before it.

## Goals / Non-Goals

**Goals:**

- One chip renderer used by desktop and mobile, driven by data on the goal's
  resource need rather than parsed from strings.
- Reached is a display state derived from the existing `reachedByGoalId`; no
  status write, no new API.
- Character Ability costs computed from a catalog dataset that matches V1's
  table exactly.

**Non-Goals:**

- No change to priority ordering, reordering, pause cascade, or estimate math.
- No separate Energy or Gold columns (V1 has them); gold and energy live in
  the Remaining chips.
- No change to Project Detail beyond what the shared list implies.
- No per-chip `have/required` breakdown beyond what the need calculation
  already nets against inventory (see Decision 3).

## Decisions

1. **Reached is a row-level display mode, applied inside `GoalsTable` and
   `GoalsMobileCards`.** A small helper in `goal-row-utils.ts` decides
   `isReachedRow(row, reachedByGoalId)`; the table row/card then swaps the
   status badge for a "Reached" variant, applies the green tint, replaces the
   Progress, Remaining and estimate content with a shared "-" cell, and omits
   pause/resume. _Alternative:_ a separate `ReachedGoalRow` component - more
   files for what is a handful of conditionals on the same row; rejected.
   Reuse the existing `StatusBadge` with a `reached` prop so the stored-status
   variants stay untouched.

2. **Green tint via a theme token, not raw colors.** Add/reuse a semantic
   "success" surface token pair so both themes pass the existing
   `goal-contrast-audit` test; extend that audit to cover the reached row.
   _Alternative:_ Tailwind `bg-green-*` literals; rejected because the audit
   checks token contrast and literals bypass it.

3. **Chips come from data, not from strings.** Extend `ResourceNeed` with one
   optional `abilityMaterials` field (`gold`, `badgesByRarity`,
   `forgeBadgesByRarity`, `components`) instead of new required top-level
   fields, so the four existing construction sites and their tests are
   untouched. A new `GoalResourceChips` component in
   `pages/goals/ui/shared/` renders chips from `ResourceNeed` (ability materials only; upgrade materials are not shown) + energy + the
   XP-book available/needed pair. `formatGoalRemainingText` stays for the
   tooltip/screen-reader/Unlock-tooltip callers but drops the slots segment
   and the XP segment. _Alternative:_ keep prose and prepend icons; rejected -
   it would not remove the words the user asked to drop.
   `have/required` (V1 style) is out of scope: V2's need is already net of
   inventory, so the chip shows what is still needed, which matches the
   spec's "still needed" wording.

4. **Ability materials are computed beside `abilityResourceNeed`, sharing its
   covered-transition bookkeeping.** For a MoW, sum `mow-upgrade-costs` over
   the same uncovered level transitions the upgrade need already claims; for a
   Character, sum the new ladder over the goal's two ability tracks' uncovered
   transitions. Reusing the covered-transition sets guarantees the chips agree
   with the plan's existing "already covered by a higher-priority goal" logic
   (spec: "Level range already covered"). _Alternative:_ compute from the goal
   config independently; rejected because it would double-count against
   higher-priority goals for the same unit.

5. **Character ability costs ship as a new catalog dataset, not a bundled
   client JSON.** It follows the `mow-upgrade-costs` pipeline end to end
   (API `GameCatalogDatasets.cs` + endpoint, `game-catalog` dataset key,
   payload schema, mapper), seeded from V1's `abilitiesLvlUp` table.
   _Alternative:_ copy the JSON into the web bundle; rejected - it would make
   this the only game-cost table outside the catalog and version separately
   from the rest. The API half lands first (workspace convention).

6. **Icons: reuse existing game-icon assets; add only what is missing.** First
   task audits which of ability badge, forge badge, component, orb, coin,
   XP book already have id-based icon mapping in V2. Anything missing gets an
   asset from V1's `5-shared/ui/icons`, wired the way other game-data icons
   are (see the `tp-reimplement-v1-page` conventions).

7. **Archive is removed from the UI.** `STATUS_VALUES` drops "archived", the Archive/Unarchive menu items go, and on desktop `GoalRowActions` no longer renders a "⋯" menu (mobile keeps it for project move/remove). `GoalsPage` keeps its second `useGoals({ archived: true })` query because `buildCascadeContext` still needs archived rows' status for prerequisite cascades. The backend `Archived` status and its API stay: existing archived goals are neither migrated nor deleted, just no longer listed. _Alternative:_ keep archive actions with no way to view results; rejected as it strands goals.

8. **Ability target pills replace `widestAbilityTrack`.** `GoalProgress` for an Ability goal already carries both tracks (`currentActive/targetActive`, `currentPassive/targetPassive`), so no new data: `GoalTargetDisplay` renders a pill per track whose target is above its current level, with an uppercase Primary/Secondary label (`goals.create.ability` copy already names the tracks), current in muted text, target emphasised, matching V1's `StatBlockPair`. A track already at its target is omitted; if both are, the goal is Reached and the Reached rule applies. The label follows the unit kind: `entityType === "Mow"` uses Primary/Secondary, a Character uses Active/Passive (the create form already has both label sets in `goals.create.ability`); the pill component takes the labels from the entity type rather than hard-coding either pair. The pill shows current → target rather than the configured start, which is what the Progress column's ratio measures. _Alternative:_ keep the single line and add a track suffix; rejected because a goal raising both tracks would still hide one.

9. **Goal kind moves from a caption to the Goal cell, per V1.** The Character cell drops its `goals.create.goalTypes.*` caption (keeping avatar, name link, notes and project badges); `GoalsMobileCards` drops the goal type from its header caption. `GoalTargetDisplay` is the single place a kind is drawn: Rank uses `RankBadge showLabel={false}` for both emblems (the rank name moves to the badge's tooltip/aria-label; the `(n/6)` partial-target marker stays because it is a target modifier, not a name), Unlock renders the word "Unlock" and hands the `owned / required` text to `GoalProgressDisplay` for the Progress cell. Rank milestones for one character that differ only by rank are still distinguishable by emblem, as V1 does; the level-requirement sub-line is untouched. _Alternative:_ keep the type caption and only strip the rank name; rejected as it leaves the redundancy the request targets.

10. **A `Projects` column reuses `GoalProjectBadges` unchanged.** `GoalsTable` gains one `TableHead`/`TableCell` pair between Character and Goal, rendering the existing `GoalProjectBadges`; the Character cell drops those badges and the type caption, and its notes move from a `max-w-64 truncate` paragraph below the cell into a `truncate` line under the name link (with `title` for the full text). The `h-14` row still fits name plus one line. The mobile card already shows notes and badges in its body, so it is untouched. _Alternative:_ fold projects into the Goal column; rejected, the request is a standalone column.

11. **Chips net inventory through one priority-ordered allocation.** The plan-net materials allocator (`plan-ability-materials.ts`) is extended from covering level ranges to also consuming the player's inventory of ability badges, forge badges, components, orbs and shards in priority order (shared pool, like `levelPoolXpAvailable`), producing the per-goal remaining that `GoalResourceChips` shows. Gold is not netted. Energy for MoW/Character Ability goals comes from the existing estimate, and Rank gold is taken from the same upgrade-cost source V1 uses for its Gold column (to be confirmed against `tacticusplanner` `goals.service`). Icons are V1's (`MiscIcon`, `BadgeImage`, `ForgeBadgeImage`, `ComponentImage`, `OrbIcon`).

12. **Rank energy must follow V1.** A manual comparison on a real account showed V2's per-goal Rank energy differing from V1 (worst case: a second Arjac goal 971 vs V1's 3,224). It is treated as a bug: the cause is found first (shared-plan netting versus V1's per-goal calculation, or a coverage bug) and V2 is aligned to V1's numbers unless V2's difference is a deliberate, specced plan-aware behaviour.

13. **The level requirement collapses into one Progress-cell line.** `LevelRequirementTarget` (Goal cell), `LevelRequirementProgressBar` (Progress) and `LevelRequirementRemaining` (Remaining) are merged into one component rendered in the Progress cell: level target, XP-book figure (from `goalXpBookFigure`), and the Potential-only bar, laid out like the Unlock goal's count-beside-bar. `GoalResourceChips` loses its `xpBooks` prop. On mobile the same component sits in the card's progress area. V1 reference: its Progress cell shows slots/applied, the bar and "Lv 44→50" together.

## Risks / Trade-offs

- [A seventh column narrows the others on small desktops, and badge chips wrap in a fixed-height row] -> let the Projects cell wrap to at most two lines then clip with the full list as a tooltip; verify at 768px.

- [Two Rank milestones of one character no longer differ by a text label] -> the emblem pair and the tooltip still differ; if a real ambiguity shows up in review, restore the label for partial targets only.

- [Goals already archived vanish from the UI with no way back] -> accepted by the product owner; the data is intact, and a later change can add a restore path.
- [Ability badge "alliance" differs by unit; a wrong alliance shows the wrong
  icon] -> take alliance from the catalog character/MoW, cover with a unit test
  per alliance, and fall back to a rarity-only icon with a text tooltip.
- [Chips make the Remaining cell wider than 190px and can wrap the fixed
  `h-14` row] -> chips wrap into at most two lines inside the cell, then
  collapse to "+N" with the full list in the tooltip; verify against the
  density change's compact row.
- [The stale `goals-navigation` spec text (three options) was already out of
  date with the code (six options)] -> the delta here restates the current
  set so the archived spec matches shipped behavior again.
- [Interaction with `add-goals-overview-density-option`, which also edits the
  same row cells] -> whichever archives second rebases; noted in the
  proposal's Impact.

## Migration Plan

1. Land and deploy the API companion (`character-ability-costs` dataset).
2. Land the apps change. The client tolerates a missing dataset (spec:
   "The dataset fails to load"), so deploy order mismatch degrades only
   Character Ability chips.
3. Rollback is a plain revert of the apps change; the extra dataset is inert.
