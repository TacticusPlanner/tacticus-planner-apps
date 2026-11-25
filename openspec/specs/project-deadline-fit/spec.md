# project-deadline-fit Specification

## Purpose

TBD - created by archiving change add-project-deadline-fit. Update Purpose after archive.

## Requirements

### Requirement: Each eligible goal shows whether it fits the project deadline

On Goals scoped to a project whose target has a deadline that has not passed, each eligible goal (Season fit's rule) SHALL show "Fits", "During event" or "Misses by N d" beside Done By. Its completion instant is 00:00 UTC on Done By + 1 day. It fits at or before the run's start, is "During event" at or before the run's end, and otherwise misses by N = ceil((completion − end) / 1 day).

- Assumption: Done By is the global-plan date, in UTC calendar days, anchored to each goal's target.

#### Scenario: Legendary Event next run, worked example

- **GIVEN** a project targets the Legendary Event Uthar with no run, and Uthar's next run starts 2026-11-27T00:00Z and ends 2026-12-04T00:00Z, so the deadline is 2026-11-27T00:00Z
- **AND** its Active goals in priority order are Ragnar Rank (Done By Nov 26), Kharn Ascension (Done By Nov 27) and Calgar Rank (Done By Dec 10)
- **WHEN** the fits are computed
- **THEN** the completion instants are 2026-11-27T00:00Z, 2026-11-28T00:00Z and 2026-12-11T00:00Z
- **AND** Ragnar fits (its completion instant equals the deadline)
- **AND** Kharn finishes during the run, shown "During event"
- **AND** Calgar misses the run's end by ceil(7 d / 1 d) = 7, shown "Misses by 7 d"

### Requirement: Fit labels carry an accent

A fitting goal SHALL carry the on-track accent. A goal that finishes during the run SHALL carry the caution accent, and one that misses the run's end the urgent accent. These are the Season fit tokens, with the same contrast targets (`goal-visual-accessibility`). The text label is always shown, so colour never carries the meaning alone. Table rows and cards (desktop Cards view and mobile) SHALL show the same label and accent.

#### Scenario: Accents for the worked example

- **WHEN** the Uthar project's goals render
- **THEN** Ragnar has the on-track accent, Kharn the caution accent and Calgar the urgent accent

### Requirement: A header summarizes the project deadline

The targeted scope SHALL show a header: "Deadline: <chip> runs <start> – <end> · <fit> of <total> fit". Total counts the eligible goals plus Reached and Completed goals, which count as fitting. It SHALL add "· N during the event" for eligible goals finishing during the run and "· N not estimated" for Active or Paused goals that are not eligible. When every counted goal is Reached or Completed, it SHALL read "All N done".

#### Scenario: Counts with a reached and a paused goal

- **GIVEN** the Uthar project also holds a Reached Abaddon Rank goal and a Paused Trajann Ascension goal
- **WHEN** the header renders
- **THEN** it reads "Deadline: LE · Uthar runs Nov 27 – Dec 4 · 2 of 4 fit · 1 during the event · 1 not estimated"

### Requirement: Dividers mark the run's start and end

With Group None, the list SHALL render a start divider before the first eligible goal in display order that does not fit, and an end divider before the first that misses the run's end. When both fall on the same goal, only the end divider SHALL render. There SHALL be no divider when every goal fits or when grouped. Dividers SHALL NOT be draggable or selectable, and SHALL render in each view as Season fit's divider does.

#### Scenario: Divider placement

- **WHEN** the Uthar project's goals render with Group None
- **THEN** the start divider sits between Ragnar and Kharn and reads "LE · Uthar starts Nov 27. The next goal finishes during the event."
- **AND** the end divider sits between Kharn and Calgar and reads "LE · Uthar ends Dec 4. The next goal finishes after it."

### Requirement: An ended or unavailable deadline shows no fits

When the target is ended, the header SHALL read "<chip> · Ended <date>" with Move to next season or Move to next run where `project-deadline` offers it, and no goal SHALL show a fit label, accent or divider. While the deadline or estimates load, the header SHALL show a one-line skeleton and no labels. When the deadline is unavailable, the header SHALL read "<chip> · No date available" and no labels show.

#### Scenario: Ended season

- **GIVEN** a project targets Battle Pass season 41 and now is 2026-11-03
- **WHEN** its scoped Goals page renders
- **THEN** the header reads "BP · S41 · Ended Oct 11" with Move to next season, and no goal has a fit label

### Requirement: Targeted project cards show the fit count

On the Projects page and in the home widget, the card of a non-archived project with a resolvable, not-ended target SHALL show "<fit> of <total> fit" (or "All N done") beside its chip, computed by the same rule as the header from the one global-plan run, followed by "· N not estimated" when any goal is not estimated, so "0 of 0 fit" never hides an unestimated goal. Untargeted and ended projects show no count. While the run loads the count is a skeleton; when it fails the count is hidden.

#### Scenario: Card count

- **WHEN** the Projects page renders the Uthar project
- **THEN** its card shows the "LE · Uthar" deadline chip and "2 of 4 fit"

#### Scenario: Unestimated goals stay visible

- **GIVEN** a targeted project whose only goal can't be estimated (an unlock that comes from shops)
- **WHEN** its card renders
- **THEN** it shows "0 of 0 fit · 1 not estimated"

### Requirement: The unscoped Goals page shows no project fits

The unscoped Goals page (`/plan/goals` without `?project=`) and untargeted project scopes SHALL show no project deadline fit, header or divider. Season fit behaves there as `goal-season-fit` defines.

#### Scenario: Unscoped list

- **WHEN** the user opens `/plan/goals` with Season fit Off
- **THEN** no fit label, accent, header or divider renders
