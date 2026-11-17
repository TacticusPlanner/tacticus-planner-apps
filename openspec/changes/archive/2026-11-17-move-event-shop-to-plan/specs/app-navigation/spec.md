## MODIFIED Requirements

### Requirement: The shared page header hosts each section's child-page picker

On mobile, each top-level section that has child pages (`NavItem.children`) SHALL expose them via a routed tab row directly beneath the header's title and description. This applies to every multi-child section, including Dailies and Plan (whose children are Goals, Projects, Insights, Schedule, and Event shop). No child page renders a further level of tabs inside its own content.

On desktop, the header does not host a child-page picker at all — a section's child pages are discovered through the desktop section menu instead (see the persistent desktop section menu requirement), and the desktop header shows only the active page's title, plus a reopen button and "{Section} ›" breadcrumb while the section menu is collapsed (see the header title requirement). On mobile, the menu drawer also lists a section's child pages, per the drawer requirement — that duplication with the mobile header's tab row is intentional.

#### Scenario: The header's child-picker lists all of a section's child pages

- **WHEN** a user is on any page within a section that has child pages, on mobile
- **THEN** the shared header shows a tab row listing every child page of that section directly beneath the title and description, and allows switching between them, and no separate tab row is rendered within the page's own content

#### Scenario: Desktop header offers no child-picker

- **WHEN** a user is on any page within a section that has child pages, on desktop
- **THEN** the shared header shows only the page title (and, beneath it, the active page's description; while the section menu is collapsed, also the reopen button and "{Section} ›" breadcrumb) — no tab row, dropdown, or other interactive picker is rendered in the header

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

### Requirement: Persistent desktop section menu lists the active section's child pages

On desktop, a section with one or more child pages SHALL expose them in a persistent full-height column, from just under the global bar to the bottom of the viewport, beside the page content. The page header (title or breadcrumb, description, page tour) and route content SHALL sit in the content column to the right of the panel, so an expanded panel pushes the page header right instead of the header spanning above the panel; when the panel is collapsed or absent the header spans the full content width. The column's header row SHALL show the section label at the left and the collapse icon at the right, the whole row being the collapse button, with the same top padding as the page header so the section label and page title share a vertical center. Below it, child links SHALL appear in navigation order, visibly mark the active child including nested detail routes. Each child row SHALL lead with its icon (see the navigation icons requirement) and SHALL show no counts. Clicking a child SHALL navigate directly to its route without closing the menu. Collapsing the menu SHALL remove the whole column and release its width - leaving no separate floating control - and the page header SHALL provide the reopen button (see the header title requirement). A childless destination SHALL render neither an empty section column nor any toggle. Main rail entries SHALL use label tooltips rather than child flyouts and SHALL retain existing section-entry resolution.

#### Scenario: Sibling pages stay visible

- **WHEN** a user visits Plan with its section menu expanded and selects Schedule
- **THEN** Goals, Projects, Insights, Schedule, and Event shop remain visible and Schedule becomes active

#### Scenario: Section rows lead with an icon

- **WHEN** a signed-in user views the Plan section menu
- **THEN** Goals, Projects, Insights, Schedule, and Event shop each render with a leading icon and no count badge

#### Scenario: Rail tools sit at the top of the rail

- **WHEN** a user views the desktop main rail
- **THEN** the expansion toggle is alone on its first row and the tour button alone on its second row, both above Create Goal and Sync, and no control sits at the bottom of the rail

#### Scenario: Sync aligns with Create Goal

- **WHEN** the main rail is compact or expanded
- **THEN** the Sync control has the same size and horizontal center as the Create Goal control when compact, and the same icon left edge when expanded

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
