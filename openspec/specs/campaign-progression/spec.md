# campaign-progression Specification

## Purpose

Tells the player which uncleared campaigns to push next for their goals (V1's Campaign Progression page): what each one unblocks, roughly how much farming energy it saves, and what still stops them from playing it. It lives in Plan > Insights.

## Requirements

### Requirement: Insights lists the campaigns worth pushing

Plan > Insights SHALL show a "Campaigns to push" section listing up to five standing-campaign tracks (one campaign group and type, such as Fall of Cadia Elite) that the player has not cleared and that help the goals in scope. A track helps when:

- one of its unreached nodes drops a material that no reachable node drops (a `NoFarmLocation` blocker), or
- opening the track lowers the energy per item of a material the goals still farm. A goal that pins its farming locations SHALL NOT count here.

Tracks that unblock more materials SHALL come first, then tracks that save more energy. Campaign events SHALL NOT be listed, because their nodes depend on the event schedule, not on progress. The section SHALL be omitted when no track helps.

#### Scenario: A track that unblocks a material

- **GIVEN** a goal blocked on a material that only Fall of Cadia Elite 4 drops, and no Fall of Cadia Elite progress
- **WHEN** the user opens Plan > Insights
- **THEN** "Campaigns to push" lists Fall of Cadia Elite with "Unblocks <material> in 4 battles"

### Requirement: Each track shows its distance, savings and locks

Each listed track SHALL show:

- the battles left to clear it, marked "Not started" when the player has no progress on it
- each material it unblocks, with the battles to beat to reach the closest node that drops it
- the energy saved, when it is above zero. This is `count × (energy per item now − energy per item with the track open)` at the cheapest node, summed over farmed materials, and is shown as an approximate figure.
- every reason the player can't play it yet:
  - the campaign's core characters the player doesn't own
  - the campaign it follows (`requiredCampaignGroupId`) when that is not cleared, with its battles left
  - for an Elite track, a Power Level below the catalog's `eliteCampaignMinPowerLevel`

#### Scenario: Locked Elite campaign

- **GIVEN** Fall of Cadia Elite helps a goal, Fall of Cadia Standard has 12 battles left, and the player is at Power Level 18
- **WHEN** the user opens Plan > Insights
- **THEN** the track reads "Clear Fall of Cadia Standard first (12 battles left)" and "Reach Power Level 25 (you're at 18)"
