# project-deadline Specification

## ADDED Requirements

### Requirement: A project can target a season or a date

A non-Default project's target SHALL also be `{ kind: "battlePass" | "guildRaidSeason" | "guildWarSeason", season }`, where `season` is a positive season number (pinned) or null (rolling), or `{ kind: "customDate", date }` with a calendar date `YYYY-MM-DD` and no time. The Related to field's Date detail SHALL be a date field with no time.

#### Scenario: Rolling Battle Pass

- **WHEN** the user picks Battle Pass and keeps Current season (rolling)
- **THEN** the call carries `target { kind "battlePass", season null }`

#### Scenario: Custom date

- **WHEN** the user picks Date and enters Nov 20, 2026
- **THEN** the call carries `target { kind "customDate", date "2026-11-20" }`

### Requirement: The season detail lists rolling first, then the next 5 seasons

For a season kind, the Related to detail SHALL list **Current season (rolling)** first (for Guild War: **Next season (rolling)**), then the next 5 seasons whose deadline is after now, each as "S<number> · ends <date>" (Battle Pass, Guild Raid) or "S<number> · starts <date>" (Guild War).

- Assumption: season numbers come from the definition's `config.seasonNumberAtAnchor` (catalog values in the design).

#### Scenario: Pin a Guild War season

- **GIVEN** now is 2026-11-03T22:00Z
- **WHEN** the user picks Guild War and opens the detail
- **THEN** it lists "Next season (rolling)", then "S29 · starts Nov 27", "S30 · starts Jan 1", "S31 · starts Feb 5", "S32 · starts Mar 12" and "S33 · starts Apr 16"
- **AND** choosing S29 saves `target { kind "guildWarSeason", season 29 }`

### Requirement: Season kinds without dates are disabled

A season kind whose catalog definition is missing, or is not `Fixed` and has no authored current occurrence, SHALL be disabled in the kind step with the reason "No season dates available yet". While the catalog loads, the season kinds SHALL be disabled without a reason, and None, Legendary Event and Date stay selectable.

#### Scenario: Catalog loading

- **WHEN** the project form opens before the event definitions have loaded
- **THEN** Battle Pass, Guild Raid and Guild War are disabled and Date is selectable

### Requirement: Season starts are projected from the catalog

The client SHALL compute season S's start as `anchorUtc + (S − seasonNumberAtAnchor) × intervalDays` (UTC). An authored calendar occurrence of that definition SHALL replace the projected start of the slot it falls in, as in `goal-season-fit`.

#### Scenario: Authored start wins

- **GIVEN** `guild-war-season` projects season 29 at 2026-11-27T09:00Z and an authored occurrence of season 29 starts 2026-11-28T09:00Z
- **WHEN** season 29's start is computed
- **THEN** it is 2026-11-28T09:00Z

### Requirement: Season targets resolve to a season boundary

The client SHALL resolve a season target to one UTC instant. For Battle Pass and Guild Raid, season S's deadline is the start of season S+1 (the end of S), and rolling means the season containing now. For Guild War, season S's deadline is the start of season S, and rolling means the first season start after now.

#### Scenario: Battle Pass, rolling, worked example

- **GIVEN** now is 2026-11-03T22:00Z and `battle-pass` is `Fixed` (anchor 2026-08-02T00:00Z, 35 days, season 40 at anchor)
- **WHEN** a rolling Battle Pass target is resolved
- **THEN** days since anchor = 93.9, k = floor(93.9 / 35) = 2, the season is 40 + 2 = 42, which started 2026-08-02 + 70 days = 2026-10-11T00:00Z
- **AND** the deadline is the start of season 43 = 2026-10-11 + 35 days = 2026-11-15T00:00Z

#### Scenario: Guild Raid, pinned, worked example

- **GIVEN** `guild-raid-season` is `Fixed` (anchor 2026-10-21T10:00Z, 14 days, season 112 at anchor)
- **WHEN** a Guild Raid target with season 113 is resolved
- **THEN** season 113 starts 2026-10-21T10:00Z + (113 − 112) × 14 days = 2026-11-04T10:00Z
- **AND** the deadline is the start of season 114 = 2026-10-21T10:00Z + 2 × 14 days = 2026-11-18T10:00Z

#### Scenario: Guild War, pinned and rolling, worked example

- **GIVEN** now is 2026-11-03T22:00Z and `guild-war-season` is `Fixed` (anchor 2026-10-23T09:00Z, 35 days, season 28 at anchor)
- **WHEN** a Guild War target with season 29 is resolved
- **THEN** the deadline is 2026-10-23T09:00Z + (29 − 28) × 35 days = 2026-11-27T09:00Z
- **AND** a rolling Guild War target resolves to the same instant, because season 28's start (2026-10-23T09:00Z) is before now and season 29's is the first start after now

### Requirement: Legendary Event and date targets resolve to a run start or the next day

A Legendary Event target with run N SHALL resolve to run N's start. When the run is unannounced, it SHALL use the earliest estimate (`legendary-event-run-date-estimate`) and be marked estimated. A Next run target SHALL resolve to the first run whose start is after now. A date target D SHALL resolve to 00:00 UTC on the day after D, so a goal done on D fits.

#### Scenario: Legendary Event run

- **GIVEN** the catalog announces `lostaBile` run 1 at 2026-11-08T00:00Z
- **WHEN** a target `{ eventId "lostaBile", run 1 }` is resolved
- **THEN** the deadline is 2026-11-08T00:00Z and it is not estimated

#### Scenario: Custom date

- **WHEN** a target `{ kind "customDate", date "2026-11-20" }` is resolved
- **THEN** the deadline is 2026-11-21T00:00Z

### Requirement: Unresolvable targets are unavailable

While the catalog loads, a target's deadline SHALL be loading. A target whose definition or event the catalog does not serve, or whose Legendary Event run has no start, SHALL resolve to unavailable. Its chip SHALL show its kind and season number or event id without a date or tooltip.

#### Scenario: Event left the catalog

- **GIVEN** a project targets run 2 of an event the catalog no longer serves
- **WHEN** the Projects page renders
- **THEN** the chip shows "LE · <eventId> R2" without a link or date

### Requirement: Target chips name the kind and the resolved season

A project card with a season or date target SHALL show a chip. A pinned season reads "BP · S<n>", "GR · S<n>" or "GW · S<n>". A rolling one reads "BP · S<n> (rolling)" (and GR, GW), where n is the season it resolves to now. A date reads "Due · <date>". The tooltip SHALL name the deadline: "Season 42 ends Nov 15", "Season 29 starts Nov 27", or "Due Nov 20". Season and date chips SHALL NOT be links.

#### Scenario: Rolling chip

- **GIVEN** now is 2026-11-03T22:00Z
- **WHEN** a project with a rolling Battle Pass target renders
- **THEN** its chip reads "BP · S42 (rolling)" with the tooltip "Season 42 ends Nov 15"

### Requirement: A passed pinned target reads Ended

A target whose deadline is at or before now SHALL be **ended**. That covers a pinned season, a pinned Legendary Event run, a Next run target once run 3 has started, and a past date. A rolling season target is never ended. An ended target's chip SHALL read "<chip> · Ended". A target SHALL never change without a user action.

#### Scenario: Ended date

- **GIVEN** a project targets the date 2026-10-30
- **WHEN** the Projects page renders on 2026-11-03
- **THEN** the chip reads "Due · Oct 30 · Ended"

### Requirement: An ended target offers the next season or run

For an ended season target, or an ended run 1 or run 2 target, the project's row menu on the Projects page SHALL offer **Move to next season** (season S+1) or **Move to next run** (run N+1), which saves that target in one update. An ended run 3, Next run or date target SHALL offer no such action; the user edits the target instead.

#### Scenario: Ended Battle Pass season

- **GIVEN** now is 2026-11-03T22:00Z and a project targets Battle Pass season 41 (deadline 2026-10-11T00:00Z)
- **WHEN** the user opens its row menu and chooses Move to next season
- **THEN** the update saves `target { kind "battlePass", season 42 }` and the chip reads "BP · S42"

#### Scenario: Ended date has no next target

- **GIVEN** a project targets the date 2026-10-30 and today is 2026-11-03
- **WHEN** the user opens its row menu
- **THEN** it offers no Move to next season or Move to next run
