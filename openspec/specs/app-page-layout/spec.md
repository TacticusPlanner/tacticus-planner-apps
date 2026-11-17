# app-page-layout Specification

## Purpose

Gives every page of the web app the same header and toolbar, so a page's title, help, settings, filters and view options sit in the same places on every page (ui-style-guide rules 1 to 3).

## Requirements

### Requirement: Every page has one page header

The app shell SHALL render the page header above every page: the page's title (its `<h1>`), the help action ("Tour this page") right after it, a one-line description under the title row, then a divider. A page that has settings SHALL show one "Settings" button at the right end of the title row; the page supplies it, and a page without settings shows nothing there. On desktop (at least 768px) the Settings button SHALL show the settings icon and the label "Settings". On mobile (below 768px) it SHALL be an icon button in the mobile header, next to the icon-only tour button, with the accessible name "Settings".

#### Scenario: Desktop header with settings

- **GIVEN** a page that has settings, at 1440px
- **WHEN** it renders
- **THEN** the header shows the title, the tour action, and at the right end of the same row a "Settings" button with its icon, with the description on the line below

#### Scenario: Mobile header with settings

- **GIVEN** the same page at 390px
- **WHEN** it renders
- **THEN** the mobile header shows a Settings icon button named "Settings" beside the tour button

#### Scenario: Page without settings

- **WHEN** a page with no settings renders
- **THEN** its header shows no Settings button and leaves no empty space for one

### Requirement: Pages put their controls in the page toolbar

A page with controls SHALL show them in the page toolbar, one row under the header with three slots from left to right: **Find** (search, the "Filters" button and filter selects; it grows), **View** (Layout, Group by, Sort; at the right) and **Actions** (the page's create action; at the far right). Quick-filter chips SHALL take the row below. A page's filter entry point SHALL be labelled "Filters" at every width.

On desktop (at least 768px), when the row is too narrow the View and Actions slots SHALL wrap together under Find, still at the right, so the page action is never alone on a line.

On mobile (below 768px), the View slot SHALL collapse into one "View" button at the top right of the toolbar. It SHALL open a sheet titled "View options" holding the same controls, stacked and full width, with a Done button that closes it. Find SHALL wrap inside its own slot.

#### Scenario: Desktop slot order

- **GIVEN** a page with a search, Filters, Group by and a create action at 1440px
- **WHEN** it renders
- **THEN** search and Filters lead the toolbar row, Group by sits toward the right, and the create action is at the far right

#### Scenario: Mobile View sheet

- **GIVEN** the same page at 390px
- **WHEN** the user taps View
- **THEN** a "View options" sheet opens with Group by at full width, and Done closes it

### Requirement: Group by and Layout are labelled segmented controls

Group by and Layout SHALL each be one labelled segmented control (2 to 4 exclusive options) with its visible label before it in the toolbar and above it in the View sheet. It SHALL be exposed to assistive technology as a radio group named by its label, with the selected option checked. One option is always selected: pressing the selected option again SHALL keep it selected. Group by SHALL offer "None" when the list can be ungrouped.

#### Scenario: Re-pressing the selected option

- **GIVEN** Group by reads Faction
- **WHEN** the user presses Faction again
- **THEN** Group by still reads Faction and the list does not change
