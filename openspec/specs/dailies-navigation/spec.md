# dailies-navigation Specification

## Purpose

Gives players a single `/dailies` entry point for day-to-day play activities (raiding, shops, onslaught, salvage, arena, guild raids), with a working Raids section and clearly-marked placeholders for everything not yet built.

## Requirements

### Requirement: Dailies primary navigation

The system SHALL present a `/dailies` section with 6 primary tabs — Raids, Shops, Onslaught, Salvage Run, Arena, Guild Raids — and SHALL land the user on the Raids tab by default.

#### Scenario: Opening Dailies lands on Raids

- **WHEN** a signed-in user navigates to `/dailies`
- **THEN** all 6 tabs are visible and the Raids tab's content is shown without further navigation

#### Scenario: Switching to a tab preserves the tab bar

- **WHEN** the user selects any of the 6 primary tabs
- **THEN** the tab bar remains visible and the selected tab is highlighted as active

### Requirement: Each tab is its own route

Every primary tab and every Raids sub-tab SHALL be addressable by its own URL path, not by client-only tab state. Navigating directly to a tab's URL (fresh load, bookmark, shared link, or browser back/forward) SHALL land on that tab's content with the correct tab highlighted as active.

#### Scenario: Direct navigation to a primary tab's URL

- **WHEN** a user loads a primary tab's URL directly (e.g. `/dailies/shops`) without first visiting `/dailies`
- **THEN** the Dailies tab bar renders with that tab's content shown and highlighted as active

#### Scenario: Direct navigation to a Raids sub-tab's URL

- **WHEN** a user loads a Raids sub-tab's URL directly (e.g. `/dailies/raids/plan`) without first visiting `/dailies/raids`
- **THEN** the Raids sub-tab bar renders with that sub-tab's content shown and highlighted as active

#### Scenario: Browser back/forward navigates between tabs

- **WHEN** a user switches tabs one or more times and then uses the browser's back button
- **THEN** the previously-active tab's URL and content are restored

### Requirement: Placeholder tabs show Under Construction

Every primary tab other than Raids and Shops SHALL render the shared "Under Construction" placeholder
rather than an error, a blank page, or partial functionality. The Shops tab SHALL render the Shops
page (daily shop recommendations for the selected project), not the placeholder.

#### Scenario: Opening a non-Raids tab

- **WHEN** the user opens Onslaught, Salvage Run, Arena, or Guild Raids
- **THEN** the shared Under Construction placeholder is shown for that tab

#### Scenario: Opening Shops

- **WHEN** the user opens the Shops tab
- **THEN** the Shops recommendations page is shown rather than the Under Construction placeholder

### Requirement: Raids sub-navigation

The Raids tab SHALL present 2 sub-tabs — Today, Raids Plan — and SHALL land the user on Today by default.

#### Scenario: Opening Raids lands on Today

- **WHEN** the user opens the Raids tab
- **THEN** the Today sub-tab's content is shown without further navigation, and the Raids Plan sub-tab is visible but not selected

### Requirement: Raids sub-tabs open their implemented pages

The Today and Raids Plan sub-tabs SHALL render their respective implemented pages rather than placeholder content.

#### Scenario: Opening Today

- **WHEN** the user selects the Today sub-tab
- **THEN** the Today raid schedule page is shown

#### Scenario: Opening Raids Plan

- **WHEN** the user selects the Raids Plan sub-tab
- **THEN** the multi-day Raids Plan page is shown

### Requirement: Raids tabs and project selector share one row

The Raids sub-tab bar (Today, Raids Plan) and the project selector SHALL render in the same row — the sub-tabs leading (left-aligned), the project selector trailing (right-aligned) — rather than in two stacked rows.

#### Scenario: Tabs and selector appear in one row

- **WHEN** the user opens the Raids tab (Today or Raids Plan)
- **THEN** the Today/Raids Plan sub-tabs and the project selector are both visible in the same row

### Requirement: Project selector compresses on mobile

Below the 768px mobile breakpoint, the project selector in the Raids tab bar row SHALL render as an icon-only trigger, retaining an accessible name for the full label. The Today/Raids Plan sub-tab labels SHALL continue to show their text at every breakpoint.

#### Scenario: Mobile project selector shows an icon without a text label

- **WHEN** the Raids tab bar is viewed below the 768px breakpoint
- **THEN** the project selector renders its icon only, without a visible text label, while remaining identifiable via its accessible name

#### Scenario: Sub-tab labels remain text on mobile

- **WHEN** the Raids tab bar is viewed below the 768px breakpoint
- **THEN** the Today and Raids Plan sub-tab labels are still shown as text
