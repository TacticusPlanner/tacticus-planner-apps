# Spec Delta

## MODIFIED Requirements

### Requirement: Team suggestions per lane

For a lane, the planner SHALL build proposals, client side and never stored, as follows.

- **Subsets.** Every set of one or two of the lane's objectives.
- **Candidates.** For a subset, the units the lane allows that satisfy every objective in it. Units the synced roster lacks are excluded while **Only unlocked** is on.
- **Order.** Candidates are ordered: units with an Active Unlock, Ascension, Rank or Ability goal first, only while **Prefer units with goals** is on; then effective power on the synced roster (Stage 5), descending; then points per battle, descending; then localized name.
- **Proposal.** The first five candidates, in that order, with no reserve, when the subset has at least three candidates; a subset with fewer than three has no proposal (a team needs three characters, `legendary-event-team-size`). Its covered objectives are derived from its members (every objective all of them satisfy), and its depth is its Stage 5 team estimate.
- **Merging.** Proposals with the same member set are one proposal. A proposal whose member set equals an existing team's on the lane is dropped.
- **Gain.** A proposal's gain is the lane's reachable points (see `legendary-event-upgrade-impact`) with the proposal added to the lane's existing teams, minus without it. Proposals with a gain of 0 are dropped.
- **Ranking.** Gain descending, then depth descending, then member count descending, then the lowest catalog index among its covered objectives.

**Only unlocked** SHALL default to on and **Prefer units with goals** to off. Both SHALL be kept while the dialog is open, including while it is hidden behind the team editor opened by Use this team (cancelling the editor returns to the same proposals and toggles), and reset when the dialog closes. Suggestions read the synced roster, never Goals Preview. Gains are event points anchored to the current roster and progress.

Assumptions:

- Any unit may be in several teams of the same lane.
- A proposal's depth comes from the Stage 5 estimate, with the same assumptions as `legendary-event-clear-estimates`.

#### Scenario: Worked example on Uthar Alpha

- **GIVEN** `powerRatio` 0.5, `ultraTigurius` in a horde-mode tier with multiplier 1.2, the reachable-points worked example's Alpha lane and synced progress, no teams on Alpha, and a roster whose only units Alpha allows are Calgar, Titus, Incisus (`ultraApothecary`) and Certus (`ultraEliminatorSgt`), each at combat power 8,792, and Tigurius at effective power 10,550.4
- **AND** on Alpha, Calgar satisfies Ultramarines, Max 2 Hits and Melee (224 points per battle); Titus satisfies Ultramarines and Melee (174); Incisus satisfies Ultramarines, Max 2 Hits, Melee and Piercing (314); Tigurius and Certus satisfy Ultramarines and Max 2 Hits (159); nobody satisfies Resilient
- **WHEN** suggestions are built
- **THEN** {Ultramarines} proposes Tigurius, Incisus, Calgar, Titus, Certus, covering Ultramarines, effective power 45,718.4, depth 6, gain 0 + 75 + 175 + 183 + 187 + 191 = 811
- **AND** {Max 2 Hits} proposes Tigurius, Incisus, Calgar, Certus, covering Ultramarines and Max 2 Hits, effective power 36,926.4, depth 5, gain 50 + 125 + 225 + 233 + 237 = 870
- **AND** {Melee} proposes Incisus, Calgar, Titus, covering Ultramarines and Melee, effective power 26,376, depth 5, gain 65 + 140 + 240 + 248 + 252 = 945
- **AND** {Piercing} has one candidate (Incisus) and {Max 2 Hits, Melee} has two (Incisus and Calgar), so neither proposes a team
- **AND** every other subset has no candidate (Resilient), fewer than three, or the same members as a proposal above
- **AND** the ranking is Melee team (+945, depth 5), Max 2 Hits team (+870), Ultramarines team (+811)

#### Scenario: Gains re-rank after a team is saved

- **GIVEN** the worked example and the user has saved the Melee proposal (Incisus, Calgar, Titus) as a team with no stored depth
- **WHEN** suggestions are rebuilt
- **THEN** the Melee proposal is gone (same members as a team); the Max 2 Hits team adds Max 2 Hits in battles 1 to 5, +250; the Ultramarines team adds battle 6, 43 + 43 + 30 + 75 = +191
- **AND** the ranking is +250, +191

#### Scenario: Prefer units with goals

- **GIVEN** a subset with seven candidates where the two weakest have Active goals
- **WHEN** Prefer units with goals is on
- **THEN** the proposal for that subset holds those two units first, followed by the three strongest of the rest

#### Scenario: Only unlocked off

- **GIVEN** Only unlocked is turned off and a locked unit satisfies a subset
- **WHEN** suggestions are built
- **THEN** the locked unit can be a member, adds 0 effective power and shows the locked styling
