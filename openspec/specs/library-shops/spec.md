# library-shops Specification

## Purpose

Gives players a public reference view of the four always-on daily shops: pick any day of the week and
see every slot each shop can offer that day, unfiltered by goals or roster — the V2 equivalent of
V1's Learn → Daily Shops page, living under Library.

## Requirements

### Requirement: Shops browsing page is public and lives under Library

The application SHALL expose a Shops browsing page at `/library/shops`, reachable without signing in,
consistent with the rest of the Library section. It SHALL NOT require a selected project, player data,
or a signed-in roster to render.

#### Scenario: Anonymous user opens the browsing page

- **WHEN** a user who is not signed in navigates to `/library/shops`
- **THEN** the Shops browsing page renders with its day and shop selection and content, without prompting the user to sign in

#### Scenario: Route is not an entity-collection route

- **WHEN** a user navigates to `/library/shops`
- **THEN** the page loads directly, with no per-entity path segment and no redirect to a "first entity" URL

### Requirement: The browsing page selects a day of the week and a shop

The page SHALL provide a control to choose any one of the seven days of the week and a control to
choose which of the four daily shops (Guild Shop, Guild War Shop, Crusade Shop, Rogue Trader) is
shown. The day control SHALL default to the current UTC day of week. Changing either control SHALL
recompute the displayed slots for that day and shop.

#### Scenario: Default day is today

- **WHEN** the browsing page first loads
- **THEN** the selected day is the current UTC day of week

#### Scenario: Changing the day

- **WHEN** the user selects a different day
- **THEN** the displayed shop's slots update to those available on the newly-selected day

#### Scenario: Changing the shop

- **WHEN** the user selects a different shop
- **THEN** the page shows that shop's slots for the currently-selected day

### Requirement: The page lists every slot for the selected day and shop

For the selected day and shop, the page SHALL show every slot that shop can offer that day —
unfiltered by any goal, need, or roster — resolved by the permissive browsing resolver. Each slot
SHALL show its reward(s), the per-purchase cost in that shop's currency, the per-day availability
(purchase cap and reward quantity), and any bundled free offer.

#### Scenario: All of a day's slots are shown

- **WHEN** a shop has several slots available on the selected day
- **THEN** the page shows a card for every one of them, regardless of whether the player needs any of the rewards

#### Scenario: Single-reward slot

- **WHEN** a slot resolves to exactly one reward on the selected day
- **THEN** its card shows that reward, its cost, and its daily availability

### Requirement: Randomized slots are shown as a single "one of these" unit

When a slot can yield one of several mutually exclusive rewards on the selected day, the page SHALL
present it as one card indicating it is randomized and how many possible rewards it has, with a way to
see the full list of possibilities (inline when few, in an expandable detail when many). It SHALL NOT
present each possibility as if it were a separate guaranteed offer.

#### Scenario: Random slot card

- **WHEN** a slot has more than one possible reward on the selected day
- **THEN** its card is marked as randomized, states the number of possible rewards, and exposes the full list of those rewards with their costs

#### Scenario: Random slot is not split

- **WHEN** a slot has more than one possible reward
- **THEN** the page does not render one card per possibility as though each were separately guaranteed

### Requirement: Empty, loading, and load-failure states are distinct

The page SHALL show a loading state while the shop data loads; a load-failure state (with a retry
affordance) if it cannot be read; and, for a valid day/shop combination that simply has no slots, an
explicit "nothing available on this day" empty state rather than a blank area or an error.

#### Scenario: Loading

- **WHEN** the shop data is still loading
- **THEN** the page shows a loading state

#### Scenario: Load failure

- **WHEN** the shop data cannot be read
- **THEN** the page shows a failure state with an action that retries, not an empty slot list

#### Scenario: Nothing available on the selected day

- **WHEN** the selected shop has no slots on the selected day
- **THEN** the page shows an explicit "nothing available on this day" message for that shop and day

### Requirement: Distinct desktop and mobile presentations

The browsing page SHALL present a desktop layout at or above the 768px breakpoint and a distinct
mobile layout below it — not merely a responsive reflow — consistent with this app's desktop/mobile
convention. Every label, cost, availability note, and the day and shop controls SHALL be present in
both.

#### Scenario: Mobile layout

- **WHEN** the browsing page is viewed below the 768px breakpoint
- **THEN** the day and shop controls and the slot cards are composed for a narrow viewport while preserving every label, cost, and availability note

#### Scenario: Desktop layout

- **WHEN** the browsing page is viewed at or above the 768px breakpoint
- **THEN** the slot cards fill the available content width in as many readable columns as fit

### Requirement: Browsing page has an onboarding tour

The browsing page SHALL provide a Joyride-driven onboarding tour registered through the app's tour
system, with steps covering the day selector, the shop selector, and how a randomized slot is read.
Step titles and content SHALL come from i18n. Desktop and mobile step sets SHALL both be provided.

#### Scenario: Tour is available on the browsing page

- **WHEN** a user triggers the onboarding tour on `/library/shops`
- **THEN** the tour runs against the page's controls and cards with localized step content, for the current viewport's step set
