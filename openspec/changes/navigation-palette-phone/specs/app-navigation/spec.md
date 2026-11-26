## MODIFIED Requirements

### Requirement: Menu drawer and navigation search show each item's description

The mobile menu drawer and the desktop navigation search dialog SHALL show each row on one line and SHALL show the short description of the highlighted row after its label. The desktop sidebar and the mobile bottom navigation bar are unaffected and continue to show icon and label only, with no description.

#### Scenario: The highlighted row shows its description

- **WHEN** navigation search lists results and one row is highlighted (the top hit of a query on the phone)
- **THEN** that row shows its short description after its label, and the other rows show their label only

### Requirement: Navigation search includes quick actions on desktop and mobile

Desktop navigation search and mobile Menu search SHALL include a Quick actions group. The action order SHALL be Create Goal, Create Project, Sync with Tacticus, Send feedback, Report a bug, Tour this page, Switch theme, Account settings and Sign out, subject to eligibility; a guest gets Sign in and Sign up instead of the account actions. Report a bug, Switch theme, Account settings and Sign out SHALL be listed only when a query matches them. Each action SHALL show an icon, localized label, and short description; Sync SHALL show when the last sync happened in place of its description. An empty query SHALL show the eligible actions that are not search-only, before the route hierarchy: as rows on desktop, and as one scrolling row of chips above the list on the phone. Queries SHALL match actions with the same ranking as pages (label, keywords, description); API SHALL match sync. Actions and pages SHALL be ranked separately, and the group holding the better match SHALL come first, Quick actions first on a tie; on the phone, matching actions show as rows and the chips are hidden. Empty groups SHALL be omitted, and no-results feedback SHALL appear only when both groups have no matches.

#### Scenario: Desktop search includes actions

- **WHEN** a signed-in desktop user opens top-bar search or presses Ctrl/Cmd+K on a page with a tour
- **THEN** Create Goal, Create Project, Sync with Tacticus, Send feedback and Tour this page appear before Pages with the search input focused

#### Scenario: Mobile Menu shows actions as chips

- **WHEN** a signed-in mobile user opens Menu on a page with a tour
- **THEN** the same actions appear as a row of chips above the list, and a disabled chip says why in place of its label

#### Scenario: Search-only actions appear when searched for

- **WHEN** a signed-in user searches for "bug", "dark" or "log out"
- **THEN** Report a bug, Switch theme or Sign out, respectively, is listed, and none of them is listed with an empty query

#### Scenario: Sync says when it last ran

- **WHEN** a signed-in user's planner last synced 15 minutes ago
- **THEN** the Sync with Tacticus row reads "Last synced 15 minutes ago" in place of its description

#### Scenario: Sync is discoverable by API

- **WHEN** a signed-in user searches for API with surrounding whitespace or different letter case
- **THEN** Sync with Tacticus appears

#### Scenario: No matching results

- **WHEN** no eligible action or page matches a query
- **THEN** one localized no-results message appears without empty group headings, with a Clear search button that empties the field

#### Scenario: Localized search

- **WHEN** the active language changes
- **THEN** action labels, descriptions, group names, disabled explanations, and search matching use that language

## ADDED Requirements

### Requirement: The phone Menu drawer gives the list the height

The Menu drawer SHALL have a one-line header with the title "Menu" and a close button, and no Close button below the list; the handle, a swipe and Escape also close it. The search field SHALL stay at the bottom and SHALL NOT take focus when the drawer opens. While a query is typed, results that fit SHALL sit right above the field, and the keyboard's Go/Enter key SHALL open the highlighted top hit.

#### Scenario: One-line header

- **WHEN** a mobile user opens Menu
- **THEN** the title "Menu" and a close button share one line, and the close button closes the drawer

#### Scenario: Go opens the top hit

- **WHEN** a mobile user types "raids" and presses Go on the keyboard
- **THEN** the Raids page opens and the drawer closes

### Requirement: Navigation search lists recent pages

With an empty query, navigation search on desktop and phone SHALL list the last 3 pages visited, most recent first, before Quick actions, not counting the page being viewed and leaving out pages the visitor can no longer see. Each recent page SHALL show where it sits (its group, else its section). The list SHALL be kept on the device as account data, so sign-out removes it. When the browser refuses storage, the list SHALL still work for the rest of the visit (`browser-storage-resilience`).

#### Scenario: Recent pages at rest

- **GIVEN** a user visited Machines of War, then Raids, then Home
- **WHEN** they open navigation search on Home
- **THEN** Raids and Machines of War are listed under "Recent", in that order, before Quick actions

#### Scenario: Recent pages leave a query alone

- **WHEN** the user types a query
- **THEN** the Recent group is not shown, and matching pages appear only in the ranked results
