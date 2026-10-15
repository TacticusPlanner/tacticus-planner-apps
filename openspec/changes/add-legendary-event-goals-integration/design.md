# Design

## Context

- A lane tab renders, in order, the lane overview, Teams, the Synced progress grid and the lane leaderboard. Overview renders the Run status card, the lane summary and the cross-lane leaderboard. Leaderboard rows (`leaderboard-table.tsx` on desktop, `leaderboard-list.tsx` on mobile) have no actions menu yet; only team cards have one (`team-card.tsx`, `MoreHorizontal`).
- `entities/legendary-event` already provides `buildLanePointsModel`, `buildSyncedLaneProgress`, `objectivesSatisfied`, `unitLanePotential`, `currentLegendaryEventRun`, `teamDepthForRun`, `teamEffectiveDepth`, `teamClearEstimate`, `unitClearEstimate`, `unitEffectivePower` and `unitCombatPowerInput`. Objective matching (`objective-match.ts`) reads only static catalog fields (faction, alliance, traits, damage types, hits, attack type), so no rank or ascension step changes which objectives a unit satisfies.
- `@workspace/game-domain` provides `progressionOrder`, `progressionAt`, `maxRankForProgression` (Common Iron1, Uncommon Bronze1, Rare Silver1, Epic Gold1, Legendary Diamond3, Mythic Adamantine2), `rankOrder` and `characterCombatPower`. The catalog character view carries `initialRarity`.
- Goals: `useGlobalGoalPlan().active` lists Active goals (summaries only: entity, kind, status). Targets live on `GoalDetail.config` (`rank.end`, `rank.endAppliedUpgrades`, `progression.end`, `ability.activeEnd` / `passiveEnd`), read with `goalQueries.detail(id)` as `use-membership-slots.ts` and `use-daily-raids.ts` already do with `useQueries`.
- Goal creation: the app shell owns the single `CreateGoalSheet` and provides `CreateGoalLauncherContext` (`pages/goals/model/goal-creation-form/create-goal-launcher-context.ts`). Its `CreateGoalPrefill` supports Ascension (with `requiredProgression`), Unlock and project-only prefills. A page outside `pages/goals` cannot import it.
- V1 `suggestTeams` (`tacticusplanner` `src/fsd/3-features/lre/model/base.le.track.ts`): for each objective, and for the user's selected objective combination, it takes allowed units satisfying it and sorts them by recommend-first / recommend-last bias, campaign need, rank, rarity and points.

## Goals / Non-Goals

**Goals:**

- Answer "which upgrade earns me points here" in event points, with the battle it unlocks, and one tap to a goal.
- Show the lane as it would be once goals are reached, without leaving the event page.
- Offer teams the user can take as-is or edit, with a one-line reason each.
- One shared measure (lane reachable points) behind upgrade impact and suggestions.

**Non-Goals:**

- Reading Stage 4's token plan, or changing it.
- Ability-level or upgrade-material steps, multi-step paths ("D1 → D3"), and the cost of a step.
- Persisting suggestions, previews or impacts.

## Decisions

**D1. Slice ownership.** Pure calculations live in `entities/legendary-event/lib` because they read only entity types and game-domain, and Stage 7 can reuse them:

- `goal-preview-roster.ts`: `previewRoster(roster, targets, initialRarityOf)` returns the roster as if the goal targets were reached, plus the set of previewed unit ids. `LegendaryEventGoalTarget` is a plain entity type `{ unitId, goals: LegendaryEventGoalRef[] }`, where a ref is `{ goalId, kind, progressionEnd?, rankEnd?, appliedUpgradesEnd?, activeEnd?, passiveEnd? }` and the per-unit combination happens in `previewRoster`, so the entity never imports `entities/goal`.
- `reachable-points.ts`: `laneReachablePoints(pointsModel, laneProgress, reaches)`, where a reach is `{ depth, coveredObjectiveIndexes }`. It returns `{ total, perBattle[] }`.
- `upgrade-steps.ts`: `nextUpgradeSteps(rosterUnit | undefined, unit)` returns `UpgradeStep[]` (`unlock`, `rank`, `ascension`) with the stepped roster unit.
- `upgrade-impact.ts`: `laneUpgradeImpact(input)` returns `UpgradeImpact { baselinePoints, rows: UpgradeImpactRow[] }`, where a row is `{ unitId, step, gainPoints, teams: { teamId, depthBefore, depthAfter }[] }`. The section's header line is derived from these rows, not calculated separately.
- `team-suggestions.ts`: `suggestLaneTeams(input)` returns `TeamSuggestion[]` (`{ objectiveIndexes, memberUnitIds, coveredObjectiveIndexes, depth, gainPoints }`).

`features/legendary-event-goals` owns the hook `model/use-legendary-event-goal-targets.ts`, which reads the active plan and the goal details and maps them to `LegendaryEventGoalTarget`. It also owns `model/create-goal-prefill.ts` (step or row → `CreateGoalPrefill`) and `ui/upgrade-impact-section.tsx`. `features/legendary-event-team-suggestions` owns `model/use-team-suggestions.ts` and `ui/team-suggestions-dialog.tsx`. Its accept action is an `onUseSuggestion(suggestion, rank)` prop that the page wires to the team editor, so the two features never import each other. The generic badge `UnitGoalBadge` lives in `entities/goal/ui`, so the teams feature's picker and the page can both use it. The page composes all of these and passes the preview roster and goal unit ids into the picker as props.

**D2. Launcher context moves to `entities/goal`.** `CreateGoalLauncherContext`, `useCreateGoalLauncher`, `LaunchCreateGoal` and `CreateGoalPrefill` move to `entities/goal/model/create-goal-launcher.ts` and are exported from `entities/goal/index.ts`. `CreateGoalLauncherProvider` stays in `pages/goals` and imports the context from the entity. `pages/goals` re-exports nothing new, and its own consumers switch to the entity import. The prefill gains `{ entityType, entityId, goalType: "Rank", rankEnd, appliedUpgradesEnd: 0 }` and a unit-only `{ entityType, entityId }` variant, which selects the unit and leaves every goal type unticked. `projectIds` becomes optional. When it is absent, the sheet keeps its existing default-project and remembered-membership fallback (`goal-creation-entry-points`). After a create, the shell already invalidates the goal queries, so badges and the preview update without a page reload.

**D3. Goals Preview.** Active goals only (Paused, Completed and Archived are ignored, as `useGlobalGoalPlan().active` already does for planning). Only Character goals of kinds Unlock, Ascension, Rank and Ability whose unit the event allows are read, so detail queries stay bounded by the event's allowed units. Per unit, targets combine as follows:

- A unit the roster lacks becomes owned at its base state (initial rarity's first progression step, Stone1, no applied upgrades, abilities 1/1) when it has any of those goals.
- Progression becomes the highest of the current progression and every Ascension end.
- Rank becomes the highest of the current rank and every Rank end. A higher rank takes that goal's end applied upgrades; an equal rank keeps the higher applied count.
- Each ability level becomes the highest of the current level and every Ability end.

A preview never lowers a value. The toggle is page state beside Only unlocked and the objective filter: shared by the three lanes and Overview, off by default, kept while on the page, reset on leaving it. The team picker's own switch starts from the page value, like Only unlocked. Preview affects ownership (and so Only unlocked), the rarity and rank shown, and estimated clears. It never affects points, team cards, upgrade impact, suggestions or anything persisted. Those stay anchored to the synced roster, so a preview can't leak into plan decisions.

**D4. Lane reachable points.** Battle `b` (0-based) is reached when some team's depth is greater than `b`. A team's depth is its current run's stored depth, else its Stage 5 estimate, else 0 (`teamEffectiveDepth`). For each reached battle the lane earns:

- the kill score left, `max(0, battlesPoints[b] − highScore_b)`;
- `defeatAll[b]` when defeat-all is not cleared;
- the catalog score of each objective that is not cleared and that a team reaching `b` covers.

Only a team's stored covered objectives that its current members still derive count (the Stage 2 rule for points), and the reserve never counts. This matches Stage 1's earned-points rule and Stage 4's token value, so the unverified second high-score award is not counted. Maybe clear and Stop here marks are ignored: upgrade impact exists to show what a stronger team would reach, including battles the user marked as beyond them today. The per-team gain on its own would double-count a battle another team already reaches. Measuring the whole lane fixes that, which is why both impact and suggestions report differences in this one figure.

**D5. Upgrade impact.** The candidates are the distinct non-reserve members of the lane's teams. Their next steps are:

- **unlock** when the roster lacks the unit (base state as in D3);
- **rank** to the next rank with 0 applied upgrades, only when that rank is within `maxRankForProgression` and exists in the ladder;
- **ascension** to the next `progressionOrder` step.

For a step, every team of the lane holding that unit is re-estimated with the stepped roster unit. A team's depth after the step is `min(battleCount, depthBefore + (estimateAfter.depth − estimateBefore.depth))`, with a missing estimate read as 0. The estimate delta moves a manual depth too, so a team the user set lower than its estimate isn't credited with the gap between them. The gain is `laneReachablePoints(after) − laneReachablePoints(before)`. Rows with a gain of 0 are dropped. Rows are ordered by gain descending, then the most battles newly reached, then localized unit name. The section renders on lane tabs only, after Teams and before the progress grid. It is collapsed by default, and its header carries the derived summary ("4 upgrades add points · best +148"). The open state is per device in `localStorage` (`legendaryEvents.upgradeImpact.open`, wrapped in try/catch). A row whose unit already has an active goal at or beyond the step shows "In goals" instead of Create goal.

**D6. Suggestions.** For each objective subset of size 1 and 2 of the lane's objectives, the candidates are the allowed units that satisfy every objective in the subset, excluding locked units while Only unlocked is on (default on). Candidates are ordered by:

1. units with an active goal first, while Prefer units with goals is on (default off);
2. effective power on the synced roster, descending;
3. points per battle, descending;
4. localized name.

The first five candidates form the proposal. Its covered objectives are derived from those members (the Stage 2 rule), and its depth is the Stage 5 team estimate. Proposals with the same member set are merged, and a proposal whose member set equals an existing team's on that lane is dropped. Each proposal's gain is the lane reachable points it adds over the lane's existing teams. Proposals with a gain of 0 are dropped. The rest are ordered by gain descending, then deeper depth, then more members, then the lowest catalog index among its covered objectives. The first three show, and **Show more** reveals up to ten. Pairs are included because two-objective teams often outscore single-objective ones (the worked example's Melee team), and larger subsets rarely have five units that satisfy all of them. That bounds the work at 15 subsets per lane. Recommend-first and recommend-last bias, rank and rarity sorts are dropped. Effective power already folds in rank, rarity and the horde-mode tier. Suggestions read the synced roster, never the preview. **Use this team** opens the Stage 2 team editor as a new team with the proposal's members in order, its derived coverage ticked and the default name. Saving creates the team through the existing create call. Cancelling saves nothing. After a save, the remaining proposals re-rank against the new team set.

**D7. Desktop and mobile split.**

- **Leaderboard menu.** Desktop: a trailing narrow column on the lane and Overview tables with a kebab button per row (the header's accessible name is "Actions"). Mobile: a kebab in the card's top-right corner with a hit target of at least 44px.
- **Goals Preview switch.** It sits in the existing leaderboard controls row on desktop and in the compact controls bar on mobile, with the same semantics on both.
- **Upgrade impact.** Desktop: one row per step with columns unit, step, teams ("Four: battle 5 → 6"), points and a labelled Create goal button. Mobile: a two-line card (unit and step, then teams and points) with an icon Create goal button whose accessible name names the unit.
- **Suggestions.** Desktop: a dialog with the toggles in a row above stacked proposal cards. Mobile: a bottom sheet with the toggles in a compact bar and full-width **Use this team** buttons. The team editor that follows is already a dialog or sheet per form (Stage 2).
- **Tour.** The Upgrade impact step targets `data-testid="legendary-event-upgrade-impact"` (the section header) on both forms, so no split selectors.

**D8. Data states.**

- Goals still loading: no badges, and the preview switch is disabled with a spinner.
- Goals read failed: no badges, and the switch is disabled with "Goals unavailable".
- No active goals for the event's units: the switch is disabled with "No active goals for this event's units".
- Estimates unavailable (tier read failed, battles or tier list loading, roster unknown): the Upgrade impact body reads "Needs clear estimates", and Suggest teams is disabled with that reason. Preview still changes ownership, rarity and rank, but shows no Clears figure.
- No teams on the lane: the Upgrade impact body reads "Add a team to see which upgrades add points".
- No positive rows: "No single next step adds points on this lane".
- No proposals: "No team adds points over your current teams".

**D9. Analytics.**

- `legendary_event_goals_preview_toggled` (eventId, enabled, surface `leaderboard` | `picker`).
- `legendary_event_create_goal_opened` (eventId, laneId or null, source `leaderboard` | `upgradeImpact`, goalType `Unlock` | `Ascension` | `Rank` | null).
- `legendary_event_upgrade_impact_expanded` (eventId, laneId, rowCount).
- `legendary_event_team_suggestions_opened` (eventId, laneId, suggestionCount).
- `legendary_event_team_created` gains `source` (`manual` | `suggestion`) and `suggestionRank` (1-based or null).

## Risks / Trade-offs

- [Depth estimates are uncalibrated] → impact and suggestions are only as good as Stage 5's ratio. Each row names the battle it unlocks, the team card shows the margin, and the rows re-rank as soon as the ratio is calibrated.
- [Single next steps rarely cross a threshold on later battles, because battle power grows about 1.8× per battle] → the empty state says so plainly. Multi-step paths are a later change if users ask.
- [Detail queries per active goal] → bounded by goals for the event's allowed units, cached by TanStack Query and shared with other pages' detail reads.
- [Moving the launcher context touches goal-creation code] → it is a move with the same behaviour, pinned by the existing goal-creation tests plus a test that the LRE page launches the shell's sheet.
- [Overlap with PR #219 in locales, the page view model and the tour] → a merge or two, no shared logic; see the proposal.

## Migration Plan

Client-only. No stored data changes. One new `localStorage` key, which defaults to collapsed.

## Open Questions

- None blocking. Whether to rank upgrade impact by goal cost (energy or days, from the goals estimate) waits on feedback.
