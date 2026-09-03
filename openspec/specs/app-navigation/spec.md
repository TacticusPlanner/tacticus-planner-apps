# app-navigation Specification

## Purpose

Defines the behavior of the app-wide navigation shell — the desktop sidebar, the mobile bottom navigation and its menu drawer, navigation search, item descriptions, the shared page header (title, description, and a section's tab row), and how the desktop sidebar resolves a section entry to a starting child route — so that Level 2 destinations are discoverable in exactly one place (the shared header's tab row) instead of being duplicated with the sidebar, or duplicated against a page's own separately-rendered title and description. The mobile menu drawer's existing full-tree listing is deliberately left intact.

## Requirements

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

### Requirement: Entering a section navigates to its last-visited child on desktop, defaulting to that section's default child on first entry

For a top-level section with more than one child page, activating that section's entry point in the desktop sidebar SHALL navigate to the child route the user most recently visited within that section during the current session. Before the user has visited any child of that section in the session, it SHALL navigate to that section's existing default child route.

This applies to the desktop sidebar only. On mobile, sections reachable via the drawer already expose every child page as its own direct link, so there is no hidden default to resolve there, and the Goals section's primary bottom-bar entry continues to navigate to its own existing default (Board) view, unaffected by this requirement. It also applies only to sections with more than one child route on desktop — a section with a single child route continues to navigate to its existing default/index route unchanged.

#### Scenario: First entry into a multi-child section uses its default child

- **WHEN** a user who has not visited any Lookup page this session clicks the Lookup entry in the desktop sidebar
- **THEN** they land on Lookup's existing default child page (Character)

#### Scenario: Re-entering a multi-child section returns to its last-visited child

- **WHEN** a user views `/lookup/mow` (via the sidebar flyout, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Lookup entry in the desktop sidebar
- **THEN** they land on `/lookup/mow`, not Lookup's default child

#### Scenario: Directly visiting a child route counts as visiting it

- **WHEN** a user opens a child route directly (e.g. via a bookmark, search, the mobile drawer, the mobile header's own tab row, or the desktop sidebar's flyout) without first clicking the section's desktop sidebar entry
- **THEN** that route is recorded as the section's last-visited child for the remainder of the session, so a later desktop sidebar click into that section honors it

#### Scenario: Last-visited child survives a page reload within the same session

- **WHEN** a user visits `/lookup/mow`, reloads the page (staying in the same browser tab), then clicks the Lookup entry in the desktop sidebar
- **THEN** they land on `/lookup/mow`, not Lookup's default child — the last-visited child is not lost on reload

#### Scenario: Single-child sections keep their existing default on desktop

- **WHEN** a user clicks the Guild entry (single child route) in the desktop sidebar
- **THEN** they land on that section's existing default route, unaffected by last-visited-child behavior

#### Scenario: Dailies follows the same multi-child behavior as any other section

- **WHEN** a user visits `/dailies/shops` (via the sidebar flyout, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Dailies entry in the desktop sidebar
- **THEN** they land on `/dailies/shops`, not Dailies' default child (`/dailies/raids`) — Dailies is not special-cased once it has more than one child route

### Requirement: The shared page header hosts a section's child-page picker

On mobile, each top-level section that has child pages (`NavItem.children`) SHALL continue to expose them via a routed tab row directly beneath the header's title and description, replacing any tab row a page previously rendered on its own — unchanged from the original header-tabs design. This applies to every multi-child section, including Dailies. A third level of tabs nested within a specific child page (e.g. Dailies > Raids' own Today/Raids Plan sub-tabs) is out of scope for this requirement and continues to render inside that child page's own content, unaffected.

On desktop, the header no longer hosts a child-page picker at all — a section's child pages are discovered through the desktop sidebar's flyout instead (see the sidebar flyout requirement above), and the desktop header shows only a static breadcrumb (see the breadcrumb requirement above). On mobile, the menu drawer also lists a section's child pages, per the earlier drawer requirement — that duplication with the mobile header's tab row is intentional and out of scope for this capability to remove.

#### Scenario: The header's child-picker lists all of a section's child pages

- **WHEN** a user is on any page within a section that has child pages, on mobile
- **THEN** the shared header shows a tab row listing every child page of that section directly beneath the title and description, and allows switching between them, and no separate tab row is rendered within the page's own content

#### Scenario: Desktop header offers no child-picker

- **WHEN** a user is on any page within a section that has child pages, on desktop
- **THEN** the shared header shows only the static breadcrumb title (and, beneath it, the active page's description) — no tab row, dropdown, or other interactive picker is rendered in the header

#### Scenario: A third-level tab row is unaffected

- **WHEN** a user is on `/dailies/raids/today` or `/dailies/raids/plan`, on either platform
- **THEN** Raids' own Today/Raids Plan sub-tabs continue to render within the page's own content, below the header, exactly as before this change, unaffected by how the header or sidebar shows Dailies' own child pages

### Requirement: Desktop sidebar exposes each section's child pages via a hover/click flyout

For any top-level section that has child pages, the desktop sidebar SHALL render a small chevron indicator on that section's own row, in both the expanded and icon-collapsed sidebar states, as a static hint that it has child pages. Hovering that row (after a short delay, to avoid opening for a pointer only passing through) or clicking it while it is not already the active navigation target SHALL open a flyout positioned beside that row, in both sidebar states. Every section that has at least one child page SHALL get this flyout, including a section with only one child.

The flyout SHALL show the parent section's own title at the top, styled as a quiet, non-interactive label (not a link, not visually prominent), followed by one row per child page. Each child row SHALL show that child's label and its short description, and SHALL be visually distinguished when it is the currently active route. Selecting a child row SHALL navigate to that child's route and close the flyout.

The flyout SHALL be dismissible via Escape and via moving focus or the pointer away from both the triggering row and the flyout itself, and SHALL be operable via keyboard alone (not hover-only), without trapping focus in a way that prevents continuing to navigate the rest of the sidebar.

Clicking the section's own row (as opposed to a row inside its flyout) SHALL continue to navigate using the existing entry-path resolution (the section's last-visited child this session, or its default child) — the flyout is an additional way to reach a specific child directly, not a replacement for that existing click behavior.

#### Scenario: Hovering a section with children opens its flyout

- **WHEN** a user's pointer rests on a top-level section's sidebar row that has child pages, for longer than the flyout's open delay
- **THEN** a flyout opens beside that row listing the section's child pages, with the section's own title shown as a quiet label above them

#### Scenario: Flyout opens the same way when the sidebar is collapsed to icons

- **WHEN** the sidebar is in its icon-collapsed state and a user hovers or clicks a section's icon that has child pages
- **THEN** the same flyout opens beside that icon, rather than the plain label-only tooltip a childless section's icon shows

#### Scenario: A passing pointer does not open the flyout

- **WHEN** a user's pointer moves across a section's sidebar row that has children without pausing for the flyout's open delay
- **THEN** no flyout opens

#### Scenario: Clicking a section row still uses last-visited-child navigation

- **WHEN** a user clicks a section's own sidebar row (not a row inside its flyout)
- **THEN** the app navigates using that section's existing entry-path resolution, unaffected by whether its flyout is open

#### Scenario: Selecting a child in the flyout navigates to it and closes the flyout

- **WHEN** a user selects a child page's row inside an open flyout
- **THEN** the app navigates to that child's route and the flyout closes

#### Scenario: A single-child section still gets a flyout

- **WHEN** a user hovers or clicks the Guild section's sidebar row
- **THEN** its flyout opens showing Guild's own title as the quiet label and its one child page ("Members") as a selectable row, the same as any multi-child section

#### Scenario: Escape closes an open flyout

- **WHEN** a flyout is open and the user presses Escape
- **THEN** the flyout closes and focus returns to the triggering sidebar row

#### Scenario: A childless section shows no chevron and no flyout

- **WHEN** a user views or hovers a top-level section's sidebar row that has no child pages (e.g. Home)
- **THEN** no chevron is shown on that row and no flyout opens

### Requirement: Desktop header shows a static section/child breadcrumb, with no picker

On desktop, when the active top-level section has child pages, the page header's title SHALL be rendered as a plain, non-interactive breadcrumb reading "{Section label} › {Active child label}". Neither the section segment nor the child segment SHALL be clickable or otherwise interactive — switching to a different child happens only through the sidebar flyout, navigation search, or a bookmark/direct link, never through the header itself. When the active top-level section has no child pages, the header title SHALL remain the section's own plain label, unchanged from today.

#### Scenario: A section with children shows a plain breadcrumb title

- **WHEN** a user on desktop is on any child page of a section that has children (e.g. `/lookup/mow`)
- **THEN** the header title reads "Lookup › Machines of War" as plain text, with neither segment clickable

#### Scenario: Breadcrumb updates when the active child changes

- **WHEN** a user on desktop switches from one child page to a sibling child page within the same section, by any means (the sidebar flyout, navigation search, or a direct link)
- **THEN** the header breadcrumb's child segment updates to the newly active child's label

#### Scenario: A childless section keeps a plain title

- **WHEN** a user on desktop is on a top-level section's own page that has no child pages (e.g. Home)
- **THEN** the header shows only that section's own label as the title, with no breadcrumb separator

### Requirement: Library replaces Lookup in public navigation

The anonymous-available public reference section SHALL be named "Library" and
shall contain these child destinations: "Characters", "Machines of War",
"NPCs", "Raid Bosses", and "Shops". Their destinations SHALL be the
corresponding Library routes (`/library/characters`, `/library/machines-of-war`,
`/library/npcs`, `/library/raid-bosses`, `/library/shops`). The old "Lookup"
section name and singular child labels SHALL not be shown for this public
reference area.

#### Scenario: Desktop navigation presents the Library hierarchy

- **WHEN** a user views the desktop sidebar or opens the public reference
  section's child flyout
- **THEN** it presents Library and the five Library child destinations with
  their Library routes

#### Scenario: Mobile navigation presents the Library hierarchy

- **WHEN** a user opens the mobile menu drawer or views the Library header
  child picker
- **THEN** it presents Library and the five Library child destinations with
  their Library routes

#### Scenario: Navigation search finds Library destinations

- **WHEN** a user searches for "Library", "Characters", "Machines of War",
  "NPCs", "Raid Bosses", or "Shops"
- **THEN** the matching Library destination appears with its localized
  description and opens its Library route when selected

### Requirement: Library naming is consistent across application context

The application SHALL use localized Library names and descriptions consistently
in page headers, desktop breadcrumbs, browser titles, landing-page links,
Joyride navigation guidance, and applicable in-repository documentation. A
Library child route SHALL show the matching plural child name and description
for its active route.

#### Scenario: Active Library page updates its contextual labels

- **WHEN** a user opens `/library/machines-of-war`
- **THEN** the active navigation context, page header or desktop breadcrumb,
  browser title, and page description identify the section as Library and the
  child page as Machines of War

#### Scenario: Localized navigation has no stale public Lookup label

- **WHEN** the app is displayed in any supported locale
- **THEN** the public reference navigation and its contextual copy use that
  locale's Library terminology rather than the former Lookup terminology
