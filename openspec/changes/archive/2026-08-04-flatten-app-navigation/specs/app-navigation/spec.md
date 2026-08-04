## Purpose

Defines the behavior of the app-wide navigation shell — the desktop sidebar, the mobile bottom navigation and its menu drawer, navigation search, item descriptions, the shared page header (title, description, and a section's tab row), and how the desktop sidebar resolves a section entry to a starting child route — so that Level 2 destinations are discoverable in exactly one place (the shared header's tab row) instead of being duplicated with the sidebar, or duplicated against a page's own separately-rendered title and description. The mobile menu drawer's existing full-tree listing is deliberately left intact.

## ADDED Requirements

### Requirement: Desktop sidebar lists top-level sections only

The desktop sidebar SHALL list only top-level navigation sections (Home, Lookup, Goals, Dailies, Progress, Guild, and any future top-level section). It SHALL NOT render a section's child pages, expand/collapse chevrons, or an expanded-branch sub-list for any section.

#### Scenario: Sidebar renders no child items

- **WHEN** the desktop sidebar renders, for a section that has child pages (e.g. Lookup)
- **THEN** only the section's own top-level entry is shown in the sidebar, with no child links, chevron, or expanded sub-list beneath it, regardless of whether that section is the active route

#### Scenario: Sidebar highlights the active top-level section

- **WHEN** the current route is a top-level section's path or any path nested under it (e.g. `/lookup/mow`)
- **THEN** that section's sidebar entry is shown in its active state, and no other sidebar entry is active

### Requirement: Mobile menu drawer lists top-level sections with their child pages nested beneath them

The mobile bottom navigation's "Menu" drawer SHALL continue to list every top-level navigation section, with each section's child pages (if any) shown nested beneath it as direct links — unchanged from its behavior before this capability. This capability does not remove or restructure anything from the mobile drawer.

#### Scenario: Drawer keeps listing child pages

- **WHEN** the mobile menu drawer opens, for a section that has child pages
- **THEN** both the section's own entry and its child pages are shown as direct links in the drawer, exactly as before this change

#### Scenario: Mobile bottom bar keeps primary destinations unchanged

- **WHEN** the mobile bottom navigation bar renders
- **THEN** it continues to show only the sections and primary actions already designated `mobilePlacement: "primary"`, unaffected by this capability

### Requirement: Navigation search indexes every route and matches on label or description

Desktop navigation search and the mobile menu drawer's search field SHALL continue to index every route, including a section's child pages, matching a typed query against each item's label and its short description (see the description requirement below), so that child pages remain directly reachable by search even though they are not listed in the desktop sidebar.

#### Scenario: Searching for a child page's label finds it

- **WHEN** a user types a child page's label (e.g. "Machines of War") into desktop navigation search or the mobile drawer search field
- **THEN** that child page appears in the filtered results and navigating to it goes directly to that child page's route

#### Scenario: Searching for text that only appears in an item's description finds it

- **WHEN** a user types a phrase that matches an item's description but not its label, into desktop navigation search or the mobile drawer search field
- **THEN** that item still appears in the filtered results

### Requirement: A desktop keyboard shortcut toggles navigation search

On desktop, pressing Ctrl+K (or Cmd+K on macOS) from anywhere in the app SHALL open the navigation search dialog if it is currently closed, and close it if it is currently open, regardless of which element has focus at the time. The desktop sidebar's Search button SHALL display the platform-appropriate shortcut hint. This requirement is desktop-only; there is no mobile equivalent.

#### Scenario: Shortcut opens the dialog

- **WHEN** the navigation search dialog is closed and the user presses Ctrl+K (Cmd+K on macOS)
- **THEN** the dialog opens with its search input focused

#### Scenario: Shortcut closes an already-open dialog

- **WHEN** the navigation search dialog is already open and the user presses Ctrl+K (Cmd+K on macOS) again
- **THEN** the dialog closes

#### Scenario: Search button shows the shortcut hint

- **WHEN** a user views the desktop sidebar
- **THEN** the Search button displays the platform-appropriate shortcut hint ("⌘K" on macOS, "Ctrl+K" elsewhere)

### Requirement: A desktop keyboard shortcut triggers Create Goal

On desktop, pressing Ctrl+G (or Cmd+G on macOS) from anywhere in the app SHALL trigger the same Create Goal action as clicking the sidebar's Create Goal button, regardless of which element has focus at the time. The desktop sidebar's Create Goal button SHALL display the platform-appropriate shortcut hint. This requirement is desktop-only; there is no mobile equivalent.

#### Scenario: Shortcut opens the Create Goal sheet

- **WHEN** a user presses Ctrl+G (Cmd+G on macOS)
- **THEN** the Create Goal sheet opens, the same as clicking the sidebar's Create Goal button

#### Scenario: Create Goal button shows the shortcut hint

- **WHEN** a user views the desktop sidebar
- **THEN** the Create Goal button displays the platform-appropriate shortcut hint ("⌘G" on macOS, "Ctrl+G" elsewhere)

### Requirement: A desktop keyboard shortcut triggers Sync with Tacticus

On desktop, pressing Ctrl+Shift+S (or Cmd+Shift+S on macOS) from anywhere in the app SHALL trigger the same Sync with Tacticus action as clicking the sidebar's Sync button, regardless of which element has focus at the time, subject to the same disabled-while-syncing guard the button itself already has. The desktop sidebar's Sync button SHALL display the platform-appropriate shortcut hint. This requirement is desktop-only; there is no mobile equivalent.

#### Scenario: Shortcut starts a sync

- **WHEN** a sync is not already in progress and a user presses Ctrl+Shift+S (Cmd+Shift+S on macOS)
- **THEN** a sync starts, the same as clicking the sidebar's Sync button

#### Scenario: Shortcut is a no-op while a sync is already in progress

- **WHEN** a sync is already in progress and a user presses Ctrl+Shift+S (Cmd+Shift+S on macOS)
- **THEN** no second sync is triggered, matching the button's own disabled-while-syncing behavior

#### Scenario: Sync button shows the shortcut hint

- **WHEN** a user views the desktop sidebar
- **THEN** the Sync button displays the platform-appropriate shortcut hint ("⌘⇧S" on macOS, "Ctrl+Shift+S" elsewhere)

### Requirement: Menu drawer and navigation search show each item's description

The mobile menu drawer and the desktop navigation search dialog SHALL display a short description alongside every listed item's label — both top-level sections and their child pages. The desktop sidebar and the mobile bottom navigation bar are unaffected and continue to show icon and label only, with no description.

#### Scenario: Drawer shows descriptions for top-level and child items

- **WHEN** the mobile menu drawer opens
- **THEN** every listed top-level section, and every child page shown nested beneath a section, displays its short description beneath its label

#### Scenario: Desktop search results show descriptions

- **WHEN** the desktop navigation search dialog lists results (top-level sections and/or child pages)
- **THEN** every result displays its short description beneath its label

### Requirement: Page header shows a description matching the active section or child page, and (on mobile) a matching title

The page header SHALL display a short description beneath its title, on both desktop and mobile, matching the most specific active navigation item: if the current route matches a child page (`NavSubItem`) of the active top-level section, that child's own description is shown; otherwise the active top-level section's own description is shown. On mobile, the header title follows the same resolution as the description (child's label when a child is active, else the top-level section's own label). On desktop, the header title behaves differently — see the following requirement.

#### Scenario: Header shows the section's title and description on the section's own page

- **WHEN** a user is on a top-level section's own page that has no matching child item (e.g. Home), on either platform
- **THEN** the header shows that section's own label as the title and that section's own description beneath it

#### Scenario: Mobile header swaps to the child's title and description on a child page

- **WHEN** a user on mobile navigates to a child page of a multi-child section (e.g. `/lookup/mow`)
- **THEN** the header title switches to that child's own label (e.g. "Machines of War"), and the description beneath it switches to that child's own description — neither stays fixed to the parent section

#### Scenario: Mobile header title and description update when switching between sibling child pages

- **WHEN** a user on mobile switches from one child page to a sibling child page within the same section (e.g. `/lookup/character` to `/lookup/mow`), by any means (the header's own tab row, mobile drawer, or search)
- **THEN** the header title and description update to the newly active child's own label and description

#### Scenario: Desktop header description updates when switching between sibling child pages, independent of the title

- **WHEN** a user on desktop switches from one child page to a sibling child page within the same section (e.g. `/lookup/character` to `/lookup/mow`), by any means (the header's own child-picker, the mobile drawer's equivalent state, or search)
- **THEN** the header description updates to the newly active child's own description, while the header title continues to show the section's own label per the following requirement

### Requirement: Desktop header title stays fixed to the top-level section, with a child-picker beside it

On desktop, the page header's title SHALL always show the active top-level section's own label (e.g. "Lookup"), never an active child's label, regardless of which child page is active. When that section has child pages, the header SHALL also show a child-picker in the same row as the title: for a section with 6 or fewer children (today, every section), a row of plain nav-style links listing every child inline beside the title, not a boxed/pill-styled tab control; for a section with more than 6 children (none today), a dropdown control that replaces the plain title with a "Section › Active child" label, opening a menu that lists every child page — selecting one navigates to it, equivalent to clicking a link.

#### Scenario: Desktop header title does not swap to the active child

- **WHEN** a user on desktop navigates to a child page of a multi-child section (e.g. `/lookup/mow`)
- **THEN** the header title continues to show the section's own label ("Lookup"), not the child's label

#### Scenario: A section with few children shows an inline row of nav links beside the title

- **WHEN** a user on desktop is on any page within a section that has 6 or fewer child pages (today, every section — Lookup, Goals, Progress, Guild, Dailies)
- **THEN** the header shows the section's title followed by a row of plain nav-style links, in the same row, listing every child page of that section, with the active one visually distinguished (not boxed/pill-styled)

#### Scenario: A section with many children shows a breadcrumb dropdown instead of a plain title

- **WHEN** a user on desktop is on any page within a section that has more than 6 child pages (none today)
- **THEN** the header's title row shows a dropdown control reading "Section › Active child" instead of the plain section title, and opening it lists every child page of that section

#### Scenario: Selecting a child from the breadcrumb dropdown navigates to it

- **WHEN** a user on desktop opens the breadcrumb dropdown and selects a different child page from the menu
- **THEN** the app navigates to that child page's route, the dropdown's label updates to reflect the newly active child, and this counts as visiting that child for the last-visited-child requirement below

### Requirement: Entering a section navigates to its last-visited child on desktop, defaulting to that section's default child on first entry

For a top-level section with more than one child page, activating that section's entry point in the desktop sidebar SHALL navigate to the child route the user most recently visited within that section during the current session. Before the user has visited any child of that section in the session, it SHALL navigate to that section's existing default child route.

This applies to the desktop sidebar only. On mobile, sections reachable via the drawer already expose every child page as its own direct link, so there is no hidden default to resolve there, and the Goals section's primary bottom-bar entry continues to navigate to its own existing default (Board) view, unaffected by this requirement. It also applies only to sections with more than one child route on desktop — a section with a single child route continues to navigate to its existing default/index route unchanged.

#### Scenario: First entry into a multi-child section uses its default child

- **WHEN** a user who has not visited any Lookup page this session clicks the Lookup entry in the desktop sidebar
- **THEN** they land on Lookup's existing default child page (Character)

#### Scenario: Re-entering a multi-child section returns to its last-visited child

- **WHEN** a user views `/lookup/mow` (via Lookup's own header tab row, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Lookup entry in the desktop sidebar
- **THEN** they land on `/lookup/mow`, not Lookup's default child

#### Scenario: Directly visiting a child route counts as visiting it

- **WHEN** a user opens a child route directly (e.g. via a bookmark, search, the mobile drawer, or the header's own child-picker — a tab row or, on desktop, a breadcrumb dropdown) without first clicking the section's desktop sidebar entry
- **THEN** that route is recorded as the section's last-visited child for the remainder of the session, so a later desktop sidebar click into that section honors it

#### Scenario: Last-visited child survives a page reload within the same session

- **WHEN** a user visits `/lookup/mow`, reloads the page (staying in the same browser tab), then clicks the Lookup entry in the desktop sidebar
- **THEN** they land on `/lookup/mow`, not Lookup's default child — the last-visited child is not lost on reload

#### Scenario: Single-child sections keep their existing default on desktop

- **WHEN** a user clicks the Guild entry (single child route) in the desktop sidebar
- **THEN** they land on that section's existing default route, unaffected by last-visited-child behavior

#### Scenario: Dailies follows the same multi-child behavior as any other section

- **WHEN** a user visits `/dailies/shops` (via Dailies' own header tab row, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Dailies entry in the desktop sidebar
- **THEN** they land on `/dailies/shops`, not Dailies' default child (`/dailies/raids`) — Dailies is not special-cased once it has more than one child route

### Requirement: The shared page header hosts a section's child-page picker

Each top-level section that has child pages (`NavItem.children`) SHALL expose them via a control rendered in the shared app-shell header, on both desktop and mobile — replacing any tab row a page previously rendered on its own. On mobile this is a routed tab row directly beneath the title and description (unchanged from the original header-tabs design). On desktop this is the child-picker described in the previous requirement (an inline row of nav links or a breadcrumb dropdown, beside the title). This applies to every multi-child section, including Dailies. A third level of tabs nested within a specific child page (e.g. Dailies > Raids' own Today/Raids Plan sub-tabs) is out of scope for this requirement and continues to render inside that child page's own content, unaffected. On desktop, the header's child-picker is the only place in the app chrome that lists a section's child pages outside of search. On mobile, the menu drawer also lists them, per the requirement above — that duplication is intentional and out of scope for this capability to remove.

#### Scenario: The header's child-picker lists all of a section's child pages

- **WHEN** a user is on any page within a section that has child pages, on either platform
- **THEN** the shared header lists every child page of that section (as a tab row on mobile always, and on desktop as a row of nav links when there are 6 or fewer children; as a breadcrumb dropdown's menu on desktop when there are more than 6) and allows switching between them, and no separate tab row is rendered within the page's own content

#### Scenario: A third-level tab row is unaffected

- **WHEN** a user is on `/dailies/raids/today` or `/dailies/raids/plan`
- **THEN** the shared header shows Dailies' six top-level child pages (Raids active) via its platform-appropriate control, and Raids' own Today/Raids Plan sub-tabs continue to render within the page's own content, below the header, exactly as before this change
