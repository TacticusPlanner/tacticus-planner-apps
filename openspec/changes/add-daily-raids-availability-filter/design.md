## Context

See `proposal.md` - Why. Relevant existing shape, confirmed by reading the
code:

- `RaidSchedule`'s `emphasis="location"` gates visibility through
  `isLocationVisible(entry, attemptsLeftByBattle)`
  (`location-visibility.ts`), which checks
  `attemptsLeftByBattle.get(entry.battleId) !== 0`.
- `today-page.tsx` hardcodes `emphasis="location"` and passes
  `raids.attemptsLeftByBattle` — no toggle, no opt-out. This is not just
  implementation default: `daily-raids-today`'s own spec requirement 4
  states the exclusion with a hard SHALL ("A node whose real synced
  attempts today have reached zero remaining... SHALL be excluded"). This
  proposal does not touch that requirement or that page.
- `raids-plan-page.tsx` never passes `emphasis` (defaults to `"material"`)
  or `attemptsLeftByBattle` (defaults to an empty map) to any of its
  `RaidSchedule` calls — nothing is ever hidden there today, for any day.
- `attemptsLeftByBattle` is a single top-level field on
  `DailyRaidsViewModel` (`use-daily-raids.ts`), built from
  `live-progress.battleAttempts` — i.e. today's real synced attempt state.
  It has no per-day equivalent: `daily-raids.domain.ts` confirms `today`
  and `planDays[0]` are the same object
  (`daily-raids-calc.test.ts:1005`), and `daily-raids-plan`'s own spec
  only ever talks about the simulated engine's per-day attempt caps for
  Day 2 onward — never about real synced attempts-left. There is no data
  source this toggle could filter Day 2+ against.

## Goals / Non-Goals

**Goals:**

- Give Raids Plan the same "hide exhausted nodes" capability Today already
  has, as an explicit, user-controlled, off-by-default toggle — the
  concrete gap DAILY-06 identifies.

**Non-Goals:**

- Not adding an opt-out to Today's existing unconditional hiding. Its
  behavior is already a committed spec requirement (`daily-raids-today`),
  and DAILY-06's own acceptance criteria call for preserving existing
  workflow — changing an established default is a bigger, separate
  product decision this issue doesn't ask for.
- Not attempting to filter Day 2+ by availability. There is no real
  synced-attempts data for future days to filter against (see Context) —
  building one would mean inventing a new "projected exhaustion" concept
  nothing in this codebase currently models, well beyond DAILY-06's scope.
- No shared/global toggle state between Today and Raids Plan. They already
  share project selection (`daily-raids-plan` spec), but this toggle only
  has meaning on Raids Plan (Today has no equivalent control to sync
  with), so it's local `useState` on `RaidsPlanPage`, matching
  `showAllDays`/`compact`'s existing pattern in the same file.

## Decisions

**Toggle only the Day 1 `RaidSchedule` call, not all day columns.** Pass
`emphasis={showOnlyAvailable ? "location" : "material"}` and
`attemptsLeftByBattle={raids.attemptsLeftByBattle}` only to the day whose
`day.day === 1` card; every other day card keeps its current call
unchanged (no `emphasis`, no `attemptsLeftByBattle`). Passing the same
props to Day 2+ would be silently inert today (no per-day attempts-left
map exists, so nothing would ever be filtered) — better to make the
Day-1-only scope explicit in the component than rely on that being a
no-op by accident.

**Toggle lives in the whole-plan summary row**, next to "Show all days"
and the density toggle, mirroring the density toggle's own icon +
`{isMobile ? null : label}` pattern (`plan-density-toggle`,
`raids-plan-page.tsx`). Follows the file's own established convention
rather than introducing a new placement.

**Off by default.** Directly satisfies DAILY-06's "preserve the existing
workflow for users who do not use the new capability" acceptance
criterion for Raids Plan specifically: a user who never touches the
toggle sees exactly what they see today.

## Risks / Trade-offs

- [A user might expect the toggle to also filter Day 2+, given it sits in
  a whole-plan summary area that otherwise controls all days uniformly
  (density, "Show all days")] → Mitigation: the toggle's label and this
  change's tasks include verifying the Day-1-only scope is visually clear
  (e.g. no false impression that Day 2+ nodes are being evaluated and
  found available). If real user confusion surfaces after shipping, a
  follow-up can revisit copy — but there is no data to correctly filter
  Day 2+ against today, so scope cannot expand without also inventing that
  data source.
