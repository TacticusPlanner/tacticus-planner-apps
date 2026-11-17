## MODIFIED Requirements

### Requirement: Raid grouping is picked once and remembered per device

Dailies › Raids SHALL offer Group by, the shared labelled segmented control in the page toolbar's View slot (behind the View button on mobile), with **Campaign** (the default: "Today groups raids by campaign", and the HSE, HRE and Home lists in campaign groups) and **Upgrade** (one card per upgrade listing the battles that drop it, as before campaign grouping; the HSE, HRE and Home lists show every battle on its own row naming its location in full, in the list's own order). There is no None option: a raid list is always grouped. It SHALL be the only place the grouping is picked, and every raid list (Today's plan, Bonus Raids, HSE, HRE, Home's raids widget) SHALL follow it. The choice SHALL be remembered in that browser (an unknown stored value reads as Campaign) and SHALL apply in other open tabs. Plan › Schedule is unaffected. Each change SHALL report `daily_raids_grouping_changed` with the picked grouping and nothing else; picking the current grouping again reports nothing.

#### Scenario: Switching to upgrade grouping

- **GIVEN** the player has never picked a grouping on this browser
- **WHEN** they pick Upgrade on Dailies › Raids and then open Home
- **THEN** Today lists one card per upgrade, Home lists each battle on its own row, `daily_raids_grouping_changed` is reported with `upgrade`, and reloading keeps Upgrade picked

### Requirement: Today quick filters

Today SHALL show a quick-filter chip row, captioned "Quick filters", on the page toolbar's chip row below the Find and View controls, with two chips: **Fewer raids** and **Combine goals**. Either, both or neither MAY be on. Each chip SHALL carry a tooltip explaining what it does, and while a chip is on Today SHALL show one line under the row stating what it changes. The state SHALL be remembered per device (in this browser's storage, not the URL), so reload and opening Today again from the navigation restore the last chips chosen on this device; the HSE and HRE tabs show the same chips. It SHALL NOT be read from or written to the URL; unknown stored values are ignored.

The chips SHALL change only Today's plan and Bonus Raids (including the raids-left list after the daily energy limit). Plan > Schedule, Goals estimates and dates, Insights, the HSE and HRE tabs and the Home raids widget SHALL be computed as if both chips were off. The chips combine with the applied Raids Filters.

**Fewer raids**: after the preferred nodes are chosen (least energy per item among nodes that pass the Raids Filters), only the node(s) with the highest energy cost per battle SHALL be kept. Tied nodes left after that keep the expected-gold ordering. A goal's pinned farm locations SHALL be used as chosen.

**Combine goals** (in the spirit of V1's "By total materials" farm order): Today SHALL plan raids as if every in-scope goal (all goals, or the selected project's goals) were one goal, ignoring goal priority when spending energy. Inventory SHALL still be allocated to goals in priority order, and shop and Onslaught supply SHALL still be applied per goal in priority order. The remaining need of every in-scope goal, summed per resource across all of the goal's stages, SHALL form one pool, and the day's energy SHALL be spent on that pool longest-to-finish resource first (then greatest energy cost), with each node's daily attempt cap shared as usual. A resource SHALL be farmed at the nodes chosen for the highest-priority goal that needs it. Each raid entry SHALL be credited to the highest-priority goal still needing that resource (for goal totals). Today's plan and Bonus Raids SHALL then be shown as one combined list with no goal headers, ordered by each resource's pooled urgency: the days to finish it, longest first, then the energy to clear the resource's whole pooled need at the nodes it is farmed at, most first (the same order a goal group uses), with same-campaign upgrades of similar energy kept together as described under "Today and Bonus Raids prioritize long-running resources". Bonus Raids' top-entries cut SHALL be taken from that order. Each resource card SHALL show the have/need over every in-scope goal. This overrides "Today and Bonus Raids prioritize long-running resources" and goal-by-goal spending while the chip is on.

#### Scenario: Chips off

- **GIVEN** no chip has been turned on on this device
- **WHEN** Today loads
- **THEN** the schedule is identical to the schedule without this requirement

#### Scenario: Fewer raids picks the costlier tied node

- **GIVEN** a material's two cheapest nodes tie on energy per item, one at 6 energy per battle and one at 12
- **WHEN** Fewer raids is on
- **THEN** Today raids only the 12-energy node for that material, and the note under the row explains that tied locations with more energy per battle are used to save raids

#### Scenario: Combine goals farms a lower-priority goal's slow material first

- **GIVEN** goal A (priority 1) needs a material that finishes in 2 days and goal B (priority 2) needs a Legendary material that takes 9 days, and the day's energy covers only one of them
- **WHEN** Combine goals is on
- **THEN** Today raids goal B's Legendary material, listed first in one combined list with no goal headers, and the note under the row says Plan and Goals dates still follow goal priority

#### Scenario: Combine goals pools all stages

- **GIVEN** a rank goal over several ranks whose later stage needs a slow material
- **WHEN** Combine goals is on
- **THEN** that later-stage material is part of the pool and can be raided today

#### Scenario: Both chips on

- **WHEN** Fewer raids and Combine goals are both on
- **THEN** the pooled schedule uses the Fewer raids node choice

#### Scenario: Other surfaces ignore the chips

- **GIVEN** a chip is on
- **THEN** Plan > Schedule, Goals, Insights, the HSE and HRE tabs and the Home raids widget are unchanged

#### Scenario: State remembered per device

- **WHEN** the player turns on Combine goals
- **THEN** the URL does not change; reloading keeps the chip on, and opening Today from the navigation on the same device shows Combine goals on

### Requirement: Today lays out its sections as a dashboard

On Dailies › Raids, Today SHALL show, from top to bottom: the page toolbar, a row of glance tiles (see "Today shows glance tiles"), and a grid of cards: Today's plan, Bonus raids, Shop recommendations, Onslaught and Today's attempts. Each card SHALL be a named region with its own level-2 heading.

The page toolbar SHALL hold, in its first row, the project selector and the Raids Filters trigger (Find) and Group by (View); the "Quick filters" caption and its two chips SHALL take the row below. Planning settings is the page header's Settings button. When a row is too narrow it SHALL wrap without hiding or truncating any control. While a quick filter is on, its one-line note SHALL appear on its own line directly below the chips.

The card grid SHALL size its tracks from the width of the page content, not the viewport, so an open or collapsed section menu is accounted for:

- at least 84rem: four equal tracks. Today's plan spans tracks 1–2, the third track stacks Bonus raids then Shop recommendations, and the fourth stacks Onslaught then Today's attempts;
- at least 42rem: two tracks. Today's plan spans both, and the two stacks form the second row side by side in the same pairs;
- below 42rem: one track, with every card stacked.

Cards SHALL keep their own height. A card that sits under another in a stack SHALL start directly below it, and a card that is not rendered SHALL let the next card in its stack move up. The reading and keyboard focus order SHALL be Today's plan, Bonus raids, Shop recommendations, Onslaught, Today's attempts at every track count, and it SHALL match the visual order.

On this page only, the content width cap SHALL be 150rem (2400px) instead of the app's default 100rem (1600px).

Assumptions:

- One resource card needs 20rem to stay readable, so no track is narrower than 20rem except in the one-track layout on a phone.
- The 768px desktop/mobile breakpoint is the app's existing `useIsMobile()` split. Below it this change renders the same cards in the one-track layout; a dedicated mobile form is a separate change.

#### Scenario: Four tracks on a wide monitor

- **GIVEN** a 2560px-wide window with the section menu open
- **WHEN** the user opens Dailies › Raids
- **THEN** the content is at most 2400px wide, Today's plan spans the first two of four tracks, Bonus raids sits above Shop recommendations in the third, and Onslaught sits above Today's attempts in the fourth

#### Scenario: Two tracks on a narrow desktop

- **GIVEN** the page content is between 42rem and 84rem wide (for example a 1024px window with the section menu open)
- **WHEN** Today renders
- **THEN** Today's plan spans the full width, and below it the Bonus raids / Shop recommendations stack and the Onslaught / Today's attempts stack sit side by side

#### Scenario: One track on a phone

- **GIVEN** a 390px-wide viewport
- **WHEN** Today renders
- **THEN** the cards stack in the order Today's plan, Bonus raids, Shop recommendations, Onslaught, Today's attempts, with no horizontal scroll

#### Scenario: Focus order follows the cards

- **WHEN** a keyboard user tabs through Today at any width
- **THEN** focus moves through Today's plan, then Bonus raids, then Shop recommendations, then Onslaught, then Today's attempts

#### Scenario: Missing cards close up

- **GIVEN** there are no Bonus raids entries below the energy limit and no goal needs an Onslaught run today
- **WHEN** Today renders with four tracks
- **THEN** Shop recommendations is at the top of the third track and Today's attempts is at the top of the fourth, with no empty space reserved above them

#### Scenario: Wider cap applies to Raids only

- **WHEN** the user opens Dailies › HSE on the same 2560px window
- **THEN** its content is still capped at 1600px

#### Scenario: Controls wrap without truncation

- **GIVEN** the German UI and a page content width too narrow for the controls on one line
- **WHEN** Today renders
- **THEN** Group by wraps under the Find controls, still at the right, and every label is shown in full

#### Scenario: Quick filter note under the row

- **WHEN** the player turns on Combine goals
- **THEN** its one-line note appears directly below the chips

#### Scenario: Tour steps point at the cards

- **WHEN** a user runs the Today tour on desktop or mobile
- **THEN** the schedule step highlights the Today's plan area (Bonus raids in its place at the energy limit), the energy step highlights the Daily energy used tile, the campaign event step highlights the Campaign event tile, and the Today's attempts and Onslaught steps highlight their cards
- **AND** the navigation step highlights the section menu on desktop (its reopen toggle when collapsed) and the section tabs on mobile
- **AND** a step whose card is left out today (Onslaught, or the shop offer groups when nothing is worth buying) is dropped from the tour rather than left without a target
