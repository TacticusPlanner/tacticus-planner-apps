## RENAMED Requirements

- FROM: `### Requirement: The Onslaught group shows its per-run yield and links to progress`
- TO: `### Requirement: The Onslaught group shows its shards-per-day yield and links to progress`

## MODIFIED Requirements

### Requirement: The Onslaught group shows its shards-per-day yield and links to progress

When shown, the Onslaught group SHALL display the estimated character shards Onslaught
supplies **per day** — the per-run yield for the player's saved Onslaught progress (sector and
tier for the unit's alliance) multiplied by the current Onslaught run cadence — expressed in
the same **shards/day** unit as the other source groups. This figure SHALL be shown
**whenever the Onslaught group is offered for the goal**, not only while the group is
selected. The per-run yield SHALL be derived from the **character's current progression /
rarity** (its current tier decides whether regular-shard or mythic-shard Onslaught rewards
apply), independent of the goal's target tier.

The group SHALL provide an inline link to the Onslaught progress page for setting or updating
that progress. Following that link SHALL navigate to the Onslaught progress page and close the
goal-creation sheet **without resetting the in-progress goal**, so that reopening the sheet
after editing Onslaught progress restores the same unit, goal types, target, and
acquisition-source selection the user had entered.

(Onslaught grants character shards and forge badges only — it does not grant ascension orbs,
so no orb figure is shown here; the goal's ascension-orb requirement is unaffected by this
control regardless.) When the player has no saved Onslaught progress, the group SHALL show a
prompt to set progress via that link instead of a shards/day figure.

#### Scenario: Yield shown from saved progress

- **WHEN** the player has saved Onslaught progress and the Onslaught group is offered for a
  Character Ascension goal
- **THEN** the group shows the estimated shards per day (per-run yield × run cadence) for that
  progress and a link to the Onslaught progress page, whether or not the group is checked

#### Scenario: Yield uses current progression, not the target

- **WHEN** a Character whose current tier is below Mythic has an Ascension goal targeting a
  tier above Mythic and the Onslaught group is offered
- **THEN** the shards/day figure uses the regular-shard Onslaught reward for the character's
  current tier, and does not switch to the mythic-shard reward because the target crosses
  Mythic

#### Scenario: No saved progress

- **WHEN** the player has no saved Onslaught progress
- **THEN** the Onslaught group is still offered and prompts the player to set progress via the
  linked Onslaught progress page, with no shards/day figure

#### Scenario: Edit Onslaught progress preserves the in-progress goal

- **WHEN** a user has partly filled in a new Ascension goal (unit, target, some
  acquisition-source selections) and follows the "Edit Onslaught progress" link
- **THEN** the app navigates to the Onslaught progress page, the goal-creation sheet closes,
  and reopening the sheet shows the same unit, target, and selections rather than a reset form

## ADDED Requirements

### Requirement: Every acquisition-source group states its yield as shards per day

Each offered acquisition-source group SHALL present its expected contribution to the goal in
one common unit — **≈ X shards/day** — so the groups can be compared directly:

- **Campaigns** SHALL show the expected shards/day obtainable from its selected nodes (or, when
  the group is selected with no node checked, the default lowest-energy node(s) of the needed
  type) at the planning daily-energy budget, after each node's daily attempt cap.
- **Onslaught** SHALL show per-run yield × current run cadence (see the Onslaught requirement).
- **Shops** SHALL show, per offer row, that offer's expected weekly shard supply averaged to a
  daily rate; a group-level shards/day MAY additionally summarize the selected offers.

The figure SHALL reflect the current selection state of that group's sub-options and SHALL
update as the user checks or unchecks nodes or offers. A group that cannot currently produce a
yield figure (for example Onslaught with no saved progress) SHALL show its existing prompt
instead.

#### Scenario: Groups compared in one unit

- **WHEN** the Campaigns, Onslaught, and Shops groups are all offered for a goal
- **THEN** each shows an "≈ X shards/day" figure in the same unit, and no group shows its yield
  only as a per-run amount or only as a currency/quantity line

#### Scenario: Shop offer shards/day

- **WHEN** a guaranteed daily shop offer grants 5 shards per purchase with a cap of 2 per day
  and is available on 3 weekdays
- **THEN** its row shows ≈ 30 shards ÷ 7 ≈ 4.3 shards/day

#### Scenario: Campaign shards/day tracks node selection

- **WHEN** the user checks an additional campaign node in the Campaigns group
- **THEN** the Campaigns shards/day figure increases to reflect the added node's expected daily
  yield at the planning daily-energy budget

### Requirement: The Resources-needed preview shows each selected source's contribution cost

The goal-creation "Resources needed" preview SHALL show, for each **selected non-campaign
acquisition source**, the amount that source contributes toward the goal over the combined
estimate window, on a contribution-share basis (the shards that source actually supplies in
the concurrent day-by-day simulation, not the goal's full shard need):

- a selected **Onslaught** source SHALL show the number of **Onslaught tokens (runs)** its
  contributed shards represent — contributed shards ÷ per-run yield, rounded up;
- each selected **shop offer** SHALL show the **currency spent** — contributed shards ÷ shards
  per purchase, rounded up, times the per-purchase cost — aggregated **per currency type**
  across all selected offers that share a currency.

Campaign farming SHALL keep its existing energy / raids / days line and SHALL NOT get a token
or currency line. When no non-campaign source is selected, no token or currency line SHALL be
shown.

#### Scenario: Onslaught token count

- **WHEN** a goal's estimate has Onslaught contributing 45 shards over the window at a per-run
  yield of 20 shards
- **THEN** the preview shows 3 Onslaught tokens (⌈45 ÷ 20⌉)

#### Scenario: Shop currency aggregated per currency

- **WHEN** two selected Guild-Shop offers priced in Guild Credits together contribute shards
  that require 4 purchases at 525 Guild Credits each
- **THEN** the preview shows 2100 Guild Credits as a single Guild Credits line

#### Scenario: Deselecting a source removes its line

- **WHEN** the user unchecks the only selected shop offer
- **THEN** that offer's currency line disappears from the "Resources needed" preview and the
  campaign energy/raids/days line rises to cover the restored demand

#### Scenario: Campaign-only goal shows no token or currency line

- **WHEN** a goal's only selected source group is Campaigns
- **THEN** the "Resources needed" preview shows only the shards, orbs, and energy/raids/days
  lines, with no Onslaught-token or shop-currency line
