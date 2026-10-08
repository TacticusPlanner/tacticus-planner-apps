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

On desktop, pressing Ctrl+K (or Cmd+K on macOS) from anywhere in the app SHALL open the navigation search dialog if it is currently closed, and close it if it is currently open, regardless of which element has focus at the time. The desktop global top bar's Search button SHALL display the platform-appropriate shortcut hint, hiding the hint, but not the button's accessible name, when desktop width is constrained. The Search button SHALL NOT show a hover tooltip. This requirement is desktop-only; there is no mobile equivalent.

#### Scenario: Shortcut opens the dialog

- **WHEN** the navigation search dialog is closed and the user presses Ctrl+K (Cmd+K on macOS)
- **THEN** the dialog opens with its search input focused

#### Scenario: Shortcut closes an already-open dialog

- **WHEN** the navigation search dialog is already open and the user presses Ctrl+K (Cmd+K on macOS) again
- **THEN** the dialog closes

#### Scenario: Search button shows the shortcut hint

- **WHEN** a user views the desktop global top bar
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

- **WHEN** a user on mobile navigates to a child page of a multi-child section (e.g. `/library/machines-of-war`)
- **THEN** the header title switches to that child's own label (e.g. "Machines of War"), and the description beneath it switches to that child's own description — neither stays fixed to the parent section

#### Scenario: Mobile header title and description update when switching between sibling child pages

- **WHEN** a user on mobile switches from one child page to a sibling child page within the same section (e.g. `/library/characters` to `/library/machines-of-war`), by any means (the header's own tab row, mobile drawer, or search)
- **THEN** the header title and description update to the newly active child's own label and description

#### Scenario: Desktop header description updates when switching between sibling child pages, independent of the title

- **WHEN** a user on desktop switches from one child page to a sibling child page within the same section (e.g. `/library/characters` to `/library/machines-of-war`), by any means (the section menu or navigation search)
- **THEN** the header description updates to the newly active child's own description, while the header title (or, with the section menu collapsed, its breadcrumb) updates to the active child

### Requirement: Library replaces Lookup in public navigation

The anonymous-available public reference section SHALL be named "Library" and
shall contain these child destinations: "Characters", "Machines of War",
"NPCs", "Raid Bosses", and "Shops". Their destinations SHALL be the
corresponding Library routes (`/library/characters`, `/library/machines-of-war`,
`/library/npcs`, `/library/raid-bosses`, `/library/shops`). The old "Lookup"
section name and singular child labels SHALL not be shown for this public
reference area.

#### Scenario: Desktop navigation presents the Library hierarchy

- **WHEN** a user opens Library with its desktop section menu expanded
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

### Requirement: Entering a section navigates to its last-visited child on desktop, defaulting to a fixed default child on first entry

For a top-level section with more than one child page, activating that section's entry point in the desktop sidebar SHALL navigate to the child route the user most recently visited within that section during the current session. Before the user has visited any child of that section in the session, it SHALL navigate to that section's existing default child route. For the Plan section (route prefix `/plan`), that default child route is the fixed Goals route `/plan/goals`; it does not depend on projects. Every other section's default child route remains the fixed route it is today, unaffected.

This applies to the desktop sidebar only. On mobile, sections reachable via the drawer already expose every child page as its own direct link, so there is no hidden default to resolve there, and the Plan section's primary bottom-bar entry resolves to `/plan/goals` every time it is activated — mobile has no last-visited-child memory, so every activation is a "first entry." It also applies only to sections with more than one child route on desktop — a section with a single child route continues to navigate to its existing default/index route unchanged.

#### Scenario: First entry into a multi-child section uses its default child

- **WHEN** a user who has not visited any Library page this session clicks the Library entry in the desktop sidebar
- **THEN** they land on Library's existing default child page (Characters)

#### Scenario: Re-entering a multi-child section returns to its last-visited child

- **WHEN** a user views `/library/machines-of-war` (via the section menu, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Library entry in the desktop sidebar
- **THEN** they land on `/library/machines-of-war`, not Library's default child

#### Scenario: Directly visiting a child route counts as visiting it

- **WHEN** a user opens a child route directly (e.g. via a bookmark, search, the mobile drawer, the mobile header's own tab row, or the desktop section menu) without first clicking the section's desktop sidebar entry
- **THEN** that route is recorded as the section's last-visited child for the remainder of the session, so a later desktop sidebar click into that section honors it

#### Scenario: Last-visited child survives a page reload within the same session

- **WHEN** a user visits `/library/machines-of-war`, reloads the page (staying in the same browser tab), then clicks the Library entry in the desktop sidebar
- **THEN** they land on `/library/machines-of-war`, not Library's default child — the last-visited child is not lost on reload

#### Scenario: Single-child sections keep their existing default on desktop

- **WHEN** a user clicks the Guild entry (single child route) in the desktop sidebar
- **THEN** they land on that section's existing default route, unaffected by last-visited-child behavior

#### Scenario: Dailies follows the same multi-child behavior as any other section

- **WHEN** a user visits `/dailies/shops` (via the section menu, the mobile drawer, or search), then navigates to a different top-level section, then clicks the Dailies entry in the desktop sidebar
- **THEN** they land on `/dailies/shops`, not Dailies' default child (`/dailies/raids`) — Dailies is not special-cased once it has more than one child route

#### Scenario: Plan's default is Goals

- **GIVEN** the user has not visited any Plan child page this session
- **WHEN** the user activates the Plan entry (desktop sidebar first entry, or the mobile bottom-bar entry)
- **THEN** they land on Goals (`/plan/goals`) regardless of the account's projects

#### Scenario: Plan's default does not wait for projects

- **GIVEN** the account's projects are still loading, failed to load, or do not exist
- **WHEN** the user activates the Plan entry
- **THEN** they land on `/plan/goals` immediately, with no project-dependent redirect or loading route

#### Scenario: Plan's last-visited-child memory still overrides the default on desktop

- **GIVEN** the user has visited Projects (`/plan/projects`) earlier this session
- **WHEN** the user clicks the Plan entry in the desktop sidebar
- **THEN** they land on Projects, not Goals — last-visited-child memory takes precedence over the default, the same as it would for any other section's fixed default

### Requirement: The shared page header hosts each section's child-page picker

On mobile, each top-level section that has child pages (`NavItem.children`) SHALL expose them via a routed tab row directly beneath the header's title and description, replacing any tab row a page previously rendered on its own. This applies to every multi-child section, including Dailies and Plan (whose children are Goals, Projects, Insights, and Schedule). No child page renders a further level of tabs inside its own content.

On desktop, the header does not host a child-page picker at all — a section's child pages are discovered through the desktop section menu instead (see the persistent desktop section menu requirement), and the desktop header shows only the active page's title, plus a reopen button and "{Section} ›" breadcrumb while the section menu is collapsed (see the header title requirement). On mobile, the menu drawer also lists a section's child pages, per the drawer requirement — that duplication with the mobile header's tab row is intentional and out of scope for this capability to remove.

#### Scenario: The header's child-picker lists all of a section's child pages

- **WHEN** a user is on any page within a section that has child pages, on mobile
- **THEN** the shared header shows a tab row listing every child page of that section directly beneath the title and description, and allows switching between them, and no separate tab row is rendered within the page's own content

#### Scenario: Desktop header offers no child-picker

- **WHEN** a user is on any page within a section that has child pages, on desktop
- **THEN** the shared header shows only the page title (and, beneath it, the active page's description) — no tab row, dropdown, or other interactive picker is rendered in the header

#### Scenario: No third-level tab row anywhere

- **WHEN** a user is on `/dailies/raids` or `/plan/schedule`, on either platform
- **THEN** the page's own content renders no Today/Plan or other sub-tab row beneath the header

#### Scenario: Activating a tab returns from a route nested below a child page that has its own landing page

- **WHEN** a user is on a route nested below a child page whose own path is a landing page — a Library raid boss's detail route — and activates that child page's tab, on mobile
- **THEN** that child page's tab is shown as the active one, and the user is taken to the child page's landing screen: the raid-boss picker

#### Scenario: Activating a tab does nothing for a child page with no landing page of its own

- **WHEN** a user is on a route nested below a child page whose own path canonicalizes to a specific entity — a Library character, Machine of War, or NPC detail route — and activates that child page's tab, on mobile
- **THEN** no navigation occurs and the user stays on the page they were on

#### Scenario: Activating a tab adds one history entry

- **WHEN** a user activates a tab that takes them somewhere — a different child page, or the landing page of the child page they are nested below — on mobile
- **THEN** exactly one history entry is added, and a single Back press returns them to the page they activated the tab from

#### Scenario: Activating the tab of the exact current page does nothing

- **WHEN** a user is on a child page's own path and activates that page's tab, on mobile
- **THEN** no navigation occurs and the user stays on that page

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

### Requirement: Desktop header titles the active page and hosts the collapsed section-menu breadcrumb

On desktop, when the active top-level section has child pages, the page header's title SHALL be the active child page's own label, because the section menu beside the page already names the section. Only while the section menu is collapsed SHALL the header additionally show, before the title, a reopen button for the section menu and a plain, non-interactive "{Section label} ›" breadcrumb, so the location reads "{Section label} › {Active child label}" and the section menu's own header is not repeated. The breadcrumb and title SHALL NOT be links or pickers - switching to a different child happens only through the section menu, navigation search, or a bookmark/direct link. When the active top-level section has no child pages, the header title SHALL remain the section's own plain label with no breadcrumb and no reopen button.

#### Scenario: Expanded section menu shows only the child title

- **WHEN** a user on desktop is on a child page of a section that has children (e.g. `/plan/goals`) with the section menu expanded
- **THEN** the header title reads "Goals" as plain text with no breadcrumb, and the section menu header reads "Plan"

#### Scenario: Collapsed section menu shows a reopen button and breadcrumb

- **WHEN** a user on desktop hides the section menu on `/plan/goals`
- **THEN** the header, at its left edge, shows a reopen button, a plain "Plan ›" breadcrumb, and the "Goals" title, and no other reopen control remains elsewhere

#### Scenario: Breadcrumb and title update when the active child changes

- **WHEN** a user on desktop switches from one child page to a sibling child page within the same section, by any means (the section menu, navigation search, or a direct link)
- **THEN** the header title (and the breadcrumb's preceding section, when shown) reflects the newly active child

#### Scenario: A childless section keeps a plain title

- **WHEN** a user on desktop is on a top-level section's own page that has no child pages (e.g. Home)
- **THEN** the header shows only that section's own label as the title, with no breadcrumb separator and no reopen button

### Requirement: Desktop global bar separates global controls from page context

At viewport widths of at least 768px, the application SHALL show a slim global bar above the main rail, section menu, and page header. It SHALL contain app identity on the left, a navigation search launcher in the middle, and at the far right the existing UserJot feedback button followed by account/preferences access. The feedback button SHALL replace any notification control and SHALL keep its existing behavior, label, and unread indicator. Search and account access SHALL no longer appear in the sidebar. The page header SHALL retain the title/breadcrumb, description, and page tour, and SHALL NOT host the language selector, the feedback button, or the public board link (which moves to the account menu as "Roadmap"). The sidebar SHALL retain Create Goal, Sync, the general tour button, and its expansion control, with the expansion control alone on the first row as a full-width row button (whole row is the click target; icon at the right end when expanded, on the shared icon axis when compact; icon and `aria-expanded` reflect the state) and the tour button alone on the second row (a full-width pill when expanded, icon-only when compact) at the top of the rail, above Create Goal and Sync; the two SHALL NOT share a row. In the compact rail the toggle, tour, Create Goal, Sync, and navigation icons SHALL share the same size and horizontal center axis; in the expanded rail the Sync, Create Goal, and navigation icons SHALL share the same left edge. Theme and language selection SHALL be inside the account/preferences menu only on desktop, so there is one language control.

#### Scenario: Desktop global controls are present once

- **WHEN** a user views an authenticated desktop page
- **THEN** one global search launcher, one feedback button, and one top-right account trigger are visible, with no sidebar duplicates and no standalone page-header theme, language, or feedback controls

#### Scenario: Feedback button opens the existing widget

- **WHEN** a user activates the global bar's feedback button
- **THEN** the existing UserJot widget opens, and the public board is reachable from the account menu's Roadmap row

#### Scenario: Narrow desktop remains usable

- **WHEN** a desktop viewport is 768px wide and both navigation panels are expanded
- **THEN** global controls remain reachable without overlap, optional text truncates or hides with accessible labels retained, and wide page content scrolls within its own area rather than stretching the shell

#### Scenario: Mobile shell is preserved

- **WHEN** the viewport is below 768px
- **THEN** the existing mobile header, bottom navigation, drawer, and child-page tabs remain unchanged, the account drawer follows the shared account card layout (see account-menu), and there is no desktop top bar or section column

### Requirement: Persistent desktop section menu lists the active section's child pages

On desktop, a section with one or more child pages SHALL expose them in a persistent full-height column, from just under the global bar to the bottom of the viewport, beside the page content. The page header (title or breadcrumb, description, page tour) and route content SHALL sit in the content column to the right of the panel, so an expanded panel pushes the page header right instead of the header spanning above the panel; when the panel is collapsed or absent the header spans the full content width. The column's header row SHALL show the section label at the left and the collapse icon at the right, the whole row being the collapse button, with the same top padding as the page header so the section label and page title share a vertical center. Below it, child links SHALL appear in navigation order, visibly mark the active child including nested detail routes. Child rows SHALL be text-only, with no icons or counts. Clicking a child SHALL navigate directly to its route without closing the menu. Collapsing the menu SHALL remove the whole column and release its width - leaving no separate floating control - and the page header SHALL provide the reopen button (see the header title requirement). A childless destination SHALL render neither an empty section column nor any toggle. Main rail entries SHALL use label tooltips rather than child flyouts and SHALL retain existing section-entry resolution.

#### Scenario: Sibling pages stay visible

- **WHEN** a user visits Plan with its section menu expanded and selects Schedule
- **THEN** Goals, Projects, Insights, and Schedule remain visible as text-only rows and Schedule becomes active

#### Scenario: Section rows are text-only

- **WHEN** a signed-in user views the Plan section menu
- **THEN** Goals, Projects, Insights, and Schedule render as plain text rows with no icons and no count badge

#### Scenario: Rail tools sit at the top of the rail

- **WHEN** a user views the desktop main rail
- **THEN** the expansion toggle is alone on its first row and the tour button alone on its second row, both above Create Goal and Sync, and no control sits at the bottom of the rail

#### Scenario: Sync aligns with Create Goal

- **WHEN** the main rail is compact or expanded
- **THEN** the Sync control has the same size and horizontal center as the Create Goal control when compact, and the same icon left edge when expanded

#### Scenario: Search launcher has no tooltip

- **WHEN** a user hovers or focuses the global bar's search launcher
- **THEN** no tooltip appears, and the launcher keeps its accessible name and visible shortcut hint

#### Scenario: Single-child and childless sections

- **WHEN** a user opens Guild and then Home
- **THEN** Guild displays Members in its section menu, while Home displays no section column or section toggle

#### Scenario: Nested route highlights its collection

- **WHEN** a user opens a Library character detail route directly
- **THEN** Library is active in the main rail and Characters is active in the section menu

#### Scenario: Panel is a full-height sibling column of the page header

- **WHEN** a user views Plan with the section menu expanded at a desktop width
- **THEN** the panel extends from below the global bar to the bottom of the viewport, and the page header sits to its right above the page content

#### Scenario: Ctrl/Cmd+B toggles the section menu

- **WHEN** a user on a page whose section has a menu presses Ctrl+B (Cmd+B on macOS), including while an input is focused
- **THEN** the section menu collapses or expands, the main rail is unchanged, the browser default is prevented, and focus moves to the reopen button only if it was inside the panel being hidden

#### Scenario: Ctrl/Cmd+B does nothing on childless pages or the rail

- **WHEN** a user presses Ctrl+B on a page with no section menu (for example Home)
- **THEN** nothing changes and the keypress is not prevented; the main rail has no keyboard shortcut on any page

#### Scenario: Shortcut hint is visible on the expanded panel toggle only

- **WHEN** a user views the expanded section menu's collapse row on desktop
- **THEN** a small hint with the platform-aware shortcut ("⌘B" on macOS, "Ctrl+B" elsewhere, styled like the search launcher's hint) is visible, is hidden from assistive technology (which gets `aria-keyshortcuts` and the title instead), while the page header reopen button (collapsed view) and the main rail toggle show no visible hint

#### Scenario: Section menu animates like the main rail

- **WHEN** the section menu is toggled
- **THEN** its column width transitions over about 200ms with linear easing (no transition when reduced motion is preferred), content does not reflow during the transition, and once collapsed its links are inert, hidden from assistive technology, and out of the tab order

#### Scenario: Panel header names the section and collapses it

- **WHEN** a user views an expanded section menu
- **THEN** its header shows the section name and a collapse button

#### Scenario: Keyboard collapse and reopen

- **WHEN** a user activates the section collapse button with the keyboard
- **THEN** the column and its links leave the DOM and tab order, focus moves to the reopen button in the page header, and activating that button restores the column, moves focus to the collapse button, and announces the expanded state accurately

### Requirement: Desktop menu presentation resets only on full document load

On initial document load or refresh, the main rail SHALL start compact and the section menu SHALL start expanded. Each menu SHALL be independently controllable. Manual choices SHALL persist across all client-side navigation, including sibling pages, different sections, search navigation, and Back/Forward, using one shared section-menu choice. Visiting a childless page or temporarily switching to the mobile layout SHALL NOT reset either choice. These menu defaults SHALL NOT change the existing session memory for last-visited section children or persisted theme selection.

#### Scenario: Refresh resets both choices

- **GIVEN** the main rail has been expanded and the section menu collapsed
- **WHEN** the user refreshes on a child page
- **THEN** the main rail is compact and the section menu is expanded, including when an older saved sidebar preference exists

#### Scenario: Navigation preserves both choices

- **GIVEN** the main rail is expanded and the section menu collapsed
- **WHEN** the user navigates among Plan children, into Library through search, and Back/Forward
- **THEN** the main rail remains expanded and the section menu remains collapsed

#### Scenario: Childless page preserves hidden menu choice

- **GIVEN** the section menu is collapsed
- **WHEN** the user visits Home and returns to a section with children without refreshing
- **THEN** the section menu returns collapsed

#### Scenario: Breakpoint transitions preserve choices

- **GIVEN** a user has manually changed both desktop menu states
- **WHEN** the viewport shrinks below 768px and returns to desktop without refresh
- **THEN** both choices are retained

#### Scenario: Each toggle controls only its own menu

- **WHEN** the user expands or collapses one navigation panel
- **THEN** the other panel's expansion state is unchanged

### Requirement: Navigation shows a live indicator for an active Home Screen Event

While any Home Screen Event is active (any HSE, not only those with raid-point rules), the HSE navigation entry SHALL show a live indicator in every navigation renderer: the desktop side menu, the section tabs (mobile tabs), the mobile menu drawer and the desktop navigation dialog. The parent Dailies entry SHALL also show it, so it is visible with the menu collapsed and in the mobile bottom bar. With no active HSE no indicator is shown. The indicator SHALL NOT rely on colour alone: it carries a localized "event live" accessible name that assistive technology announces with the entry, and its pulse animation SHALL be disabled under `prefers-reduced-motion`. Activity is decided in UTC and updates without a reload when an event starts or ends. Search results do not show the indicator.

Assumptions:

- "Active" is the same single active HSE the HSE tab uses; loading and calendar errors show no indicator (never a false positive).

#### Scenario: Active event marks HSE and Dailies on desktop

- **GIVEN** an HSE is active
- **WHEN** the desktop shell renders with the side menu expanded, and again with it collapsed
- **THEN** the HSE entry (in the section menu and navigation dialog) and the Dailies entry each show the indicator with the accessible text "event live"

#### Scenario: Active event marks tabs and drawer on mobile

- **GIVEN** an HSE is active
- **WHEN** the mobile shell renders
- **THEN** the HSE tab in the section tab row, the HSE entry in the menu drawer, and the Dailies bottom-bar entry show the indicator with the accessible text

#### Scenario: Non-rule event still shows it

- **GIVEN** the active HSE has no raid-point rule (for example Faction Boost)
- **THEN** the indicator is shown

#### Scenario: No active event

- **GIVEN** no HSE is active, or the calendar is loading or failed
- **THEN** no indicator is shown anywhere

#### Scenario: Reduced motion

- **GIVEN** the user prefers reduced motion
- **THEN** the indicator is shown without a pulse animation

### Requirement: Events is a top-level authenticated section with Legendary Events as its child

The navigation model SHALL include a top-level **Legendary Events** section at `/legendary-events`, authenticated-only, with `mobilePlacement: "menu"` and a calendar-style icon, in the position the Events section held (after Progress, before Guild). Its children SHALL be resolved at runtime: first the static child **All events** at `/legendary-events`, which is the landing page; then one child per catalog Legendary Event in hub order (active by run start, then upcoming, then archived alphabetically), labelled with the event unit's localized name and carrying the unit's portrait, at `/legendary-events/:eventId`, with a description naming its lifecycle (active, upcoming or archived). While the catalog read is pending or fails only All events SHALL be listed. The old `/events`, `/events/legendary-events` and `/events/legendary-events/:eventId` routes SHALL NOT exist and SHALL NOT redirect; they fall through to the app's not-found handling. The section and its static child SHALL carry localized labels and descriptions in every supported locale, be indexed by navigation search, and follow the existing header, breadcrumb, document-title and last-visited-child rules for a section with children; a dynamic child SHALL be indexed by its localized name. The general navigation tour SHALL mention the Legendary Events section on desktop and mobile. `/legendary-events/:eventId` SHALL activate that event's child whatever its lifecycle: active-child resolution picks the matching child with the most specific path, so All events never shadows an event child.

#### Scenario: Desktop sidebar lists Events

- **WHEN** a signed-in user views the desktop sidebar
- **THEN** Legendary Events appears after Progress and before Guild, and activating it for the first time in the session lands on `/legendary-events`

#### Scenario: Sidebar returns to the last-visited event

- **GIVEN** the user last visited `/legendary-events/astarLysander` in this section
- **WHEN** they activate Legendary Events in the desktop sidebar again
- **THEN** they land on `/legendary-events/astarLysander`, per the last-visited-child rule

#### Scenario: Secondary nav lists active events then All events

- **GIVEN** Uthar and Farsight are active, Lysander is upcoming and Dante is archived
- **WHEN** a signed-in user opens the Legendary Events section on desktop or the mobile section tabs
- **THEN** the children read All events, Uthar, Farsight, Lysander, Dante (each event with the unit's portrait, in hub order), with Uthar's description naming it active, Lysander's upcoming and Dante's archived

#### Scenario: No active event

- **GIVEN** no event is active and Lysander is upcoming
- **WHEN** the section's children render
- **THEN** the children read All events then Lysander; while the catalog read is pending or failed only All events is listed

#### Scenario: Mobile drawer lists Events, bottom bar does not

- **WHEN** a signed-in mobile user opens the Menu drawer
- **THEN** Legendary Events and its All events child are listed with descriptions, and the bottom bar is unchanged

#### Scenario: Anonymous users do not see Events

- **WHEN** an anonymous user views the navigation (desktop sidebar or mobile drawer)
- **THEN** Legendary Events is absent, like Plan, Progress and Guild

#### Scenario: Search finds Legendary Events

- **GIVEN** Uthar is active and Dante is archived
- **WHEN** a user types "uthar" or "dante" into navigation search
- **THEN** the event appears under Legendary Events and selecting it opens its `/legendary-events/:eventId` page; typing "legendary" finds All events

#### Scenario: Old routes are gone

- **WHEN** a signed-in user opens `/events/legendary-events/astarLysander`, `/events/legendary-events` or `/events`
- **THEN** no Legendary Events page renders and the app's existing not-found handling applies (replace to `/home`)

#### Scenario: Detail route keeps the child active

- **WHEN** a user is on `/legendary-events/votanUthar` and Uthar is active, or on `/legendary-events/bloodDante` and Dante is archived
- **THEN** that event's child is the active tab, and on `/legendary-events` All events is active
