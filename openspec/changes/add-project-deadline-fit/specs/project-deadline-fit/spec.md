# project-deadline-fit Specification

## ADDED Requirements

### Requirement: Each eligible goal shows whether it fits the project deadline

On Goals scoped to a project whose target has a deadline that has not passed, each eligible goal (Season fit's rule: Active, not Reached, not a character Ability goal, estimated) SHALL show "Fits" or "Misses by N d" beside Done By. Its completion instant is 00:00 UTC on Done By + 1 day. It fits when that is at or before the deadline; otherwise N = ceil((completion − deadline) / 1 day).

- Assumption: Done By is the global-plan date, in UTC calendar days, anchored to each goal's target.

#### Scenario: Guild War season 29, worked example

- **GIVEN** a project targets Guild War season 29, whose deadline is 2026-11-27T09:00Z
- **AND** its Active goals in priority order are Ragnar Rank (Done By Nov 26), Kharn Ascension (Done By Nov 27) and Calgar Rank (Done By Dec 10)
- **WHEN** the fits are computed
- **THEN** the completion instants are 2026-11-27T00:00Z, 2026-11-28T00:00Z and 2026-12-11T00:00Z
- **AND** Ragnar fits (00:00 is before 09:00 on Nov 27)
- **AND** Kharn misses by ceil(15 h / 24 h) = 1, shown "Misses by 1 d"
- **AND** Calgar misses by ceil(13 d 15 h / 1 d) = 14, shown "Misses by 14 d"

### Requirement: Fit labels carry an accent

A fitting goal SHALL carry the on-track accent. A goal missing by 1 to 7 days SHALL carry the caution accent, and one missing by more than 7 days the urgent accent. These are the Season fit tokens, with the same contrast targets (`goal-visual-accessibility`). The text label is always shown, so colour never carries the meaning alone. Desktop rows and mobile cards SHALL show the same label and accent.

#### Scenario: Accents for the worked example

- **WHEN** the Guild War season 29 goals render
- **THEN** Ragnar has the on-track accent, Kharn the caution accent and Calgar the urgent accent

### Requirement: A header summarizes the project deadline

The targeted scope SHALL show a header naming the deadline and the count: "Deadline: <chip> <ends|starts> <date> · <fit> of <total> fit". Total counts the eligible goals plus Reached and Completed goals, which count as fitting. When any Active or Paused goal of the project is not eligible (Paused, Blocked, unestimated), the header SHALL add "· N not estimated". When every counted goal is Reached or Completed, it SHALL read "All N done".

#### Scenario: Counts with a reached and a paused goal

- **GIVEN** the Guild War season 29 project also holds a Reached Abaddon Rank goal and a Paused Trajann Ascension goal
- **WHEN** the header renders
- **THEN** it reads "Deadline: GW S29 starts Nov 27 · 2 of 4 fit · 1 not estimated"

### Requirement: A divider marks the first goal that misses

With Group set to None, the list SHALL render a divider just before the first eligible goal in display order that misses, reading "<chip> <ends|starts> <date>. Goals below finish later." There SHALL be no divider when no goal misses or when Group is Type or Unit. The divider SHALL NOT be draggable or selectable, and SHALL appear in mobile reorder mode, as Season fit's divider does.

#### Scenario: Divider placement

- **WHEN** the Guild War season 29 goals render with Group None
- **THEN** the divider sits between Ragnar and Kharn and reads "GW S29 starts Nov 27. Goals below finish later."

### Requirement: An ended or unavailable deadline shows no fits

When the target is ended, the header SHALL read "<chip> · Ended <date>" with Move to next season or Move to next run where `project-deadline` offers it, and no goal SHALL show a fit label, accent or divider. While the deadline or estimates load, the header SHALL show a one-line skeleton and no labels. When the deadline is unavailable, the header SHALL read "<chip> · No date available" and no labels show.

#### Scenario: Ended season

- **GIVEN** a project targets Battle Pass season 41 and now is 2026-11-03
- **WHEN** its scoped Goals page renders
- **THEN** the header reads "BP · S41 · Ended Oct 11" with Move to next season, and no goal has a fit label

### Requirement: Targeted project cards show the fit count

On the Projects page and in the home widget, the card of a non-archived project with a resolvable, not-ended target SHALL show "<fit> of <total> fit" (or "All N done") beside its chip, computed by the same rule as the header from the one global-plan run. Untargeted and ended projects show no count. While the run loads the count is a skeleton; when it fails the count is hidden.

#### Scenario: Card count

- **WHEN** the Projects page renders the Guild War season 29 project
- **THEN** its card shows "GW S29" and "2 of 4 fit"

### Requirement: The unscoped Goals page shows no project fits

The unscoped Goals page (`/plan/goals` without `?project=`) and untargeted project scopes SHALL show no project deadline fit, header or divider. Season fit behaves there as `goal-season-fit` defines.

#### Scenario: Unscoped list

- **WHEN** the user opens `/plan/goals` with Season fit Off
- **THEN** no fit label, accent, header or divider renders
