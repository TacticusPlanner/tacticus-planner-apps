# goal-acquisition-source-picker Specification

## Purpose

Defines the multi-select acquisition-source control for Unlock and Ascension goals — which
source groups (Campaigns, Onslaught, Shops) are offered for a given goal and unit, what each
group's options present, and how the selection is persisted and restored — so a goal can draw
shards from any combination of campaign nodes, Onslaught runs, and daily-shop offers instead
of a single source.

## Requirements

### Requirement: Acquisition sources are chosen from a multi-select group tree

The Unlock and Ascension goal cards SHALL present shard acquisition sources as a multi-select
tree of top-level groups — Campaigns, Onslaught, Shops — replacing any single-select source
control. The user SHALL be able to select any combination of the offered groups at the same
time. The control SHALL appear in both the goal-creation sheet and the goal detail/edit sheet
with the same groups and semantics.

#### Scenario: Multiple groups selected together

- **WHEN** a user selects both the Campaigns group and the Shops group for one goal
- **THEN** both contribute to the goal and neither selection clears the other

#### Scenario: Same control on create and edit

- **WHEN** a user opens the detail/edit sheet for an existing Unlock or Ascension goal
- **THEN** the acquisition-source control offers the same groups and reflects the goal's saved
  selection

#### Scenario: Replaces the single-select source control

- **WHEN** the acquisition-source control renders for an Ascension goal
- **THEN** there is no single-select "Campaign / Onslaught / Both" dropdown and the source
  choice is made entirely through the group tree

### Requirement: A source group is shown only when it can contribute to the goal

The control SHALL render a top-level group only when that group can supply shards for the
current goal and unit. A group with no selectable sub-options and no standalone contribution
SHALL NOT be rendered — no empty or disabled group headers.

- Campaigns SHALL be shown only when the unit has at least one campaign shard-farm node of a
  shard type the goal needs.
- Onslaught SHALL be shown only for Ascension goals whose entity is a Character; it SHALL NOT
  be shown for Unlock goals or for Machine-of-War goals.
- Shops SHALL be shown only when at least one daily shop currently offers the unit's character
  shards of a shard type the goal needs.

#### Scenario: Unit with no campaign shard nodes

- **WHEN** the target unit has no campaign shard-farm node of a needed shard type (for example
  a Machine of War)
- **THEN** the Campaigns group is not rendered

#### Scenario: Onslaught hidden on Unlock

- **WHEN** the acquisition-source control renders for an Unlock goal
- **THEN** the Onslaught group is not rendered

#### Scenario: Onslaught hidden for a Machine of War

- **WHEN** the acquisition-source control renders for a Machine-of-War Ascension goal
- **THEN** the Onslaught group is not rendered

#### Scenario: No shop offers the unit's shards

- **WHEN** no daily shop currently offers the target unit's shards of a needed type
- **THEN** the Shops group is not rendered

#### Scenario: No source group can contribute

- **WHEN** no source group can contribute for the goal and unit
- **THEN** the control renders no group headers and the goal keeps its count-only requirement
  with no farming estimate

### Requirement: The Campaigns group lists the unit's shard-farm nodes

When shown, the Campaigns group SHALL be expandable to the unit's campaign shard-farm nodes as
individually selectable sub-options, separated into regular-shard and mythic-shard nodes and
offered only for the shard type(s) the goal needs. Each node SHALL show its campaign battle
identity and the expected energy to obtain one shard there. Selecting the Campaigns group with
no node checked SHALL mean "any node of the needed type" and let the estimator pick the
lowest-energy node(s); leaving the Campaigns group unselected SHALL exclude campaign farming
from the goal entirely.

#### Scenario: Regular and mythic nodes separated by need

- **WHEN** an Ascension range needs only regular shards
- **THEN** only regular-shard campaign nodes are listed and no mythic-shard node is offered

#### Scenario: Group selected with no node checked

- **WHEN** the Campaigns group is selected but no individual node is checked
- **THEN** the estimate farms from the lowest-energy node(s) of the needed type, as if
  unrestricted

#### Scenario: Group unselected

- **WHEN** the Campaigns group is not selected
- **THEN** campaign farming does not contribute to the goal's shard supply or estimate

### Requirement: The Shops group lists matching daily-shop offers

When shown, the Shops group SHALL be expandable to one selectable sub-option per daily-shop
offer whose reward is the target unit's character shards (regular or mythic) of a shard type
the goal needs. Each offer row SHALL show the shop it belongs to, the purchase currency, the
per-purchase cost, the shards granted per purchase, the maximum purchases per day, and the
days of the week the offer is available. Offers SHALL be sourced across all shop rotation
days, not only the current day.

When an offer shares a rotating slot with other rewards — the slot resolves to one of several
units' shards on a given day — its row SHALL indicate that it is one of several possible
rewards for that slot and SHALL surface the weekdays it can appear and the approximate
probability the estimate assumes for it. An offer whose slot always yields this unit's shards
on its available days SHALL NOT carry that indicator.

#### Scenario: Guaranteed offer row content

- **WHEN** the Shops group is expanded for a unit whose shards are the only reward of a Guild
  Shop slot available every day
- **THEN** that offer's row shows the Guild Shop, its currency, per-purchase cost, shards per
  purchase, daily purchase cap, and available weekdays, with no "possible reward" indicator

#### Scenario: Rotating-slot offer row content

- **WHEN** the Shops group is expanded for a unit whose shards share a Guild Shop slot with
  another unit's shards on Tuesday and Friday at equal weight
- **THEN** that offer's row shows the shop, cost, shards per purchase, and daily cap, and also
  indicates it is one of several possible rewards, that it can appear on Tuesday and Friday,
  and the approximate chance (about 50%) the estimate assumes

#### Scenario: Mythic-shard offer gated by need

- **WHEN** a goal needs only regular shards and a shop offers the unit's mythic shards
- **THEN** that mythic-shard offer is not listed

#### Scenario: Offer available only on other days is still listed

- **WHEN** a matching shop offer is available only on weekdays other than today
- **THEN** it is still listed, with its availability days shown

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

### Requirement: Sources are gated to the shard type the goal can consume

The sources offered SHALL be limited to the shard type(s) the goal can consume. An Unlock goal
SHALL offer only regular-shard sources. An Ascension goal SHALL offer regular-shard sources,
mythic-shard sources, or both, according to whether its progression range crosses into the
Mythic tier.

#### Scenario: Unlock offers regular only

- **WHEN** the control renders for an Unlock goal
- **THEN** only regular-shard campaign nodes and regular-shard shop offers are listed, and no
  mythic-shard source is offered

#### Scenario: Ascension range crossing into Mythic

- **WHEN** an Ascension range spans from below the Mythic tier to above it
- **THEN** both regular-shard and mythic-shard sources are offered

### Requirement: The selected source set persists with the goal and is restored on edit

The user's selected source set — which groups are selected, which campaign nodes are checked,
and which shop offers are checked — SHALL be saved as part of the goal's farming configuration
and SHALL be restored when the goal is reopened for editing. A selection SHALL NOT be silently
dropped while the shop catalog or Onslaught progress data is still loading; a saved shop-offer
selection SHALL be retained even if its offer row is briefly unavailable during load.

#### Scenario: Round-trip through edit

- **WHEN** a user saves an Ascension goal with the Campaigns group (two nodes) and one Guild
  War Shop offer selected, then reopens the goal for editing
- **THEN** the same two campaign nodes and the same shop offer are shown as selected

#### Scenario: Selection retained during data load

- **WHEN** a goal with a saved shop-offer source is reopened and the shop catalog has not
  finished loading
- **THEN** the saved selection is preserved and reflected once the data is available, not
  reset to campaign-only

#### Scenario: Goal created before this control existed

- **WHEN** a goal whose farming config predates this control is opened for editing
- **THEN** its previous single source choice is presented as the equivalent group selection
  (campaign nodes and/or Onslaught) with no data loss

### Requirement: Default selection preserves campaign-only estimates

On a newly configured Unlock or Ascension goal, the control SHALL default to the Campaigns
group selected with the lowest-energy node(s) of each needed shard type pre-checked, and the
Onslaught and Shops groups unselected, so a goal the user does not further configure produces
the same estimate it would have produced before this control existed.

#### Scenario: Fresh goal default

- **WHEN** a user enables an Unlock or Ascension goal and does not touch the acquisition-source
  control
- **THEN** the Campaigns group is selected with the default lowest-energy node(s) and the
  Onslaught and Shops groups are unselected

#### Scenario: No regression for campaign-only goals

- **WHEN** a goal's only selected source group is Campaigns
- **THEN** its shard need, energy, raid count, and completion date match the pre-change
  behavior for the same inputs

### Requirement: Desktop and mobile present the same sources

The acquisition-source control SHALL offer the same groups, sub-options, selections, and
Onslaught yield information at every viewport. Below the 768px breakpoint the groups MAY be
presented as collapsible sections to conserve vertical space and at or above it they MAY be
shown expanded, but no option, count, cost, or availability detail present on one SHALL be
absent on the other.

#### Scenario: Parity across viewports

- **WHEN** the control is viewed below and at or above the 768px breakpoint
- **THEN** both show the same groups, the same sub-options with their costs and availability,
  and the same current selection

### Requirement: The goal onboarding tour covers the acquisition-source control

The onboarding tour that covers goal creation SHALL include a step introducing the
acquisition-source control — that multiple source groups can be combined and that selecting
Shops or Onslaught reduces campaign farming — with localized title and content, for both the
desktop and mobile step sets.

#### Scenario: Tour step present

- **WHEN** a user runs the onboarding tour that covers goal creation
- **THEN** a step targets the acquisition-source control and explains combining campaign, shop,
  and Onslaught sources, in the current viewport's step set

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
