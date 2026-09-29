## 1. API companion (`tacticus-planner-api`, same change name, applies first)

- [ ] 1.1 Apply the API change `goals-overview-v1-parity` (its `tasks.md`) and verify `GET /api/v1/game-catalog/character-ability-costs` serves levels 2 to 60 on the local stack

## 2. Catalog client (`packages/game-catalog`)

- [x] 2.1 Add the `character-ability-costs` dataset key, payload schema and mapper, and verify schema tests accept a valid ladder and reject a malformed one
- [x] 2.2 Expose the ladder through the catalog's public API and the sync path, and verify the catalog sync test loads it

## 3. Resource calculation (`features/goal-farming`)

- [x] 3.1 Add an optional `abilityMaterials` field (gold, badges by rarity, forge badges by rarity, components) to `ResourceNeed`, and verify existing goal-need tests still pass unchanged
- [x] 3.2 Sum `mow-upgrade-costs` over the uncovered transitions `abilityResourceNeed` already claims, and verify a unit test for level 3→5 equals the ladder sum for levels 4 and 5
- [x] 3.3 Compute Character Ability materials from the new ladder over both ability tracks' uncovered transitions, and verify tests for one track, both tracks, and a range covered by a higher-priority goal
- [x] 3.4 Ensure a missing ladder yields no `abilityMaterials` rather than an error, and verify with a test

## 4. Icons and chip component

- [x] 4.1 (Audit result: every icon already existed as a Snowprint asset under `public/game_catalog` but only as ad hoc paths in `shop-reward-display.ts`; gap was a shared id-based resolver, added as `game-entities/icons/resource.ts`: ability badge, forge badge, MoW component (generic; no alliance split in the cost data), orb, coin, XP book.) Audit which of ability badge, forge badge, component, orb, coin, XP book have id-based icon mapping in V2 and list the gaps in this task; add missing assets, and verify each icon renders in a component test
- [x] 4.2 Build `GoalResourceChips` in `pages/goals/ui/shared/` (icon, quantity, tooltip, accessible name, wrap/collapse to "+N"), and verify component tests for accessible names, zero-quantity omission and thousands separators
- [x] 4.3 Map each goal kind to its chip set per `goal-remaining-resources` (no upgrade-material chips; XP-book only for Character Rank/Ability), and verify a test per kind (Rank, Ascension, Unlock, MoW Ability, Character Ability, Upgrade)
- [x] 4.4 Render the XP-book chip from the existing available/needed figures and verify it hides when no level-up is needed (Deviation: the goal-detail sheet keeps main's layout and shows no book figure; `PlanningSettings.xpBookRarity` is an optional field defaulting to Legendary, no settings UI)

## 5. Goals list changes

- [x] 5.1 Remove "archived" from `STATUS_VALUES`, `GoalStatusFilterValue` and counts, and update `GoalsPage`/`ProjectDetailPage` tab handling; verify `status-filter-select` and page tests show no Archived option
- [x] 5.2 Remove the Archive/Unarchive menu items and, on desktop, the "⋯" trigger from `GoalRowActions`, keeping mobile's menu for project move/remove and the archived-goals query for cascades; verify `goal-row-actions` tests (desktop has no menu, mobile still moves/removes)
- [x] 5.3 Add `isReachedRow` and the reached row/card presentation (green tint token, check mark, "Reached" badge, "-" cells) to `GoalsTable` and `GoalsMobileCards`; verify list tests on desktop and mobile
- [x] 5.4 Hide pause/resume on reached rows in `GoalRowActions` and verify the stored status is untouched in a test
- [x] 5.5 Replace the Remaining cell/card content with `GoalResourceChips` and drop "slots" and "XP" from `formatGoalRemainingText`, and verify updated `goal-remaining-text` and `goals-list` tests
- [x] 5.6 Replace the Ability branch of `GoalTargetDisplay` (and drop `widestAbilityTrack`) with one labelled pill per track still being raised, on desktop and mobile; choosing Primary/Secondary for a Machine of War and Active/Passive for a Character, and verify `goal-progress-visuals` tests for each label pair, one track only, both, and a finished track
- [x] 5.7 Remove the goal-type caption from the Character cell and the mobile card header, drop the rank-name label from the target `RankBadge` (keeping tooltip/aria-label and the partial-slot marker), render "Unlock" in the Goal cell with the shard count in the Progress cell, and verify `goals-list` and mobile card tests for Rank, Ascension, Ability and Unlock rows on both platforms
- [x] 5.8 Add the Projects column (header, cell with `GoalProjectBadges`, empty state) between Character and Goal, move notes to a one-line truncated line under the name, and remove badges/notes from their old positions in the Character cell; verify `goals-list` tests for badges in their own cell, one-line truncated notes with tooltip, no-project rows, unchanged mobile card, and the column count on Goals and Project Detail
- [x] 5.9 Extend `goal-contrast-audit` to the reached row in both themes and verify it passes

## 6. Copy and tour

- [x] 6.1 Add/replace locale keys (`Reached` badge, chip names, dropped "slots"/"XP" strings) in `en`/`de`/`es`/`fr` `common.json` and the game-data namespaces, and verify the locale key-parity test passes; remove now-unused `goals.create.goalTypes` caption usage only if nothing else reads it
- [x] 6.2 Update the Goals and Project Detail tour text that mentions the Archived option or the old Remaining column, and verify tutorial tests pass

## 8. V1 value parity (from the manual comparison)

- [x] 8.1 Diagnose why per-goal Rank energy differs from V1 (e.g. a second Arjac goal: V1 3,224 vs V2 971) by tracing both calculations, record the cause in design.md, and align V2 to V1 unless the difference is specced plan-aware behaviour; verify with a test reproducing the Arjac case and the account totals within tolerance (Resolved: see design decision 14; V2 is not changed.)
- [x] 8.2 Net ability badges, forge badges, components, orbs and shards against inventory in priority order (gold un-netted), and verify tests for fully-held, partially-held, priority order and orbs
- [x] 8.3 Add energy chips to MoW and Character Ability goals and Rank gold chips (source per V1), and verify with tests that Z'Kar shows energy and Rank goals show gold
- [ ] 8.4 Use V1's icons for energy, gold, ability badge, forge badge, component, orb, shard and XP book, and verify by a render test and the browser check

## 8b. Estimate alignment and Onslaught tokens

- [x] 8.5 Restrict campaign node selection to nodes unlocked by the player's synced campaign progress (per the goal-farming-estimates delta) for every estimate consumer, carrying node/campaign identity into farm locations as needed, and verify tests for the locked-cheaper-node, no-unlocked-node and consumer-agreement scenarios; then re-compare the account energy against V1
- [x] 8.6 Show the projected Onslaught tokens a goal uses as a chip in Remaining (V1 token icon), energy for the campaign portion only, and verify tests for the Onslaught-only, mixed and no-source scenarios

## 8c. Level line

- [x] 8.7 Merge the level target, XP-book figure and Potential-only bar into one line in the Progress cell (desktop and mobile), leave only the goal target in the Goal cell, remove the "N levels" text and the XP-book chip from Remaining, and verify list tests for a below-level Rank goal, a met requirement, a MoW goal, and the mobile card

## 8d. Gold format

- [x] 8.8 Show the gold chip's quantity in thousands with a k suffix (below 1,000 as is, otherwise floor(value / 1000) + "k", per V1's numberToThousandsString) while keeping the full value in its tooltip and accessible name, and verify chip tests for 42,235, 1,999 and 750

## 8e. Overlap explanation and level chaining

- [x] 8.9 Show a Rank goal's standalone slots and energy in a tooltip when a higher-priority goal for the same unit covers part of its range (data from rankSlotAllocation / a standalone estimate), and verify tests for the overlap and no-overlap scenarios using the Arjac fixture
- [x] 8.10 Investigate why a second Rank goal shows its level requirement from the current level ("Lv 33 → 38") where V1 chains it ("Lv 35 → 38"), check against rank-level-progression's once-per-unit level accounting, align the display (and chart the cause in design.md) if the allocation already treats those levels as covered, and verify a test with the two Arjac goals

## 7. Verification

- [x] 7.1 Run the apps test suite, typecheck and lint for the touched packages and verify they pass
- [ ] 7.2 With the full local stack (Aspire AppHost), verify in the browser on desktop and mobile widths: a reached goal (tint, check, "Reached", dashes, no pause), an ability goal with badge/gold chips, an XP-book chip, and the filter without Archived; capture evidence with `tp-manual-ui-verification`
