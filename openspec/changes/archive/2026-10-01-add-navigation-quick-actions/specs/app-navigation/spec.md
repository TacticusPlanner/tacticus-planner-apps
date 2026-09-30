## ADDED Requirements

### Requirement: Navigation search includes quick actions on desktop and mobile

Desktop navigation search and mobile Menu search SHALL include a Quick actions group before Pages. The action order SHALL be Create Goal, Create Project, Sync with Tacticus, Submit Feedback, and Tour this page, subject to eligibility. Each action SHALL show an icon, localized label, and short description, with button semantics distinct from page links. An empty query SHALL show all eligible actions and the existing route hierarchy. Queries SHALL match trimmed case-insensitive substrings of localized action labels/descriptions and supported keywords; API SHALL match sync. Page search SHALL retain its existing label/description matching, hierarchy, and route behavior. Empty groups SHALL be omitted, and no-results feedback SHALL appear only when both groups have no matches.

#### Scenario: Desktop search includes actions

- **WHEN** a signed-in desktop user opens top-bar search or presses Ctrl/Cmd+K on a page with a tour
- **THEN** all five actions appear before Pages with the search input focused

#### Scenario: Mobile Menu includes actions

- **WHEN** a signed-in mobile user opens Menu on a page with a tour
- **THEN** the same five actions appear before the existing route tree and are searchable in the drawer's search field

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

### Requirement: Quick actions follow current availability

Create Goal, Create Project, and Sync with Tacticus SHALL be hidden for signed-out users. Feedback SHALL be available to signed-in and anonymous users when the widget is ready, otherwise visible but disabled with an unavailable explanation. Tour this page SHALL be hidden without a registered page tour and disabled with an explanation while a tour is running. Sync SHALL remain visible but disabled while syncing and expose current progress/status. Eligibility SHALL be checked again at activation; stale results MUST NOT bypass authentication or running-state guards. Disabled actions SHALL NOT close search or execute.

#### Scenario: Guest search

- **WHEN** an anonymous Library user opens search
- **THEN** creation/sync actions are absent, feedback is present, and page tour appears only if that page has a tour

#### Scenario: Sync in progress

- **WHEN** a sync is running while search is open
- **THEN** its matching action is disabled with status and cannot start another sync

#### Scenario: Page without a tour

- **WHEN** search is opened on a page without registered tour steps
- **THEN** Tour this page is absent and is not replaced by the general app tour

#### Scenario: Running tour

- **WHEN** a tour is already running
- **THEN** Tour this page is disabled and cannot start a second tour

#### Scenario: Session changes while search is open

- **WHEN** authentication is lost before a creation or sync action is dispatched
- **THEN** the action does not execute and its eligibility is updated

#### Scenario: Widget unavailable

- **WHEN** the feedback widget is not ready or is blocked from loading
- **THEN** Submit Feedback remains discoverable but disabled with an explanation instead of closing search and silently doing nothing

### Requirement: Quick actions launch existing flows without changing page context

Activating an enabled action SHALL close and reset search before launching its target exactly once. It SHALL preserve the current route and page state, except for navigation inherently required by existing authentication recovery. Create Goal SHALL use the current global creation behavior, including active Goals project scope/defaults. Create Project SHALL open a blank project form on the current page and use existing validation, persistence, feedback, and cache refresh behavior. Successful project creation SHALL close its form without navigation; cancellation SHALL not create a project. Sync SHALL invoke the existing sync operation with existing retry/reauthentication behavior. Submit Feedback SHALL open the existing widget without posting feedback. Tour this page SHALL start the current page's registered tour, not the general app tour. Opening search or typing SHALL execute nothing.

#### Scenario: Goal creation retains project scope

- **GIVEN** a signed-in user is viewing Goals scoped to a project
- **WHEN** they choose Create Goal in search
- **THEN** the normal creation form opens with the same project preselection as the global Create Goal button and no goal is saved automatically

#### Scenario: Project creation from another page

- **WHEN** a signed-in user chooses Create Project from Library search
- **THEN** a blank project form opens over Library, and saving creates the project and refreshes project data without navigating away

#### Scenario: No projects or failed list query

- **WHEN** a signed-in user launches Create Project with no projects or while the project list has failed to load
- **THEN** the blank form remains available; save failures retain the form and entered values for retry using existing error handling

#### Scenario: Cancel creation

- **WHEN** the user cancels a quick-action creation form
- **THEN** no record is created and the underlying page remains in its previous state

#### Scenario: Feedback requires separate submission

- **WHEN** Submit Feedback is selected
- **THEN** the widget opens and the user must compose and submit feedback themselves

#### Scenario: Start the current page tour

- **WHEN** Tour this page is selected
- **THEN** search closes before the first page-tour step starts and the search overlay does not obscure or intercept its targets

#### Scenario: Sync uses existing behavior

- **WHEN** Sync with Tacticus is selected while enabled
- **THEN** exactly one existing sync begins, with its existing progress, failure, retry, and reauthentication behavior

### Requirement: Search action handoff is accessible on both platforms

Action buttons SHALL support keyboard focus and Enter/Space activation, and mobile touch. Typing or pressing Enter while only the search input is focused SHALL NOT automatically run an action. The search modal SHALL release focus/pointer restrictions before another form/widget/tour opens. Search cancellation SHALL restore focus to its launcher; launched forms SHALL receive focus and return it to the originating search launcher on close when still present. Sync SHALL return focus to the launcher while existing status reports progress. Reopening search SHALL start with an empty query.

#### Scenario: Desktop keyboard activation

- **WHEN** a user opens search with Ctrl/Cmd+K, tabs to Create Project, and presses Enter
- **THEN** search closes and focus enters one project form with no remaining search focus trap

#### Scenario: Mobile action with keyboard visible

- **WHEN** a mobile user filters Menu results with the on-screen keyboard and taps Create Goal
- **THEN** the drawer and keyboard dismiss before the creation surface becomes interactive, and its controls respond to the first tap

#### Scenario: Search is passive until selection

- **WHEN** a user types sync and presses Enter while focus stays in the search input
- **THEN** no sync starts until the action button is explicitly activated

#### Scenario: Repeated activation is not replayed

- **WHEN** an action is activated and the search surface closes or rerenders
- **THEN** it is dispatched only once, without duplicate forms or operations

#### Scenario: Search cancellation and reopening

- **WHEN** a user dismisses search with Escape or Close and later reopens it
- **THEN** focus first returns to the launcher and the reopened search query is empty
