## ADDED Requirements

### Requirement: Target collisions name the sibling goal for every type

When a target edit collides with another in-flight goal of the same unit and type, the dialog SHALL keep the draft and show a message naming the sibling goal's type and target, for Rank, Ascension, Ability and Upgrade alike, with an action that opens that goal.

#### Scenario: Ascension edit collides

- **GIVEN** Ragnar has in-flight Ascension goals ending at `Legendary:RedFiveStars` and `Mythic:OneBlueStar`
- **WHEN** the user edits the first goal's end to `Mythic:OneBlueStar` and saves
- **THEN** the draft is kept and the message names the existing Ascension → Mythic ★1 goal
