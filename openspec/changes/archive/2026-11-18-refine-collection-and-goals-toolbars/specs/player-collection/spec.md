## MODIFIED Requirements

### Requirement: Collection has a toolbar with search, sort, filters and quick filters

The Collection page SHALL show the page toolbar (`app-page-layout`) above the faction groups whenever the catalog has loaded. The toolbar SHALL contain:

- in its Find slot: a name search, a Filters control, while any filter is active a Clear filters action, then for a signed-in player the Select units button (see "Collection has a select mode for creating goals") and the Snapshots menu (`roster-snapshot-management`);
- in its View slot: the Layout control (see "Collection switches between the Cards and Roster views"), Group by (see "Faction grouping can be switched off") and a Sort control;
- on its chip row: the Owned only chip, then the quick-filter chips.

The toolbar SHALL show how many filters are active. The search, each standalone filter that is set, and the quick filter each count as one. A range with a lowest and a highest end counts as one. The layout, the grouping and Owned only do not count. Clear filters SHALL remove the search, every standalone filter and the quick filter in one step, and leave the sort, the layout, the grouping and Owned only unchanged.

The quick-filter chips SHALL be a single-select group: selecting a chip selects that quick filter, and selecting the selected chip again clears it.

Each available quick-filter chip SHALL show, after its label, how many units it would list: the units that match the search, the standalone filters and Owned only together with that quick filter. The count SHALL be the chip's accessible description, not part of its name. A disabled chip SHALL show no count.

While the catalog is loading or has failed to load, the toolbar SHALL NOT be shown.

On desktop (at least 768px):

- Find SHALL lead the first row and the View controls SHALL sit at its right end; when the window is too narrow the View controls SHALL wrap under Find, still at the right, without truncating their labels;
- the Filters control SHALL expand and collapse the standalone filter controls inline below the toolbar, opening expanded when a standalone filter is already active;
- the chip row SHALL stay on one line and scroll sideways when the chips do not fit, as on mobile.

On mobile (below 768px):

- the search and the Filters control SHALL fill the first row, with the toolbar's View button at its right; the View button SHALL open a "View options" sheet holding Layout, Group by and Sort, stacked and full width, closed by Done;
- the Filters control SHALL open the standalone filter controls in a bottom sheet with its own Clear filters action and a Done action that closes it;
- the chip row SHALL scroll sideways in one line;
- the page SHALL NOT scroll horizontally at 420px.

#### Scenario: Quick-filter chips show their counts

- **GIVEN** a synced player with the Xenos alliance filter set, of whose listed Xenos units 3 are ready to rank up
- **WHEN** the toolbar renders
- **THEN** the Ready to rank up chip shows 3 and is described as "3 units", and selecting it lists those 3 units

#### Scenario: The desktop chip row stays on one line

- **WHEN** Collection is viewed at 1280px with every quick-filter chip shown
- **THEN** the chips sit on one line that scrolls sideways if needed, and none wraps onto a second line

#### Scenario: Active filter count and clear

- **GIVEN** the user has searched "ti", set the Imperial alliance filter and selected the Need to level quick filter, with sort Rank and the Roster layout
- **WHEN** they look at the toolbar
- **THEN** it reports 3 active filters, and Clear filters empties the search, removes the alliance filter and the quick filter, lists every unit again, and keeps sort Rank and the Roster layout

#### Scenario: Quick filter chips are single-select

- **GIVEN** the Can ascend chip is selected
- **WHEN** the user selects the Need to level chip, then selects it again
- **THEN** first only Need to level is selected, then no quick filter is selected

#### Scenario: Desktop toolbar

- **GIVEN** a desktop viewport and no active standalone filter
- **WHEN** the page renders and the user then activates the Filters control
- **THEN** search and Filters lead the toolbar row, Layout, Group by and Sort sit at its right end, Owned only leads the chip row, and activating Filters shows the standalone filters inline below the toolbar without covering the faction groups

#### Scenario: Mobile toolbar

- **GIVEN** a mobile viewport at 420px
- **WHEN** the user activates the Filters control, sets a rarity filter and selects Done, then taps View
- **THEN** a bottom sheet with the standalone filters opens, Done closes it, the list shows only units of that rarity, the Filters control shows 1 active filter, the View sheet holds Layout, Group by and Sort, and the page does not scroll horizontally

### Requirement: Collection has a select mode for creating goals

Collection SHALL show a **Select units** button in the toolbar's Find slot when the player is signed in, the roster is available, at least one unit is listed and Compare is off, at every width; it SHALL be hidden while select mode is on. Pressing it SHALL enter select mode:

- every listed tile (Cards) and row (Roster, including the mobile expandable rows) SHALL show a checkbox, and activating the tile or row SHALL toggle its selection instead of opening the unit page;
- each selectable item SHALL be a checkbox with an accessible name naming the unit and its checked state;
- a bar pinned to the bottom of the viewport SHALL show the number of selected units, **Select all shown** (adds every listed unit), **Clear**, **Create goals** (disabled with nothing selected) and **Done**.

The selection SHALL survive search, sort, filter, quick filter, grouping and view changes, and SHALL count units no longer listed. Done, turning Compare on, or leaving the page SHALL end select mode and discard the selection. After the dialog creates every unit's goals, select mode SHALL end.

#### Scenario: Selecting ready-to-rank-up units

- **GIVEN** a signed-in, synced player on Collection
- **WHEN** they turn on Select units, apply the Ready to rank up quick filter and press Select all shown
- **THEN** every listed unit is checked and the bar reads "N selected" for that count

#### Scenario: A tile toggles instead of navigating

- **GIVEN** select mode is on
- **WHEN** the player activates a tile
- **THEN** the tile is checked and the page stays on Collection

#### Scenario: Selection survives a filter change

- **GIVEN** two units are selected
- **WHEN** the player changes the faction filter so neither is listed
- **THEN** the bar still reads "2 selected"

#### Scenario: Not available without a roster

- **WHEN** a signed-out visitor, or a signed-in player without a synced roster, opens Collection
- **THEN** no Select units button is shown

### Requirement: Collection has a page tour

The Collection page SHALL register a page tour, startable from the page's tour control, on both desktop and mobile. The tour SHALL explain:

- the toolbar (search, sort and filters);
- the View controls (Layout, Group by and Sort) and the Owned only chip;
- the quick filters;
- for a signed-in player, Select units and the Snapshots menu (see `collection-snapshot-compare`);
- the faction groups;
- an owned unit's progression indicators;
- greyed-out unowned units;
- that selecting a unit opens that unit's Library page.

While faction grouping is off there are no faction groups, so the faction step SHALL be left out; the unit steps still target tiles or rows.

The faction and unit steps SHALL target the view currently shown: a faction card and tiles in the Cards view, a faction section and rows in the Roster view. In the Roster view on mobile, the unit step SHALL say that tapping a row expands it and that the expanded row opens the Library page.

Tour steps SHALL target elements that exist in the rendered layout of each form. A step whose element is absent SHALL be left out:

- the summary, when no roster is available;
- the owned unit, when the player owns no unit or none matches;
- the unowned unit, when none is listed (including while unowned units are hidden);
- any unit or faction group, when the filters match nothing.

Whichever unit steps remain SHALL still tell the player how a unit opens its Library page.

#### Scenario: Desktop tour

- **GIVEN** a desktop viewport showing the Cards view
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the desktop layout, the steps include the toolbar, the View controls and the quick filters, and a tile step says that a tile opens the unit's Library page

#### Scenario: Mobile tour

- **GIVEN** a mobile viewport showing the Cards view
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the mobile layout (the toolbar's Filters button, not the closed filter sheet), the steps include the toolbar's View button and the quick filters, and a tile step says that a tile opens the unit's Library page

#### Scenario: Desktop tour in the Roster view

- **GIVEN** a desktop viewport showing the Roster view with owned and unowned units listed
- **WHEN** the user starts the page tour
- **THEN** the faction step highlights a roster section, the unit steps highlight roster rows, and a unit step says that a row opens the unit's Library page

#### Scenario: Mobile tour in the Roster view

- **GIVEN** a mobile viewport showing the Roster view
- **WHEN** the user starts the page tour
- **THEN** the unit steps highlight roster rows, and a unit step says that tapping a row expands it and the expanded row opens the unit's Library page

#### Scenario: Tour without owned units

- **GIVEN** the user is signed out, so every unit is greyed out and the owned-unit step is left out
- **WHEN** they start the page tour
- **THEN** the unowned-unit step still says how a unit opens its Library page

#### Scenario: Tour with unowned units hidden

- **GIVEN** Owned only is on
- **WHEN** the user starts the page tour
- **THEN** the unowned-unit step is left out and the owned-unit step says how a unit opens its Library page

#### Scenario: Tour with grouping off

- **GIVEN** Group by is None
- **WHEN** the user starts the page tour
- **THEN** the faction step is left out and the unit steps highlight a tile (Cards) or a row (Roster)

#### Scenario: Tour with no matching units

- **GIVEN** the active filters match no unit
- **WHEN** the user starts the page tour
- **THEN** the tour covers the toolbar, the View controls and the quick filters and leaves out the faction and unit steps
