## MODIFIED Requirements

### Requirement: Navigation shows a live indicator for a running Hero Release Event

While an HRE is running, the HRE navigation entry SHALL show the same live indicator as the HSE entry, in the same renderers and with the same accessibility rules. Activity SHALL be decided in UTC, with the HRE tab's own selection of the running HRE. Loading and calendar errors SHALL show no indicator.

#### Scenario: Only an HRE running

- **GIVEN** Zapspitta's HRE is running and no HSE is active
- **THEN** the HRE entry and the Dailies entry show the indicator, and the HSE entry does not

#### Scenario: Neither running

- **GIVEN** no HSE and no HRE is active
- **THEN** no indicator is shown

### Requirement: Navigation shows a live indicator for a running Quest Event

While a quest is running, the Quest navigation entry SHALL show the same live indicator as the HSE and HRE entries, in the same renderers and with the same accessibility rules. The parent Dailies entry SHALL show the indicator while an HSE, an HRE or a quest is running. Activity SHALL be decided in UTC with the Quest tab's own "running" rule. Loading and calendar errors SHALL show no indicator.

#### Scenario: Only a quest running

- **GIVEN** Nubari's quest is running, and no HSE or HRE is
- **THEN** the Quest entry and the Dailies entry show the indicator, and the HSE and HRE entries do not

### Requirement: Mobile menu drawer lists top-level sections with their child pages nested beneath them

The mobile bottom navigation's "Menu" drawer SHALL list every top-level navigation section, with each section's child pages (if any) shown nested beneath it as direct links.

#### Scenario: Drawer keeps listing child pages

- **WHEN** the mobile menu drawer opens, for a section that has child pages
- **THEN** both the section's own entry and its child pages are shown as direct links in the drawer

#### Scenario: Mobile bottom bar keeps primary destinations unchanged

- **WHEN** the mobile bottom navigation bar renders
- **THEN** it shows only the sections and primary actions designated `mobilePlacement: "primary"`

### Requirement: The shared page header hosts each section's child-page picker

On mobile, each top-level section that has child pages (`NavItem.children`) SHALL expose them via a routed tab row directly beneath the header's title and description. This applies to every multi-child section, including Dailies and Plan (whose children are Goals, Projects, Insights, and Schedule). No child page renders a further level of tabs inside its own content.

On desktop, the header does not host a child-page picker at all — a section's child pages are discovered through the desktop section menu instead (see the persistent desktop section menu requirement), and the desktop header shows only the active page's title, plus a reopen button and "{Section} ›" breadcrumb while the section menu is collapsed (see the header title requirement). On mobile, the menu drawer also lists a section's child pages, per the drawer requirement — that duplication with the mobile header's tab row is intentional.

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
