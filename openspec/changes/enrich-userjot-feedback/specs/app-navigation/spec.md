## MODIFIED Requirements

### Requirement: Navigation search includes quick actions on desktop and mobile

Desktop navigation search and mobile Menu search SHALL include a Quick actions group before Pages. The action order SHALL be Create Goal, Create Project, Sync with Tacticus, Submit Feedback, Report a bug, and Tour this page, subject to eligibility. Report a bug opens the widget's submit form (see `userjot-widget`) and also matches bug, problem, issue, broken and error. Each action SHALL show an icon, localized label, and short description, with button semantics distinct from page links. An empty query SHALL show all eligible actions and the existing route hierarchy. Queries SHALL match trimmed case-insensitive substrings of localized action labels/descriptions and supported keywords; API SHALL match sync. Page search SHALL retain its existing label/description matching, hierarchy, and route behavior. Empty groups SHALL be omitted, and no-results feedback SHALL appear only when both groups have no matches.

#### Scenario: Desktop search includes actions

- **WHEN** a signed-in desktop user opens top-bar search or presses Ctrl/Cmd+K on a page with a tour
- **THEN** all six actions appear before Pages with the search input focused

#### Scenario: Mobile Menu includes actions

- **WHEN** a signed-in mobile user opens Menu on a page with a tour
- **THEN** the same six actions appear before the existing route tree and are searchable in the drawer's search field

#### Scenario: Query matches actions and pages independently

- **WHEN** a user searches for project
- **THEN** matching Create Project and project-related page results appear in separate labeled groups

#### Scenario: Sync is discoverable by API

- **WHEN** a signed-in user searches for API with surrounding whitespace or different letter case
- **THEN** Sync with Tacticus appears

#### Scenario: No matching results

- **WHEN** no eligible action or page matches a query
- **THEN** one localized no-results message appears without empty group headings

#### Scenario: Localized search

- **WHEN** the active language changes
- **THEN** action labels, descriptions, group names, disabled explanations, and search matching use that language
