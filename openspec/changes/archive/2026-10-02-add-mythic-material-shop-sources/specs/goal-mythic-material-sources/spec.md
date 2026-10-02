## Purpose

Defines the Mythic-material acquisition-source control on Rank, Upgrade, and Machine-of-War
Ability goals — when it appears, which daily-shop offers it lists, its all-available default, and
how the selection persists — so goals that need the four uncraftable Mythic upgrade materials can
draw them from shops instead of being blocked.

## ADDED Requirements

### Requirement: The control appears only when the goal needs a Mythic material

The goal-creation dialog or sheet and the Edit goal dialog SHALL show a **Mythic materials**
source control on a Character Rank goal, a Character or Machine-of-War Upgrade goal, and a
Machine-of-War Ability goal whenever that goal's current configuration needs at least one of the
four Mythic upgrade materials — `upgHpM001` (Imperial Aquila), `upgHpM002` (Mutant Form),
`upgHpM003` (Ancient Inscription), `upgHpM004` (Venerable Battle Mark) — after expanding crafted
upgrades through their recipes. It SHALL list only the materials the goal needs and SHALL update
as the user changes the goal's range or targets. It SHALL NOT appear on Unlock, Ascension, or
Character Ability goals, and SHALL NOT appear when no needed material is one of the four.

Assumptions:

- These four materials cannot be crafted and are not sold for non-Mythic currencies elsewhere;
  their only campaign drops are event-campaign nodes, which stay on the existing campaign path.
- Character rank-ups reach them through Mythic crafted-upgrade recipes; Machine-of-War ability
  levels consume them directly.

#### Scenario: Adamantine rank range shows the control

- **WHEN** a user configures a Ragnar Rank goal whose range ends at Adamantine 2 and needs
  Venerable Battle Mark
- **THEN** the Mythic materials control is shown, listing Venerable Battle Mark

#### Scenario: Range below Adamantine hides the control

- **WHEN** a Rank goal's range needs none of the four materials
- **THEN** no Mythic materials control is rendered

#### Scenario: Machine-of-War ability goal

- **WHEN** a user configures a Dreadnought (`ultraDreadnought`) Ability goal whose range needs
  Venerable Battle Mark
- **THEN** the Mythic materials control is shown, listing Venerable Battle Mark

#### Scenario: Upgrade goal targeting a Mythic material

- **WHEN** a user configures an Upgrade goal whose targets include Venerable Battle Mark
- **THEN** the Mythic materials control is shown, listing Venerable Battle Mark

#### Scenario: Unlock and Ascension goals unchanged

- **WHEN** an Unlock or Ascension goal is configured
- **THEN** no Mythic materials control is rendered and the existing shard acquisition-source
  control is unchanged

### Requirement: Each needed material lists every daily-shop offer for it

For each needed material the control SHALL list one selectable row per daily-shop offer whose
reward is that material, across all shops and every weekday (not only today). Each row SHALL show
the same details as a shard Shops-group offer row: the shop, the purchase currency, the
per-purchase cost, the amount granted per purchase, the maximum purchases per day, the weekdays it
can appear, and — when its slot can resolve to other rewards on a weekday — that it is one of
several possible rewards with the approximate chance assumed. Each row SHALL show its expected
yield as **≈ X per day** (the material's own unit), averaged over a week. Offers whose lock
condition rules them out for this player SHALL NOT be listed.

Assumptions:

- An offer's chance on a weekday is its variant weight over the summed weights of the slot's
  variants that match that weekday and are not ruled out by a resolvable lock condition.
- The Crusade shop's Mythic-material variants are locked until the roster owns a unit at
  Legendary blue star or above; this is evaluated against the player's synced roster.
- An offer with no listed purchase cap allows 1 purchase per day.

#### Scenario: Venerable Battle Mark offers (worked example)

- **GIVEN** a player who owns a blue-star unit and a goal needing Venerable Battle Mark
- **WHEN** the control lists Venerable Battle Mark's offers
- **THEN** it shows three rows:
  - Guild shop, 900 Guild Credits, 1 per purchase, up to 2/day, Tue (guaranteed) and Sat/Sun
    (one of four possible rewards, ≈ 25%): weekly 2×1 + 2×0.25 + 2×0.25 = 3 → ≈ 0.43 per day
  - Crusade shop, 430 crusade currency, up to 3/day, Tue (guaranteed) and Sat/Sun (≈ 25%):
    weekly 3×1 + 3×0.25 + 3×0.25 = 4.5 → ≈ 0.64 per day
  - Rogue Trader shop, 35 Elder currency, 1/day, Sun (guaranteed): weekly 1 → ≈ 0.14 per day

#### Scenario: Crusade offer hidden without a blue-star unit

- **GIVEN** a player whose roster has no unit at Legendary blue star or above, and a
  Machine-of-War Ability goal needing Venerable Battle Mark
- **WHEN** the control lists Venerable Battle Mark's offers
- **THEN** the Crusade shop offer is not listed and the Guild and Rogue Trader offers are

### Requirement: Every available offer is selected by default

A goal with no saved Mythic-material selection SHALL use every offer the control currently lists
for each needed material, and the control SHALL show those offers checked. This default SHALL be
resolved when the goal is estimated or displayed, not written to the goal, so goals created before
this control existed get it too. Unchecking or checking any offer SHALL save an explicit
selection, which is then used as-is. Unchecking every offer SHALL save an explicit empty selection,
under which no shop supplies the goal's Mythic materials.

#### Scenario: Fresh goal default

- **WHEN** a user enables a Rank goal whose range needs Venerable Battle Mark and does not touch
  the control
- **THEN** all of Venerable Battle Mark's listed offers are checked and the goal is saved with no
  explicit selection

#### Scenario: Existing goal picks up the default

- **GIVEN** a Ragnar Rank Adamantine 2 goal created before this change, with no saved selection
- **WHEN** Goals, Today, or Raids Plan estimate it
- **THEN** every listed Venerable Battle Mark offer supplies it, and it is no longer reported as
  blocked for Venerable Battle Mark

#### Scenario: Explicit selection is used as-is

- **WHEN** a user unchecks the Rogue Trader offer and saves
- **THEN** only the Guild and Crusade offers supply the goal, and reopening the goal shows only
  those two checked

#### Scenario: Explicit opt-out

- **WHEN** a user unchecks every offer and saves
- **THEN** no shop supplies the goal's Mythic materials, the material stays a blocker when it has
  no other source, and reopening shows every offer unchecked

### Requirement: The selection persists and survives loading

The explicit selection SHALL be saved with the goal's farming configuration and restored on edit.
While the shop catalog or roster is still loading, the control SHALL show a loading state and
SHALL NOT drop or rewrite a saved selection. When the shop catalog fails to load, the control
SHALL say the offers are unavailable and SHALL keep the saved selection unchanged on save. When a
needed material has no listed offer (every offer locked), the control SHALL say so for that
material.

#### Scenario: Round-trip through edit

- **WHEN** a goal is saved with the Guild and Crusade Venerable Battle Mark offers checked and is
  reopened for editing
- **THEN** exactly those two offers are checked

#### Scenario: Selection retained during load

- **WHEN** a goal with a saved selection is reopened before the shop catalog has loaded
- **THEN** the control shows a loading state and, once loaded, shows the saved selection

#### Scenario: Catalog load failure

- **WHEN** the shop catalog fails to load
- **THEN** the control reports that offers are unavailable and saving the goal does not change its
  saved Mythic-material selection

### Requirement: The goal preview shows the selected offers' currency spend

The goal-creation preview for a goal showing this control SHALL include, per currency, the shop
currency the selected Mythic-material offers spend on the materials they contribute over the
goal's own estimate window (contributed amount ÷ amount per purchase, rounded up, × cost),
aggregated per currency, as the shard Shops preview does. This preview SHALL be a single-goal
estimate that does not account for other goals sharing the same offers.

#### Scenario: Preview spend for Ragnar

- **GIVEN** the Venerable Battle Mark worked example below in `goal-farming-estimates`, where the
  Crusade offer contributes 3.75 and the Guild offer 2.25
- **WHEN** the preview renders
- **THEN** it shows ⌈3.75⌉ × 430 = 1720 crusade currency and ⌈2.25⌉ × 900 = 2700 Guild Credits

### Requirement: Desktop and mobile present the same offers

The control SHALL offer the same materials, offer rows, details, and selection at every viewport.
Below 768px each material MAY be a collapsible section; at or above 768px it MAY be expanded. No
detail present on one SHALL be absent on the other.

#### Scenario: Parity across viewports

- **WHEN** the control is viewed below and at or above 768px
- **THEN** both show the same materials, offers, costs, availability, yields, and selection

### Requirement: The onboarding tours cover the control

The goal-creation and Edit goal onboarding tours SHALL include a step introducing the Mythic
materials control — that every available shop offer is used by default and offers can be
unchecked — with localized title and content, in both the desktop and mobile step sets. The step
SHALL be skipped when the control is not rendered.

#### Scenario: Tour step present

- **WHEN** a user runs the goal-creation tour with a Rank goal whose range needs a Mythic
  material
- **THEN** a step targets the Mythic materials control in the current viewport's step set
