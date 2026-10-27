# goal-season-fit Specification

## Purpose

Lets the Goals page show, for a chosen season type (Battle Pass, Guild Raid or Guild War), how many season boundaries each eligible goal's estimated completion falls beyond, using season windows from the events catalog, and marks the season cut-off with a divider.

## Requirements

### Requirement: Season fit is a Goals view option

The Goals page SHALL offer a **Season fit** select with the options Off, Battle Pass, Guild Raid and Guild War, defaulting to Off. The choice SHALL be persisted per browser and SHALL survive navigating away and a reload. The same choice SHALL apply on the unscoped Goals page and when Goals is scoped to a project (`?project=`); changing scope SHALL NOT reset it. It SHALL NOT be URL state and SHALL NOT affect Dailies, Schedule or Insights.

On desktop the select SHALL sit in the filters row after the Type and Group filters. On mobile it SHALL sit in the second control row as an icon-only trigger with an accessible name, like the other compressed filters.

#### Scenario: Choice survives reload and scope change

- **GIVEN** the user set Season fit to Battle Pass on `/plan/goals`
- **WHEN** they open a project's goals (`/plan/goals?project={id}`) and then reload
- **THEN** Season fit still reads Battle Pass and the project's goals show fit labels

#### Scenario: Off shows nothing

- **WHEN** Season fit is Off
- **THEN** no fit label, accent or divider is rendered and the list matches today's Goals page

#### Scenario: Mobile control

- **WHEN** the Goals page renders below 768px
- **THEN** the Season fit trigger is an icon button named "Season fit" in the second control row, and choosing a mode from it updates the cards

### Requirement: Season windows come from the events catalog

For a mode, the client SHALL resolve the season's **cycle starts** from the catalog definition of that type (`BattlePass`, `GuildRaidSeason`, `GuildWarSeason`):

- A `Fixed` definition SHALL be projected from `anchorUtc + k * intervalDays` for any `k`, not limited to the calendar's 15-week projection window. An authored `events-calendar` occurrence of that definition SHALL replace the projected start of the slot it falls in (its start within half an interval of the projected start).
- A non-`Fixed` definition SHALL use authored occurrences only: the occurrence covering now gives the current season, its `endUtc` is the first boundary, and later authored starts are the following boundaries.

The **current season** is the cycle containing now. Its **deadline** is the next cycle start (for `Fixed`) or the current occurrence's `endUtc` (non-`Fixed`). For Guild War the deadline is therefore the start of the next Guild War season, so "this season" means "ready before the next war season starts". A season number SHALL be shown when the definition's config carries `seasonNumberAtAnchor` (number = `seasonNumberAtAnchor + k`) or the occurrence carries a `season` parameter; otherwise it is omitted.

A mode whose definition is missing, or yields no current season, SHALL be disabled in the select with the reason "No season dates available yet". While the catalog loads, and on a catalog read failure, the season modes SHALL be disabled without a reason and Season fit SHALL behave as Off (Off stays selectable).

Assumptions:

- Assumption: season boundaries are UTC instants from the catalog; the game's seasons start at 00:00 UTC on their start day (current catalog data).
- Assumption: `battle-pass` is `Fixed` with `intervalDays` 35, anchor 2026-08-02T00:00Z, `seasonNumberAtAnchor` 40; `guild-war-season` is `Fixed` with `intervalDays` 35, anchor 2026-08-15T00:00Z, `seasonNumberAtAnchor` 26 (catalog as of 27 Oct 2026).
- Assumption: Guild Raid mode is available only once `guild-raid-season` is `Fixed` or has an authored current occurrence (see proposal Impact).

#### Scenario: Battle Pass windows, worked example

- **GIVEN** now is 2026-10-27T12:00Z and `battle-pass` is `Fixed` (anchor 2026-08-02T00:00Z, 35 days, season 40 at anchor)
- **WHEN** windows are resolved
- **THEN** k = floor((Oct 27 - Aug 2) / 35 days) = floor(86.5 / 35) = 2, so the current cycle starts 2026-08-02 + 70 days = 2026-10-11T00:00Z (season 40 + 2 = 42), the deadline is 2026-11-15T00:00Z, and the following starts are 2026-12-20T00:00Z and 2027-01-24T00:00Z

#### Scenario: Guild War windows use the authored occurrence

- **GIVEN** now is 2026-10-27T12:00Z, `guild-war-season` is `Fixed` (anchor 2026-08-15T00:00Z, 35 days, season 26 at anchor) and the authored occurrence `guild-war-season` season 28 runs 2026-10-24T00:00Z to 2026-11-08T00:00Z
- **WHEN** windows are resolved
- **THEN** the projected slot start 2026-10-24T00:00Z (k = 2) is replaced by the authored start (the same instant), the current season is 28, and the deadline is the next start 2026-11-28T00:00Z (season 29)

#### Scenario: Mode without season dates is disabled

- **GIVEN** `guild-raid-season` has recurrence `None` and no authored occurrence covers now
- **WHEN** the user opens the Season fit select
- **THEN** Guild Raid is disabled with "No season dates available yet" and Battle Pass and Guild War are selectable

### Requirement: Each eligible goal shows its season fit

With a mode on, a goal SHALL be **eligible** when it is Active, not Reached, not an Ability goal, and has a successful estimate with a Done By date. For an eligible goal the client SHALL compute its **completion instant** as the start of the day after its Done By date (00:00 UTC of Done By + 1 day), because Done By is an inclusive day. Its **offset** SHALL be the number of cycle boundaries strictly before the completion instant, counting from the current deadline: 0 when completion is at or before the deadline, 1 when at or before the next boundary, 2 for the one after, 3 or more otherwise. When fewer boundaries are known than the offset needs (non-`Fixed` definitions), an instant past the last known boundary SHALL count as 3 or more.

The offset SHALL be shown as a label beside the Done By date: 0 "This season", 1 "Next season", 2 "In 2 seasons", 3+ "Later". The label's tooltip SHALL name the deadline, e.g. "Done by Nov 14, before Battle Pass season 42 ends on Nov 15" (Battle Pass, Guild Raid) or "Done by Nov 3, before Guild War season 29 starts on Nov 28" (Guild War). The row (desktop) or card (mobile) SHALL also carry a left accent in the offset's colour (on track, caution, urgent, none for 3+). The label text SHALL meet the 4.5:1 contrast target and the accent 3:1 against its background in both themes (`goal-visual-accessibility`). Desktop and mobile SHALL show the same label and accent.

Ineligible goals (Ability, Paused, Reached, Blocked, unestimated) SHALL show no label and no accent; their existing Done By content is unchanged. The fit SHALL use the global-plan Done By date in project scope too, matching the Done By cell there.

Assumptions:

- Assumption: Done By already combines material and XP days and uses inclusive Day-1 semantics (`goal-farming-estimates`), so the fit agrees with the date the user sees.
- Assumption: a goal finishing on the deadline's own day before the reset is counted as the next season; the rule is deliberately conservative.

#### Scenario: Battle Pass fit, worked example

- **GIVEN** now is 2026-10-27T12:00Z, mode Battle Pass (deadline 2026-11-15T00:00Z, then 2026-12-20T00:00Z, 2027-01-24T00:00Z)
- **AND** four Active Rank goals with Done By 2026-11-14, 2026-11-15, 2026-12-25 and 2027-02-01
- **WHEN** fits are computed
- **THEN** their completion instants are 2026-11-15T00:00Z, 2026-11-16T00:00Z, 2026-12-26T00:00Z and 2027-02-02T00:00Z
- **AND** their offsets are 0 (at the deadline), 1 (after Nov 15, before Dec 20), 2 (after Dec 20, before Jan 24) and 3
- **AND** their labels read "This season", "Next season", "In 2 seasons" and "Later"

#### Scenario: Ability goals are ignored

- **WHEN** mode is Guild War and an Active Ability goal has Done By 2026-11-01
- **THEN** that goal shows no label and no accent

#### Scenario: Blocked goal

- **WHEN** an Active Rank goal's estimate is Blocked
- **THEN** it shows its blocked indicator as today and no fit label or accent

### Requirement: A divider marks the season cut-off

With a mode on and Group set to None, the list SHALL render a divider immediately before the first eligible goal in display order (account-wide priority order) whose offset is 1 or more. The divider SHALL read "{season} ends {date}. The next goal finishes later." for Battle Pass and Guild Raid, and "{season} starts {date}. The next goal finishes after it." for Guild War, where {season} includes the season number when known. When every eligible goal has offset 0 there SHALL be no divider. When no goal is eligible there SHALL be no divider. With Group set to Type or Unit there SHALL be no divider (labels and accents still show). The divider SHALL NOT be draggable or selectable and SHALL NOT change the priority order or the drag targets; during a drag it stays where it was and moves after the drop.

On desktop the divider SHALL be a full-width table row spanning every column. On mobile it SHALL be a list item between cards, and SHALL also appear in mobile reorder mode.

#### Scenario: Divider before the first spilling goal

- **GIVEN** mode Battle Pass, Group None, and Active goals in priority order A (This season), B (This season), C (Next season), D (This season)
- **WHEN** the list renders
- **THEN** a divider reading "Battle Pass season 42 ends Nov 15. The next goal finishes later." sits between B and C, and D keeps its "This season" label below it

#### Scenario: Project scope

- **GIVEN** mode Battle Pass and Goals scoped to project "Season 42 push"
- **WHEN** the list renders
- **THEN** the divider is placed among that project's goals by the same rule, using their global-plan Done By dates

#### Scenario: Grouped list

- **WHEN** Group is Type
- **THEN** no divider renders and each eligible row still shows its label and accent

#### Scenario: Mobile divider

- **WHEN** the same goals render below 768px
- **THEN** the divider is a list item between the B and C cards with the same text
