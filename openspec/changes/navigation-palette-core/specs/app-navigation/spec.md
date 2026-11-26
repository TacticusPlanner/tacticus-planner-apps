## MODIFIED Requirements

### Requirement: Navigation search indexes every route and matches on label or description

Desktop navigation search and the mobile menu drawer's search field SHALL continue to index every route, including a section's child pages, so that child pages remain directly reachable by search even though they are not listed in the desktop sidebar. A trimmed, case-insensitive query SHALL match an item's label, its search keywords, its short description, or the labels of the section and group it sits in. Results SHALL be one flat list ranked by match quality, in this order: the label starts with the query; a word of the label starts with it; a keyword starts with it; a word of the description starts with it; a word of its section or group starts with it; every word of a multi-word query starts some word of the row; the query (three characters or more) appears anywhere in the label or description. Equal matches SHALL keep menu order. Each child page in the results SHALL show its group, else its section, as a muted breadcrumb. With an empty query the grouped route tree SHALL be shown in menu order.

#### Scenario: Searching for a child page's label finds it

- **WHEN** a user types a child page's label (e.g. "Machines of War") into desktop navigation search or the mobile drawer search field
- **THEN** that child page appears in the results and navigating to it goes directly to that child page's route

#### Scenario: Searching for text that only appears in an item's description finds it

- **WHEN** a user types a phrase that matches an item's description but not its label, into desktop navigation search or the mobile drawer search field
- **THEN** that item still appears in the results

#### Scenario: Title matches rank above description matches

- **WHEN** a user searches for "raid"
- **THEN** Raids, Guild Raids and Guild Raid Bosses are listed before pages that mention raids only in their description, such as Teams and Schedule

#### Scenario: Shorthand finds pages

- **WHEN** a user searches for "gw" or "lre"
- **THEN** Guild War Offense, respectively Legendary Events, is the first result

#### Scenario: A section name lists its pages

- **WHEN** a user searches for a section's name (e.g. "Dailies")
- **THEN** the section is the first result and its child pages follow

### Requirement: Menu drawer and navigation search show each item's description

The mobile menu drawer SHALL display a short description beneath every listed item's label, both top-level sections and their child pages. The desktop navigation search dialog SHALL show each row on one line and SHALL show the short description of the highlighted row after its label. The desktop sidebar and the mobile bottom navigation bar are unaffected and continue to show icon and label only, with no description.

#### Scenario: Drawer shows descriptions for top-level and child items

- **WHEN** the mobile menu drawer opens
- **THEN** every listed top-level section, and every child page shown nested beneath a section, displays its short description beneath its label

#### Scenario: Desktop search shows the highlighted row's description

- **WHEN** the desktop navigation search dialog lists results and one row is highlighted
- **THEN** that row shows its short description after its label, and the other rows show their label only

### Requirement: Navigation search includes quick actions on desktop and mobile

Desktop navigation search and mobile Menu search SHALL include a Quick actions group. The action order SHALL be Create Goal, Create Project, Sync with Tacticus, Submit Feedback, Report a bug, and Tour this page, subject to eligibility. Each action SHALL show an icon, localized label, and short description, as an option distinct from page links. An empty query SHALL show all eligible actions before the existing route hierarchy. Queries SHALL match actions with the same ranking as pages (label, keywords, description); API SHALL match sync. Actions and pages SHALL be ranked separately, and the group holding the better match SHALL come first, Quick actions first on a tie. Empty groups SHALL be omitted, and no-results feedback SHALL appear only when both groups have no matches.

#### Scenario: Desktop search includes actions

- **WHEN** a signed-in desktop user opens top-bar search or presses Ctrl/Cmd+K on a page with a tour
- **THEN** all actions appear before Pages with the search input focused

#### Scenario: Mobile Menu includes actions

- **WHEN** a signed-in mobile user opens Menu on a page with a tour
- **THEN** the same actions appear before the existing route tree and are searchable in the drawer's search field

#### Scenario: Query matches actions and pages independently

- **WHEN** a user searches for project
- **THEN** matching Create Project and project-related page results appear in separate labeled groups

#### Scenario: A better page match comes first

- **WHEN** a user searches for "raid" and no action matches as well as a page title
- **THEN** Pages is listed before Quick actions, or alone when no action matches

#### Scenario: Sync is discoverable by API

- **WHEN** a signed-in user searches for API with surrounding whitespace or different letter case
- **THEN** Sync with Tacticus appears

#### Scenario: No matching results

- **WHEN** no eligible action or page matches a query
- **THEN** one localized no-results message appears without empty group headings, with a Clear search button that empties the field

#### Scenario: Localized search

- **WHEN** the active language changes
- **THEN** action labels, descriptions, group names, disabled explanations, and search matching use that language

### Requirement: Search action handoff is accessible on both platforms

Navigation search SHALL keep one highlighted row, which ↑/↓ (wrapping), Home/End and the pointer move, while focus stays in the search field. Enter in the field SHALL open the highlighted page or run the highlighted action; a disabled action SHALL NOT be highlighted or run. Actions SHALL also support mobile touch. The search modal SHALL release focus/pointer restrictions before another form/widget/tour opens. Search cancellation SHALL restore focus to its launcher; launched forms SHALL receive focus and return it to the originating search launcher on close when still present. Sync SHALL return focus to the launcher while existing status reports progress. Reopening search SHALL start with an empty query.

#### Scenario: Desktop keyboard activation

- **WHEN** a user opens search with Ctrl/Cmd+K, moves the highlight to Create Project with the arrow keys, and presses Enter
- **THEN** search closes and focus enters one project form with no remaining search focus trap

#### Scenario: Enter opens the top result

- **WHEN** a user types "raids" and presses Enter without moving the highlight
- **THEN** the Raids page opens and search closes

#### Scenario: Mobile action with keyboard visible

- **WHEN** a mobile user filters Menu results with the on-screen keyboard and taps Create Goal
- **THEN** the drawer and keyboard dismiss before the creation surface becomes interactive, and its controls respond to the first tap

#### Scenario: Repeated activation is not replayed

- **WHEN** an action is activated and the search surface closes or rerenders
- **THEN** it is dispatched only once, without duplicate forms or operations

#### Scenario: Search cancellation and reopening

- **WHEN** a user dismisses search with Escape or Close and later reopens it
- **THEN** focus first returns to the launcher and the reopened search query is empty

## ADDED Requirements

### Requirement: Navigation search highlights one row the same way for keyboard and pointer

The highlighted row SHALL use one style, a tint with an accent edge, whether the keyboard or the pointer moved it. The first row SHALL be highlighted when search opens and after every query change. The current page SHALL show a "You're here" tag instead of an active tint. On the phone, with an empty query, no row SHALL be highlighted and touch SHALL NOT move the highlight. A page row SHALL remain a link, so a modified click (Ctrl/Cmd/Shift/middle) keeps the browser's own behavior.

#### Scenario: The current page is not mistaken for the top result

- **WHEN** a user on Raids opens search and types "guild"
- **THEN** only the first result is highlighted, and Raids, if listed, shows "You're here" without a tint

#### Scenario: Pointer and keyboard share the highlight

- **WHEN** a desktop user hovers a row and then presses ↓
- **THEN** the highlight moves from the hovered row to the next one, with the same style

### Requirement: The desktop navigation search dialog keeps its field in place

The desktop dialog SHALL be anchored near the top of the window, so its search field does not move as the results change. Its title SHALL be for screen readers only. The field SHALL show a search icon and an Esc control that closes the dialog. A footer SHALL show the ↑ ↓ (move), ↵ (open), Esc (close) and Ctrl/⌘ K hints.

#### Scenario: The field stays put while typing

- **WHEN** a desktop user types a query that shrinks the result list
- **THEN** the search field stays at the same position on screen
