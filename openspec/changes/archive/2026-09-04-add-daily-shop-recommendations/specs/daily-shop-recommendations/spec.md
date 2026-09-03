## Purpose

Tells a player which of today's daily-shop offers are worth buying for one selected project's active
goals — matching each shop's currently-rotating rewards against the project's outstanding
character-shard, mythic-shard, and mythic uncraftable upgrade-material needs — a first cut of the shop
recommendations V1 shows on its Daily Raids → Today page, on a dedicated Shops page under Dailies.
(V1 additionally matches forge badges and machine-of-war components; V2's goal model has no need
derivation for those yet, so they are tracked as a follow-up (TacticusPlanner/tacticus-planner-apps#104) and out of scope here.)

## ADDED Requirements

### Requirement: Shops is a Dailies page scoped to the selected project

The Shops page SHALL render at `/dailies/shops` for a signed-in user and SHALL compute its
recommendations from the same project currently selected in the Dailies area — defaulting to the
player's Active project, falling back to their Default project when no project is Active. Selecting a
different project SHALL recompute the recommendations for that project alone.

#### Scenario: Shops uses the Dailies selected project

- **WHEN** a project is selected in the Dailies area and the user opens Shops
- **THEN** the recommendations reflect that project's goals

#### Scenario: Switching project recomputes recommendations

- **WHEN** the user changes the selected project while on Shops
- **THEN** every shop's recommendations and the empty state are recomputed for the newly-selected project

#### Scenario: Default selection with no active project

- **WHEN** Shops loads and no project is marked Active
- **THEN** it uses the player's Default project without requiring the user to pick one

### Requirement: Recommendations match today's offers against unmet project needs

For the selected project's `Active` goals, the page SHALL determine the outstanding need per reward
resource — character shards, mythic character shards, and mythic (uncraftable) upgrade materials
(`upgHpM001`..`upgHpM004`) — as an acquired-vs-required count aggregated across goals, derived from
the goal-need calculation rather than the daily-raid farm schedule (so count-only / non-farmable
needs still count). It SHALL then show a recommendation card for each of today's resolved shop offers
whose reward resource still has `acquired < required`. Offers for a resource the project does not
need, or already has enough of, SHALL NOT be shown. Goals with status `Paused`, `Completed`, or
`Archived` SHALL NOT contribute to the need.

Forge badges (`itemAscensionResource_<Rarity>`) and machine-of-war component / component-token offers
are NOT matched by this release — V2's goal model derives no need for them — so a shop offer whose
only reward is one of those SHALL simply not produce a recommendation card. Adding those need models
and their matching is tracked as TacticusPlanner/tacticus-planner-apps#104.

#### Scenario: Needed reward is recommended

- **GIVEN** the selected project has an Active goal with an unmet shard need for a unit
- **AND** a daily shop offers that unit's shards today
- **THEN** a recommendation card for that offer is shown

#### Scenario: Not-needed reward is not recommended

- **GIVEN** a daily shop offers a resource today
- **AND** no Active goal in the selected project needs that resource
- **THEN** no recommendation card for that offer is shown

#### Scenario: Already-satisfied need is not recommended

- **GIVEN** an Active goal's need for a resource is fully covered by what the player already has
- **THEN** today's shop offers for that resource are not shown as recommendations

#### Scenario: Only Active goals contribute

- **GIVEN** a project with Active, Paused, Completed, and Archived goals needing shop-available resources
- **WHEN** Shops loads
- **THEN** only the Active goals' needs drive the recommendations

### Requirement: All four daily shops are always evaluated; no per-shop settings

The page SHALL evaluate all four daily shops (Guild Shop, Guild War Shop, Rogue Trader, Crusade Shop)
every time. There SHALL be no setting to enable or disable an individual shop or to hide any category
of recommendation. Both guaranteed-today offers and possible-today (randomized-slot) offers SHALL be
shown.

#### Scenario: No shop toggle

- **WHEN** the user views Shops
- **THEN** there is no control to turn an individual shop or recommendation category on or off

#### Scenario: Random-slot offers are shown

- **GIVEN** a needed resource is offered today only through a randomized slot (not guaranteed)
- **THEN** its recommendation card is still shown, marked as a possible-today offer

### Requirement: Recommendations are grouped by shop and by availability

Within each shop, recommendation cards SHALL be split into a guaranteed-today group and a
possible-today group, each clearly labeled. A shop with no current recommendations SHALL be omitted or
shown as empty rather than presenting an empty guaranteed/possible split.

#### Scenario: Guaranteed and possible are separated

- **WHEN** a shop has both guaranteed-today and possible-today recommendations
- **THEN** they appear under distinct, labeled groups within that shop's section

#### Scenario: Shop with no recommendations

- **WHEN** a shop has no offers matching an unmet need today
- **THEN** that shop's section does not present an empty guaranteed/possible split

### Requirement: Each recommendation card shows reward, cost, and which goals need it

A recommendation card SHALL show: the reward's icon and name; the aggregated acquired-vs-required
count for that resource across the project's Active goals; the per-purchase cost (currency icon +
amount) and, when the need is not yet met, the remaining total cost to cover it; a per-day
availability note reflecting the offer's purchase cap and reward quantity; an indicator when the offer
is only a possible-today (randomized) outcome; and the list of the project's goal units that need the
resource. Cost figures SHALL be presented in the shop's own currency.

#### Scenario: Card content

- **WHEN** a recommendation card renders for a needed shard offer
- **THEN** it shows the unit shard icon and name, the acquired/required count, the per-purchase currency cost, the remaining total cost, the daily availability note, and the goal units needing those shards

#### Scenario: Random offer indicator

- **WHEN** a recommendation card renders for an offer that is only a possible-today outcome
- **THEN** the card carries a visible indicator that the offer may not appear today

#### Scenario: Remaining total cost hidden when covered

- **WHEN** the aggregated acquired count already meets the required count for a resource
- **THEN** the card does not show a remaining total cost (and per the matching requirement, such a card is generally not shown at all)

### Requirement: Today is the current UTC day

The page SHALL resolve "today's" offers using the current UTC day of week, matching the game's daily
shop rotation which refreshes at UTC midnight.

#### Scenario: Day rollover follows UTC

- **WHEN** the user's local date differs from the UTC date
- **THEN** the shop offers shown are those for the current UTC day of week

### Requirement: Distinct desktop and mobile presentations

The Shops page SHALL present a desktop layout at or above the 768px breakpoint and a distinct mobile
layout below it — not merely a responsive reflow of the same markup — consistent with this app's
desktop/mobile convention for Dailies pages. Every label, count, cost, and control SHALL be present in
both.

#### Scenario: Mobile layout is compact

- **WHEN** Shops is viewed below the 768px breakpoint
- **THEN** shop sections and recommendation cards are composed as dense rows that minimize vertical space while preserving every label, count, cost, and indicator

#### Scenario: Desktop layout uses available width

- **WHEN** Shops is viewed at or above the 768px breakpoint
- **THEN** recommendation cards fill the available content width in as many readable columns as fit

### Requirement: Loading, load-failure, no-project, and no-recommendation states are distinct

The page SHALL distinguish: still loading the project's goals or the shop data; a page-local failure
reading that data (with a retry affordance for the failed request, not presented as an empty result);
no project available to select (prompting the user to create or select one); and a valid project with
shop data where no shop offer matches an unmet need today (an explicit "nothing to buy today" empty
state). Total game-catalog sync failure is handled globally before the page mounts and is out of
scope for this page's own states.

#### Scenario: Loading

- **WHEN** the project's goals or the shop data are still loading
- **THEN** the page shows a loading state rather than an empty result

#### Scenario: Page-local load failure

- **WHEN** reading the project's goals or the shop data fails after the global catalog gate has passed
- **THEN** the page shows the failure with an action that retries the failed request, not an empty recommendation list

#### Scenario: No project

- **WHEN** the player has no project available to select
- **THEN** the page shows an empty state prompting them to create or select a project, and shows no shop sections

#### Scenario: Nothing to buy today

- **WHEN** the selected project's Active goals have needs but no daily shop offers any of those resources today
- **THEN** the page shows an explicit empty state indicating there is nothing worth buying today

### Requirement: Shops page has an onboarding tour

The Shops page SHALL provide a Joyride-driven onboarding tour registered through the app's tour
system, with steps covering the page's purpose (shop recommendations for the selected project), the
guaranteed-vs-possible distinction, and how a card's cost/needed-by detail is read. Tour step
titles and content SHALL come from i18n. Desktop and mobile step sets SHALL both be provided.

#### Scenario: Tour is available on Shops

- **WHEN** a signed-in user triggers the onboarding tour on the Shops page
- **THEN** the tour runs against the Shops page's elements with localized step content, for the current viewport's step set
