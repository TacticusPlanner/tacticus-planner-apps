## Context

See `proposal.md` - Why. Relevant existing shape, confirmed by reading the
code:

- `RaidSchedule`'s `emphasis="location"` gates visibility through
  `isLocationVisible(entry, attemptsLeftByBattle)`
  (`location-visibility.ts`), which checks
  `attemptsLeftByBattle.get(entry.battleId) !== 0`.
- `ResourceCard` also uses `emphasis` to select different card markup.
  Changing emphasis is therefore not a partition-only operation.
- V1 separates unlock/event eligibility and planning filters from completed
  raids; Today retains completed cards in a separate "RAIDED" section after
  actionable cards. See `proposal.md`'s V1 comparison and source references.
  This change reuses V2's exhausted-attempt predicate to mirror that layout,
  not V1's broader filter pipeline.
- `today-page.tsx` hardcodes `emphasis="location"` and passes
  `raids.attemptsLeftByBattle` — no toggle, no opt-out. This is not just
  implementation default: `daily-raids-today`'s own spec requirement 4
  states the exclusion with a hard SHALL ("A node whose real synced
  attempts today have reached zero remaining... SHALL be excluded"). This
  proposal does not touch that requirement or that page.
- `raids-plan-page.tsx` never passes `emphasis` (defaults to `"material"`)
  or `attemptsLeftByBattle` (defaults to an empty map) to any of its
  `RaidSchedule` calls — nothing is ever separated there today, for any day.
- `attemptsLeftByBattle` is a single top-level field on
  `DailyRaidsViewModel` (`use-daily-raids.ts`), built from
  `live-progress.battleAttempts` — i.e. today's real synced attempt state.
  It has no per-day equivalent: `daily-raids.domain.ts` confirms `today`
  and `planDays[0]` are the same object
  (`daily-raids-calc.test.ts:1005`), and `daily-raids-plan`'s own spec
  only ever talks about the simulated engine's per-day attempt caps for
  Day 2 onward — never about real synced attempts-left. There is no data
  source a raided section could use for Day 2+.

## Goals / Non-Goals

**Goals:**

- Match V1's Today UX on Raids Plan's Day 1: exhausted nodes are shown
  separately, after the actionable ones, under a "Raided" heading, without
  changing card presentation or planning calculations.

**Non-Goals:**

- Not full V1 parity or complete resolution of DAILY-06: campaign unlocks,
  event eligibility, energy affordability, and farming strategy are not
  inferred from remaining attempts or changed by this layout.
- Not adding a toggle or any control. The Raided section is always shown when
  there is something to put in it.
- Not changing Today. Its existing unconditional hiding is a committed spec
  requirement (`daily-raids-today`); showing a Raided section there would be a
  separate change.
- Not attempting to split Day 2+ by availability. There is no real
  synced-attempts data for future days (see Context) — building one would mean
  inventing a "projected exhaustion" concept nothing in this codebase
  currently models, well beyond DAILY-06's scope.

## Decisions

**Partition Day 1's entries before grouping; preserve emphasis.**
For the card whose `day.day === 1`, split its original entries with
`isLocationVisible(entry, raids.attemptsLeftByBattle)` into actionable
entries (predicate true) and raided entries (predicate false). Render the
actionable entries through `RaidSchedule` as today, then, when there are
raided entries, a "Raided" divider followed by the raided entries rendered
with the same material emphasis, density and card presentation. Partitioning
before grouping naturally omits empty resource and goal groups in each
section without changing shared card markup or Today's behavior. Do not
mutate the original schedule. Prefer this page-level derivation over a new
shared presentation prop because only Raids Plan needs it.

The predicate remains owned by the `features/daily-raids` slice and is
consumed through its existing public API. Reuse it rather than duplicating
the zero-attempt rule. A missing map entry counts as actionable: unknown does
not mean exhausted.

**Future days always receive their original entries.** Today's attempt map
is keyed by battle ID, not by day. Applying it to Day 2+ would separate
matching battle IDs incorrectly; it would not be inert. Cover the same battle
in Day 1 and a later day in regression tests. Future-day simulated caps are
not evidence of real exhaustion.

**Keep one canonical calculation result.** Day and whole-plan totals,
energy, duration, and other summaries continue to use the original plan
result. Only the Day-1 display is split; do not recalculate the plan, select
replacement locations, or alter the relative order of entries within each
section.

**Divider matches V1.** A centered "Raided" label on a horizontal rule
between the sections, translated in all four locales. Show it only when there
is at least one raided entry. When every Day-1 entry is raided, show only the
Raided section under the retained day card and original summary; do not
present this as goal completion or an empty plan. An originally empty day
retains its existing behavior.

**Always on, derived per render.** No local state, persisted preference, or
shared Today/Raids Plan state. Derive both sections from the current attempt
map each render so refreshed progress moves nodes between sections without
caching a stale list.

## Risks / Trade-offs

- [Day 2+ never shows a Raided section, which may look inconsistent with
  Day 1] → Mitigation: the section only exists where real attempt data
  exists; test repeated battle IDs across days so future days are provably
  unaffected.
- [Raided nodes lengthen the Day 1 column compared to hiding them] →
  Mitigation: this is the V1 behavior the user asked for; they sit below the
  actionable nodes so the actionable list stays first.
- [The split is mistaken for complete DAILY-06/V1 parity] → Mitigation:
  retain the proposal's documented scope boundary; no assertions about unlock
  state or full actionability follow from a nonzero or unknown attempt count.
