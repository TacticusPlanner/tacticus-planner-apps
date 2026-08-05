## Context

See `proposal.md` for motivation. Relevant current state:

- `RaidSchedule`/`ResourceCard`/`GoalHeader` (`apps/web/src/fsd/pages/dailies/ui/raid-schedule.tsx`) render Today, Bonus Raids, and every Raids Plan day card from the same component and the same `groupEntries()` (goal → resource) grouping. Grouping itself is out of scope for this change.
- `DailyRaidLocationViewModel` (`daily-raids.domain.ts`) carries one pre-formatted `label: string` per battle, built in `use-daily-raids.ts` from `useCampaignDisplay().shortLabel()` + `battle.nodeNumber`.
- `DailyRaidGoalViewModel` carries only a pre-formatted `targetLabel: string`; the raw goal kind and (for Rank) the raw rank value are not preserved past `daily-raids-calc.ts`/`use-daily-raids.ts`.
- `attemptsUsedByBattle` (today's fully-raided signal) is a simulation output, already computed, only rendered inline as a per-node badge.
- `live-progress.battleAttempts[]` (`packages/player-data/src/player-data.schema.ts`) — `{ tacticusCampaignId, battleIndex, attemptsLeft, attemptsUsed }` — is real, account-synced attempt data, fetched via `getLiveProgress()` in `use-daily-raids.ts` today but only `activeCampaignEventId` is read from it.
- `goalTypeIcon()`/`GoalTypeBadge` live in `apps/web/src/fsd/pages/goals/ui/shared/goal-visuals.tsx` (page-local). `RankBadge` (`fsd/shared/ui/rank-badge.tsx`) is already a shared component.
- V1's `tacticusplanner/src/reducers/daily-raids.reducer.ts` (~lines 76-141) already joins `battleAttempts` to real energy spent: `energySpent: battle.attemptsUsed * campaignComposed.energyCost`, matching standard-campaign nodes via `campaignShortId + String(battleIndex + 1).padStart(2, '0')` and challenge/event nodes via a precomputed `orderedKeys[battleIndex]` lookup (challenge nodes interleave with standard ones, so ordinal position isn't the node number directly).

## Goals / Non-Goals

**Goals:**

- Make location the primary visual in Today/Bonus Raids cards without touching goal→resource grouping or the Raids Plan tab's rendering.
- Surface fully-raided locations as their own section, removing them from their normal card's location listing once they move there (no duplicate inline indicator).
- Add a real, account-wide energy-usage indicator sourced from actually-synced attempts, decoupled from the plan simulation.
- Relocate goal-type iconography to a shared slice so both Goals and Dailies can use it without violating FSD's no-page-to-page-import rule.

**Non-Goals:**

- Changing how entries are grouped (goal → resource stays exactly as-is).
- Changing the Raids Plan tab's rendering, density toggle, or day-card layout.
- Building any UI to log/mark a raid as done manually — the new energy figure comes entirely from already-synced `live-progress` data, not a new write path.

## Decisions

**1. Location-primary rendering is an opt-in variant on the existing `ResourceCard`, not a new component or a second grouping pass.**
`RaidSchedule` gains an `emphasis?: "material" | "location"` prop (default `"material"`, preserving today's Plan behavior with zero call-site changes there); Today/Bonus pass `emphasis="location"`. Within `ResourceCard`, `emphasis="location"` swaps which side of the existing grid is visually primary and renders one full-weight row per `resourceEntries` location instead of the current `LocationChips` line. This keeps one shared component and one grouping algorithm — matching the config rule to derive summaries/variants from one canonical structure rather than forking the calculation.

- _Alternative considered_: a separate `LocationFirstResourceCard` component for Today/Bonus. Rejected — the two layouts share enough (progress display, goal-merge handling, badge/raid-count logic) that a fork would duplicate more than it would simplify, and a prop keeps Plan's call site untouched by construction.

**2. `DailyRaidLocationViewModel` and `DailyRaidGoalViewModel` carry raw data, not pre-formatted strings — except the one compact string Raids Plan still needs verbatim.**
`DailyRaidLocationViewModel` changes from `{ id, label, icon? }` to `{ id, fullName, shortLabel, nodeNumber, challenge, icon? }`; `use-daily-raids.ts` computes `fullName` via `useCampaignDisplay().fullLabel()` for the new location-primary rendering, while `shortLabel` keeps computing the same compact `"{name} {code} {node}{B?}"` string the old single `label` field held (via `useCampaignDisplay().shortLabel()`), byte-for-byte preserving Raids Plan's existing chip text since that call site is out of scope for this change. `DailyRaidGoalViewModel` gains the raw goal kind (and, for Rank, the raw `Rank` value) alongside the existing `targetLabel`, so the UI picks the icon/component rather than parsing a formatted string. Raids Plan keeps consuming `targetLabel`/`shortLabel` for its own (unaffected) rendering.

- _Alternative considered_: keep only formatted strings and have the UI regex/parse them for icon selection. Rejected as fragile and exactly the kind of implementation detail specs warn against baking into display strings.

**3. A fully-raided location is excluded from its normal card once it moves to the new section.**
Once a location's combined raids (today's schedule + Bonus Raids) reach its daily attempt cap, it is removed from its resource card's location listing entirely and appears only in the new Fully Raided section — no duplicate inline indicator. This modifies the existing `daily-raids-today` spec's "Today's raid schedule" requirement (previously assumed out of scope): its inline per-node fully-raided marking (e.g. "A node at its daily cap is marked fully raided," "Fully raided combines raids across goals") is replaced by removal from the list rather than an in-place badge; the same treatment carries through to Bonus Raids, which that requirement already cross-references. If every location for a scheduled upgrade or shard becomes fully raided, that upgrade/shard's card is omitted from the schedule/Bonus Raids for the day entirely — its need at available locations is exhausted, and it remains visible via the Fully Raided section instead.

- _Alternative considered_: keep the inline badge and additionally list the location in the new section (additive, no dedup). This was the original approach here but is superseded by explicit product direction: a location fully raided today has nothing left to act on, so leaving it inline is clutter rather than signal.

**4. Real energy usage is computed account-wide across non-event campaigns, independent of the plan simulation, via a new `battleIndex → BattleId` join; event campaigns are excluded from the total.**
`use-daily-raids.ts` reads `live-progress.battleAttempts[]` (already fetched, `battleAttempts` currently unused) and, for every entry belonging to a standard/mirror/elite/eliteMirror campaign, resolves the corresponding catalog battle to get its `energyCost` — for these campaigns `nodeNumber = battleIndex + 1` always holds (confirmed against the catalog generator: each such campaign group has exactly one `type` and no interleaved challenge nodes), so the join is a direct, unambiguous lookup. The result (`Σ attemptsUsed × energyCost` across those campaigns, account-wide) is exposed as a new field alongside the existing `dailyEnergy`/`today.energyTotal`, kept distinct from the plan's own (necessarily-capped) `energyTotal`.

Event-campaign battles are excluded from this total. Investigation during implementation found that Tacticus reports an event's Standard and Extremis tiers as two separate progress entries sharing the same `tacticusCampaignId`, each with its own independent `battleIndex` sequence; the backend's `live-progress.battleAttempts` join collapses both into one record keyed only by `{tacticusCampaignId, battleIndex}` with no tier field, so the same key can legitimately refer to two different real battles once both tiers are unlocked and raided. There is no way to disambiguate from data already stored client-side. Fixing this at the source (adding a tier field server-side) is backend work outside this frontend-only change's scope, so event-campaign attempts are left out of the real-usage total for now — a known, explicit undercount for players actively raiding event campaigns that day, not a silent one (see Risks below).

- _Alternative considered_: scope the real total to only nodes referenced in the current project's plan. Rejected per explicit product decision — "every node in battleAttempts, account-wide" is the intended scope, since the goal is a true daily-usage gauge, not a plan-adherence metric.
- _Alternative considered_: sum every ambiguous candidate battle's energy cost when an event campaign's `{tacticusCampaignId, battleIndex}` key matches more than one real battle. Rejected — this can overcount (double-charges energy for a single real attempt when the two candidate nodes have different costs), trading a known, bounded undercount for an unbounded and less predictable overcount.

**5. Goal-type iconography relocates to `entities/goal`.**
`goalTypeIcon()` and a renamed/generalized `GoalTypeBadge` move from `pages/goals/ui/shared/goal-visuals.tsx` to `entities/goal/ui/` (with `goalTypeIcon()` itself living in `entities/goal/model/` since it's a plain function, not a component — kept in a separate module from `GoalTypeBadge` so `entities/goal/ui/goal-type-badge.tsx` only exports components, per the repo's react-refresh/only-export-components rule), exported via `entities/goal`'s public API (`index.ts`). Goals page call sites update their imports; behavior there is unchanged. Dailies imports the same relocated function for its icon+text goal-type treatment. Rank goals show this same goal-type icon _paired with_ the already-shared `RankBadge` (`showLabel={false}`) — both icons, no text — rather than the rank icon alone, so a Rank target is still visually identifiable as a goal-type-icon-led row like every other kind, just without a text label.

- _Alternative considered_: duplicate a minimal icon map inside Dailies instead of relocating. Rejected — this repo's FSD rules and the project's own design rule ("for functionality shared by multiple pages, document the owning FSD slice") both point at consolidating into the shared entity rather than forking a second copy that could drift.

## Risks / Trade-offs

- [Risk] Event-campaign attempts are excluded from the real energy-usage total (see Decision 4) because `battleIndex` is genuinely ambiguous for them in stored data — a player actively raiding an event campaign that day will see an undercounted total. → Mitigation: this is a deliberate, documented scope limitation rather than a silent bug; a backend fast-follow (adding a tier field to `live-progress.battleAttempts`) would close the gap but is out of scope here.
- [Risk] Excluding a fully-raided location (or, in the all-locations-capped case, an entire entry) from the normal list could read as the item silently disappearing rather than being done. → Mitigation: the Fully Raided section renders immediately after Bonus Raids so removed items have an obvious, adjacent destination; empty-state and section-title copy make clear it's a "done" list, not an error.
- [Trade-off] The energy-usage indicator being account-wide (not plan-scoped) means it can look surprising next to a page that is otherwise entirely project-scoped (everything else on Today reacts to the project selector; this indicator won't). This is intentional per the confirmed scope, but worth a short microcopy/label treatment so it doesn't read as a bug.

## Migration Plan

Frontend-only, additive/visual change behind no feature flag (small user base, pre-production V2 submodule per `destructive-changes-policy`). No data migration — `live-progress.battleAttempts` is already synced and stored; this change only starts reading a field that already exists in IndexedDB. Rollback is a plain revert.
