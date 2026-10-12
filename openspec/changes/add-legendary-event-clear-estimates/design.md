# Design

## Context

- Stage 2 shipped teams with a manual clear depth per run (`runDepths[{ run, expectedBattleClears, expectedBattleClearsSource, recordedAt }]`); the API accepts source `estimate | manual`, this client only writes `manual`. `ClearDepthStepper` (features/legendary-event-teams) is "− n +" bounded 1..lane battle count with a Clear control; the card shows "Set depth" when the current run has no depth.
- `@workspace/game-domain` `characterCombatPower({ unlocked, rank, progression, appliedUpgradeCount, activeAbilityLevel, passiveAbilityLevel })` is the V1 port (Gold1 / Epic:RedOneStar / 3 upgrades / 20 / 15 → 8,792). `pages/dailies/model/team-eligibility.ts` maps its own roster type to that input; the LRE entity cannot import a page.
- `lre-battles` serves per-battle `power` keyed `{lreId}-{track}-{number}`; tracks list `battleIds` in order. Powers grow roughly geometrically (Uthar Alpha battles 1–7: 1,018; 3,055; 8,199; 20,703; 40,586; 75,787; 134,603). Every battle's `disallowedFactions` equals the lane's own allowed-units exclusion today, so team members (already lane-filtered) never hit it.
- Companion API dataset `lre-clear-estimate`: `{ powerRatio, calibration: { sampleCount, calibratedOn }, unitCoefficients[{ unitId, coefficient }] }`; absent unit = 1.0; starts uncalibrated (ratio 1.0, 0 samples).
- The docs plan said to write estimates to `expected_battle_clears` with source `estimate`; `architecture/data/events.md` and ADR 0009 say forecasts are calculated, never stored.

## Goals / Non-Goals

**Goals:**

- A non-blank depth on every team with owned members, without a click, explained by its margin.
- One calculation for teams and single units, tunable from the catalog without a release.
- A calibration method that can be rerun as evidence grows.

**Non-Goals:**

- Wave-level simulation, synergy, or objective-specific difficulty (an objective like "Max 1 Hit" makes a battle harder; not modelled).
- Persisting estimates, the community aggregate, suggestions.

## Decisions

**D1. Slice ownership.** `entities/legendary-event` owns the pure libs `lib/unit-combat-power.ts` (synced character record + catalog unit → `CharacterCombatPowerInput`: rank, progression, `appliedUpgradeSlots.length`, active/passive ability levels by the unit's catalog ability kinds; `unlocked` false when not in the roster), `lib/clear-estimate.ts` (`unitEffectivePower`, `teamEffectivePower`, `estimateClearDepth(effectivePower, battlePowers, powerRatio)`, `unitClearEstimate`), `lib/calibrate-power-ratio.ts`, and the hooks `model/use-legendary-event-battles.ts` (ordered battle powers per lane from `lre-battles`) and `model/use-clear-estimate-config.ts` (the `lre-clear-estimate` record, with `ready | absent | failed | loading`). Features and pages read them through `index.ts`.

**D2. Estimates are calculated, not stored.** The displayed depth for a team and run is `manual depth for that run ?? estimate`. The estimate is recomputed from the synced roster each render, so "re-estimate when the roster changes" needs no trigger and "never overwrite a manual value" holds by construction. **Use estimate** deletes the run's manual depth (the existing null-depth write). This deviates from the plan's "write it to `expected_battle_clears` with source `estimate`" for three reasons: it matches events.md and ADR 0009 (calculated, never stored); persisting would write a plan revision on every sync for every team, colliding with real edits on other devices; and a stored estimate goes stale the moment the roster or coefficients change. Stage 4's next-token card reads the same `manual ?? estimate` value through a shared selector `teamEffectiveDepth(team, run, estimate)`. Stage 7 history, which wants "last time this team cleared battle 6", reads synced cleared depth and stored manual depths, not estimates. The `estimate` source value in the API stays reserved.

**D3. Calculation.**
- `unitEffectivePower(unit)` = `characterCombatPower(input)` × `coefficient(unitId)` (1.0 when not listed); 0 when not owned.
- `teamEffectivePower(team)` = Σ `unitEffectivePower` over the team's non-reserve members (a partial team sums fewer members; a locked member adds 0).
- `estimateClearDepth(E, powers[], ratio)` = the largest n such that for every k ≤ n, E ≥ ratio × powers[k]; 0 when battle 1 already fails. Margin above = E ÷ (ratio × powers[n]) − 1 (none when n = 0); shortfall to next = 1 − E ÷ (ratio × powers[n + 1]) (none when n = battle count). Both rounded to whole percent for display.
- `unitClearEstimate(unit)` = `estimateClearDepth(5 × unitEffectivePower(unit), …)` ("a team of five like this unit").
The result type `ClearEstimate { depth, battleCount, marginAbovePct | null, shortfallToNextPct | null, calibrated: boolean }` is the one structure the card, editor, leaderboard and later stages read.

**D4. Calibration method.** A sample is a team with a manual depth d (1 ≤ d) on a lane, with its members' synced progression. With coefficient 1.0 for every unit, E is its effective power; the team clears battle d and not d + 1, so the ratio lies in (E ÷ powers[d+1], E ÷ powers[d]]. The sample's point value is the geometric mean of the two bounds (just the upper bound when d is the last battle). `calibratePowerRatio(samples)` returns the median of point values, the sample count, and the interquartile range for the PR note; it skips samples with d = 0 or a locked member. The calibration task runs it over maintainers' own teams (their Stage 2 manual depths, many imported from V1) and lands the ratio and count in the API raw file. Coefficients are then tuned per unit where overrides consistently disagree, starting from 1.0.

**D5. Display.** Card: with a manual depth for the current run, the stepper shows it as today plus, when an estimate exists, a muted "estimate ~6" hint; without one, the stepper shows "~6" with an "estimated" tag, the margin line "21% above battle 6 · 32% short of battle 7", and "uncalibrated" in the tag's tooltip while `calibration.sampleCount` is 0. Pressing − or + starts from the shown estimate and saves a manual depth. **Use estimate** appears only when a manual depth exists. Depth 0 shows "Not enough for battle 1 yet". Locked members show "2 locked members not counted" under the margin. Editor: the depth field mirrors the card. Leaderboard: a "Clears" figure beside Objectives on both forms ("~6", or "—" for a locked unit, unknown ownership or no estimate).

**D6. Dataset and data states.** `lre-clear-estimate` absent or failed: no estimate anywhere; cards behave exactly as Stage 2 ("Set depth"), the leaderboard hides the Clears figure. Loading (dataset or `lre-battles`): cards show the stored depth or "Set depth" without an estimate, the leaderboard shows a placeholder dash. Roster unavailable: no estimate (ownership unknown) and the existing "roster not synced" note.

**D7. Desktop and mobile split.** Same content on both. Desktop leaderboard: a "Clears" column after Objectives, header not sortable. Mobile leaderboard card: "Objectives: N · Clears: ~6" on one line. Card margin line wraps under the stepper on mobile. Tour selectors unchanged (`legendary-event-teams`), so no split.

**D8. Analytics.** `legendary_event_depth_set` gains `estimate` (number or null) and `fromEstimate` (whether the edit started from a shown estimate); new `legendary_event_depth_estimate_restored` (eventId, laneId, estimate) when Use estimate is pressed. These are the override log the plan's risk section asks for.

## Risks / Trade-offs

- [Uncalibrated ratio before samples] → labelled "uncalibrated", overridable; calibration task in this change.
- [Combat power ignores equipment and synergy] → coefficients absorb systematic per-unit bias; the margin tells power users how close the call is.
- [Objective difficulty not modelled] → an estimate is for clearing the battle; whether a team also completes hard objectives is out of scope; noted in the "how estimates work" disclosure.
- [Deviation from the plan's persisted estimate] → stated in D2; the API keeps the `estimate` source, so persisting later is additive.

## Migration Plan

Client-only after the API dataset ships. No data migration; existing manual depths keep winning.

## Open Questions

- Who curates coefficients long-term (shared with the API change).
