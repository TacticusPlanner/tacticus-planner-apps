## MODIFIED Requirements

### Requirement: A desktop keyboard shortcut toggles navigation search

On desktop, pressing Ctrl+K (or Cmd+K on macOS) from anywhere in the app SHALL open the navigation search dialog if it is currently closed, and close it if it is currently open, regardless of which element has focus at the time. The desktop global top bar's Search button SHALL display the platform-appropriate shortcut hint, allowing the hint in a tooltip when desktop width is constrained. This requirement is desktop-only; there is no mobile equivalent.

#### Scenario: Shortcut opens the dialog

- **WHEN** the navigation search dialog is closed and the user presses Ctrl+K (Cmd+K on macOS)
- **THEN** the dialog opens with its search input focused

#### Scenario: Shortcut closes an already-open dialog

- **WHEN** the navigation search dialog is already open and the user presses Ctrl+K (Cmd+K on macOS) again
- **THEN** the dialog closes

#### Scenario: Search button shows the shortcut hint

- **WHEN** a user views the desktop global top bar
- **THEN** the Search button displays the platform-appropriate shortcut hint ("⌘K" on macOS, "Ctrl+K" elsewhere)

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
- **THEN** the header description updates to the newly active child's own description, while the header breadcrumb updates to the active section and child

### Requirement: Desktop header shows a static section/child breadcrumb, with no picker

On desktop, when the active top-level section has child pages, the page header's title SHALL be rendered as a plain, non-interactive breadcrumb reading "{Section label} › {Active child label}". Neither the section segment nor the child segment SHALL be clickable or otherwise interactive — switching to a different child happens only through the section menu, navigation search, or a bookmark/direct link, never through the header itself. When the active top-level section has no child pages, the header title SHALL remain the section's own plain label, unchanged from today.

#### Scenario: A section with children shows a plain breadcrumb title

- **WHEN** a user on desktop is on any child page of a section that has children (e.g. `/library/machines-of-war`)
- **THEN** the header title reads "Lookup › Machines of War" as plain text, with neither segment clickable

#### Scenario: Breadcrumb updates when the active child changes

- **WHEN** a user on desktop switches from one child page to a sibling child page within the same section, by any means (the section menu, navigation search, or a direct link)
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

## REMOVED Requirements

### Requirement: The shared page header hosts a section's child-page picker

**Reason**: Replace flyout wording with the persistent section menu and adopt the Schedule change's current mobile behavior, without its obsolete third-level Raids tabs or project-detail routes.
**Migration**: Use "The shared page header hosts each section's child-page picker". This replacement shares its name with the Schedule change; sync must keep a single merged requirement with this change's desktop wording.

### Requirement: Desktop sidebar exposes each section's child pages via a hover/click flyout

**Reason**: Persistent section navigation replaces transient flyouts.
**Migration**: Use the active section menu or global navigation search to reach child pages. Main rail entries retain last-visited-child navigation.

## ADDED Requirements

### Requirement: The shared page header hosts each section's child-page picker

On mobile, each top-level section that has child pages (`NavItem.children`) SHALL expose them via a routed tab row directly beneath the header's title and description, replacing any tab row a page previously rendered on its own. This applies to every multi-child section, including Dailies and Plan (whose children are Goals, Projects, Insights, and Schedule). No child page renders a further level of tabs inside its own content.

On desktop, the header does not host a child-page picker at all — a section's child pages are discovered through the desktop section menu instead (see the persistent desktop section menu requirement), and the desktop header shows only a static breadcrumb (see the breadcrumb requirement). On mobile, the menu drawer also lists a section's child pages, per the drawer requirement — that duplication with the mobile header's tab row is intentional and out of scope for this capability to remove.

#### Scenario: The header's child-picker lists all of a section's child pages

- **WHEN** a user is on any page within a section that has child pages, on mobile
- **THEN** the shared header shows a tab row listing every child page of that section directly beneath the title and description, and allows switching between them, and no separate tab row is rendered within the page's own content

#### Scenario: Desktop header offers no child-picker

- **WHEN** a user is on any page within a section that has child pages, on desktop
- **THEN** the shared header shows only the static breadcrumb title (and, beneath it, the active page's description) — no tab row, dropdown, or other interactive picker is rendered in the header

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

### Requirement: Desktop global bar separates global controls from page context

At viewport widths of at least 768px, the application SHALL show a slim global bar above the main rail, page header, and section menu. It SHALL contain app identity on the left, a navigation search launcher in the middle, and account/preferences access at the far right. Search and account access SHALL no longer appear in the sidebar. The page header SHALL retain the breadcrumb, description, page tour, language, feedback, and board link; the sidebar SHALL retain Create Goal, Sync, general tour, and its expansion control. Theme selection SHALL be inside the account/preferences menu only on desktop.

#### Scenario: Desktop global controls are present once

- **WHEN** a user views an authenticated desktop page
- **THEN** one global search launcher and one top-right account trigger are visible, with no sidebar duplicates and no standalone page-header theme selector

#### Scenario: Narrow desktop remains usable

- **WHEN** a desktop viewport is 768px wide and both navigation panels are expanded
- **THEN** global controls remain reachable without overlap, optional text truncates or hides with accessible labels retained, and wide page content scrolls within its own area rather than stretching the shell

#### Scenario: Mobile shell is preserved

- **WHEN** the viewport is below 768px
- **THEN** the existing mobile header, bottom navigation, drawer, child-page tabs, account drawer, and theme placement remain unchanged, with no desktop top bar or section column

### Requirement: Persistent desktop section menu lists the active section's child pages

On desktop, a section with one or more child pages SHALL expose them in a persistent column beside page content below the page header. It SHALL show the section label and all child links in navigation order, visibly mark the active child including nested detail routes, and have an independent collapse control. Clicking a child SHALL navigate directly to its route without closing the menu. A collapsed menu SHALL hide its links, release its column width, and retain a keyboard-accessible reopen control. A childless destination SHALL render neither an empty section column nor its toggle. Main rail entries SHALL use label tooltips rather than child flyouts and SHALL retain existing section-entry resolution.

#### Scenario: Sibling pages stay visible

- **WHEN** a user visits Plan with its section menu expanded and selects Schedule
- **THEN** Goals, Projects, Insights, and Schedule remain visible and Schedule becomes active

#### Scenario: Single-child and childless sections

- **WHEN** a user opens Guild and then Home
- **THEN** Guild displays Members in its section menu, while Home displays no section column or section toggle

#### Scenario: Nested route highlights its collection

- **WHEN** a user opens a Library character detail route directly
- **THEN** Library is active in the main rail and Characters is active in the section menu

#### Scenario: Keyboard collapse and reopen

- **WHEN** a user activates the section collapse control with the keyboard
- **THEN** links leave the tab order, focus remains available on the reopen control, and activating it restores the links with an accurately announced expanded state

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
