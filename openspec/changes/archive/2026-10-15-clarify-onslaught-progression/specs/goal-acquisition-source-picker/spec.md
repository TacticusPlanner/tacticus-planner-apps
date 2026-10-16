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
control regardless.) Progress counts as saved only when the onslaught-progress response
reports `isSet: true` for the **unit's alliance**; the API's Stone 1 placeholder for an unset
alliance SHALL NOT be used as a yield. When the unit's alliance has no saved Onslaught
progress (or the progress has not loaded), the group SHALL show a prompt to set progress via
that link instead of a shards/day figure.

Assumptions:

- Onslaught run cadence is 1.5 runs per day (`ONSLAUGHT_RUNS_PER_DAY`).
- Per-run yield is the midpoint of the reward row's min–max range for the current rarity.

#### Scenario: Yield shown from saved progress

- **WHEN** the player has saved Onslaught progress for the unit's alliance and the Onslaught
  group is offered for a Character Ascension goal
- **THEN** the group shows the estimated shards per day (per-run yield × run cadence) for that
  progress and a link to the Onslaught progress page, whether or not the group is checked

#### Scenario: Worked example — Legendary Imperial character at Gold · Tier 2

- **GIVEN** an Imperial character (e.g. Ragnar) whose current rarity is Legendary, Imperial
  saved at Gold · Tier 2, and the catalog row Gold-2 Legendary range 15–17
- **WHEN** the Onslaught group is offered
- **THEN** per-run yield = (15 + 17) / 2 = 16 shards, × 1.5 runs/day = 24 shards/day is shown
- **AND WHEN** Imperial is instead saved at Gold · Sector complete (tier 4 → row Gold-3,
  Legendary 16–18)
- **THEN** per-run yield = 17, × 1.5 = 25.5 shards/day

#### Scenario: Yield uses current progression, not the target

- **WHEN** a Character whose current tier is below Mythic has an Ascension goal targeting a
  tier above Mythic and the Onslaught group is offered
- **THEN** the shards/day figure uses the regular-shard Onslaught reward for the character's
  current tier, and does not switch to the mythic-shard reward because the target crosses
  Mythic

#### Scenario: No saved progress

- **WHEN** the player has no saved Onslaught progress for the unit's alliance (the API reports
  it with `isSet: false`, even though it carries Stone 1)
- **THEN** the Onslaught group is still offered and prompts the player to set progress via the
  linked Onslaught progress page, with no shards/day figure

#### Scenario: Other alliance saved

- **WHEN** the player saved Xenos but not Imperial and creates a goal for an Imperial character
- **THEN** the Onslaught group prompts the player to set progress

#### Scenario: Edit Onslaught progress preserves the in-progress goal

- **WHEN** a user has partly filled in a new Ascension goal (unit, target, some
  acquisition-source selections) and follows the "Edit Onslaught progress" link
- **THEN** the app navigates to the Onslaught progress page, the goal-creation sheet closes,
  and reopening the sheet shows the same unit, target, and selections rather than a reset form

### Requirement: The Edit goal dialog shows the Onslaught yield from saved progress

When the Edit goal dialog or sheet offers the Onslaught source group for a Character Ascension goal, the group SHALL show the same shards/day yield as goal creation. The yield comes from the player's saved Onslaught progress for the unit's alliance and the character's current progression. When the unit isn't in the synced roster, the goal's saved start progression SHALL be used instead. The dialog SHALL prompt the player to set Onslaught progress only when none is saved for the unit's alliance (`isSet: false`, or progress not loaded); it SHALL NOT show a yield computed from the unset Stone 1 placeholder.

#### Scenario: Saved progress in the Edit dialog

- **WHEN** the player has saved Onslaught progress for the unit's alliance and opens the Edit goal dialog for a Character Ascension goal
- **THEN** the Onslaught group shows the estimated shards per day and does not prompt the player to set progress

#### Scenario: No saved progress in the Edit dialog

- **WHEN** the player has no saved Onslaught progress for the unit's alliance and opens the Edit goal dialog for a Character Ascension goal
- **THEN** the Onslaught group prompts the player to set progress via the linked Onslaught progress page, with no shards/day figure
