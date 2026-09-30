## MODIFIED Requirements

### Requirement: The projected completion date is shown formatted, labeled, and with its exclusions

Every surface showing a project's projected completion date — the Insights
summary and the projects list row — SHALL render it with the same localized
short-date formatting the Goals list uses for a goal's Done By date, including
that list's UTC-safe parsing, rather than the estimate's raw `YYYY-MM-DD` value.
That formatting SHALL be shared rather than reimplemented per surface, and SHALL
live where a feature-layer surface can consume it without importing from a page.

When any of the project's goals are excluded from the date, the excluded count
SHALL be shown wherever the date would be shown, whether or not a date is
present; a date SHALL NOT appear on its own when the count is above zero.

When no date can be reported, the Insights summary SHALL show its existing
unknown placeholder alongside the exclusion information. The projects list row
SHALL omit the date entirely and show the exclusion information alone — it
carries no placeholder today and gains none, because a lone dash beside its
inline reached/blocked counts reads as a broken value rather than an absent one.

The projects list SHALL show this date only for the project whose insights are
current; other project rows SHALL show no date and no placeholder implying one
is missing. The Goals page, scoped to a project or not, SHALL NOT render a
project-level completion date.

#### Scenario: Formatting matches the goal rows

- **GIVEN** a project whose latest estimable goal completes on October 11
- **WHEN** the Insights summary and the projects list row render the projected
  completion date
- **THEN** each shows the same localized short date that goal's own row shows,
  not a raw `2026-10-11`

#### Scenario: Exclusions travel with the date

- **GIVEN** a project with one Blocked goal and a date derived from the rest
- **WHEN** either surface renders that date
- **THEN** it also states that one goal is excluded from it

#### Scenario: Nothing estimable, on Insights

- **GIVEN** a project whose every goal is Blocked
- **WHEN** the Insights summary renders
- **THEN** it shows the unknown placeholder together with the exclusion
  information, and no date

#### Scenario: Nothing estimable, on the project surfaces

- **GIVEN** the same project
- **WHEN** the projects list row renders
- **THEN** it shows the exclusion information with no date line and no
  placeholder in its place

#### Scenario: A non-current project row

- **GIVEN** the projects list, with one project's insights current
- **WHEN** the rows render
- **THEN** only the current project's row shows a projected completion date, and
  the others show neither a date nor a placeholder for one

#### Scenario: Scoped Goals carries no project date

- **WHEN** the Goals page renders scoped to a project
- **THEN** no project-level completion date or exclusion count is rendered above or beside the list
