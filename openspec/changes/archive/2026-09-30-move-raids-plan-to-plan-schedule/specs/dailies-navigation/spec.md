## ADDED Requirements

### Requirement: The Raids tab is the Today page

The Raids tab SHALL render the Today page directly at `/dailies/raids`, with no sub-tab bar. `/dailies/raids/today` and `/dailies/raids/plan` SHALL NOT be routes. The multi-day plan is not part of Dailies (see `daily-raids-plan` "Schedule is a Plan section page").

#### Scenario: Opening Raids shows Today

- **WHEN** the user opens `/dailies/raids`
- **THEN** the Today page renders, the Raids primary tab is active, and no Today/Plan sub-tab bar is rendered

#### Scenario: Former sub-tab paths are not routes

- **WHEN** the user opens `/dailies/raids/today`
- **THEN** the app treats it as an unknown route, the same as any other path it does not serve

### Requirement: Today's project selector and Planning Settings share one row

On the Today page, the project selector SHALL render right-aligned in its own row with the Planning Settings trigger trailing after it, above the schedule. Below the 768px mobile breakpoint the project selector SHALL render as an icon-only trigger retaining an accessible name for the full label; at or above 768px it SHALL show its label.

#### Scenario: Desktop row

- **WHEN** the user opens `/dailies/raids` at or above 768px
- **THEN** the project selector and the Planning Settings trigger are right-aligned together in one row above the schedule, with nothing leading in that row

#### Scenario: Mobile selector compresses

- **WHEN** the user opens `/dailies/raids` below 768px
- **THEN** the project selector renders its icon only, without a visible text label, while remaining identifiable via its accessible name, and the Planning Settings trigger follows it

### Requirement: Each primary tab is its own route

Every primary tab SHALL be addressable by its own URL path, not by client-only tab state. Navigating directly to a tab's URL (fresh load, bookmark, shared link, or browser back/forward) SHALL land on that tab's content with the correct tab highlighted as active.

#### Scenario: Direct navigation to a primary tab's URL

- **WHEN** a user loads a primary tab's URL directly (e.g. `/dailies/shops`) without first visiting `/dailies`
- **THEN** the Dailies tab bar renders with that tab's content shown and highlighted as active

#### Scenario: Browser back/forward navigates between tabs

- **WHEN** a user switches tabs one or more times and then uses the browser's back button
- **THEN** the previously-active tab's URL and content are restored

## REMOVED Requirements

### Requirement: Each tab is its own route

**Reason**: Its Raids sub-tab scenario no longer applies.
**Migration**: "Each primary tab is its own route" above.

### Requirement: Raids sub-navigation

**Reason**: Raids has one page now; the plan moved to Plan › Schedule.
**Migration**: "The Raids tab is the Today page" above; `daily-raids-plan` "Schedule is a Plan section page".

### Requirement: Raids sub-tabs open their implemented pages

**Reason**: No sub-tabs remain.
**Migration**: Today renders at `/dailies/raids`; Schedule at `/plan/schedule`.

### Requirement: Raids tabs and project selector share one row

**Reason**: No sub-tabs remain to share the row with.
**Migration**: "Today's project selector and Planning Settings share one row" above.

### Requirement: Project selector compresses on mobile

**Reason**: Restated without the sub-tab wording.
**Migration**: "Today's project selector and Planning Settings share one row" above (mobile scenario).
