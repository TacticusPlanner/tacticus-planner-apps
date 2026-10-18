# Spec Delta

## MODIFIED Requirements

### Requirement: Team suggestions per lane

For a lane, the planner SHALL build proposals, client side and never stored, as follows.

- **Subsets.** Every set of one or two of the lane's objectives.
- **Candidates.** For a subset, the units the lane allows that satisfy every objective in it. Units the synced roster lacks are excluded while **Only unlocked** is on.
- **Order.** Candidates are ordered: units with an Active Unlock, Ascension, Rank or Ability goal first, only while **Prefer units with goals** is on; then effective power on the synced roster (Stage 5), descending; then points per battle, descending; then localized name.
- **Proposal.** The first five candidates, in that order, with no reserve, when the subset has at least three candidates; a subset with fewer than three has no proposal (a team needs three characters, `legendary-event-team-size`). Its covered objectives are derived from its members (every objective all of them satisfy), and its depth is its Stage 5 team estimate.
- **Support.** A member is a useful Healer when it has the Healer trait and another member lacks the Mechanical trait, and a useful Mechanic when it has the Mechanic trait and another member has the Mechanical trait. A five-member proposal without a useful Healer takes the first candidate outside it that the player holds with the Healer trait in place of its last member (candidate order) that is neither Healer nor Mechanic and whose swap gives a useful Healer while keeping any useful Mechanic, trying earlier such members if needed; then the same for a Mechanic. Members stay in candidate order.
- **Merging.** Proposals with the same member set are one proposal. A proposal whose member set equals an existing team's on the lane is dropped.
- **Gain.** A proposal's gain is the lane's reachable points (see `legendary-event-upgrade-impact`) with the proposal added to the lane's existing teams, minus without it. Proposals with a gain of 0 are dropped.
- **Ranking.** Gain descending, then depth descending, then member count descending, then the lowest catalog index among its covered objectives.

**Only unlocked** SHALL default to on and **Prefer units with goals** to off. Both SHALL be kept while the dialog is open, including while it is hidden behind the team editor opened by Use this team (cancelling the editor returns to the same proposals and toggles), and reset when the dialog closes. Suggestions read the synced roster, never Goals Preview. Gains are event points anchored to the current roster and progress.

Assumptions:

- Any unit may be in several teams of the same lane.
- A proposal's depth comes from the Stage 5 estimate, with the same assumptions as `legendary-event-clear-estimates`.

#### Scenario: Worked example on Uthar Alpha

- **GIVEN** `powerRatio` 1.2, `ultraTigurius` in a horde-mode tier with multiplier 1.2, the reachable-points worked example's Alpha lane and synced progress, no teams on Alpha, and a roster whose only units Alpha allows are Calgar, Titus, Incisus (`ultraApothecary`), Tigurius and Certus (`ultraEliminatorSgt`) as in the `legendary-event-clear-estimates` worked example, at powers 21,675, 21,883, 24,753, 16,672 and 13,912, so Tigurius's effective power is 20,006.4
- **AND** on Alpha, Calgar satisfies Ultramarines, Max 2 Hits and Melee (224 points per battle); Titus satisfies Ultramarines and Melee (174); Incisus satisfies Ultramarines, Max 2 Hits, Melee and Piercing (314); Tigurius and Certus satisfy Ultramarines and Max 2 Hits (159); nobody satisfies Resilient
- **WHEN** suggestions are built
- **THEN** {Ultramarines} proposes Incisus, Titus, Calgar, Tigurius, Certus, covering Ultramarines, effective power 102,229.4, depth 6, gain 0 + 75 + 175 + 183 + 187 + 191 = 811
- **AND** {Max 2 Hits} proposes Incisus, Calgar, Tigurius, Certus, covering Ultramarines and Max 2 Hits, effective power 80,346.4, depth 5, gain 50 + 125 + 225 + 233 + 237 = 870
- **AND** {Melee} proposes Incisus, Titus, Calgar, covering Ultramarines and Melee, effective power 68,311, depth 5, gain 65 + 140 + 240 + 248 + 252 = 945
- **AND** {Piercing} has one candidate (Incisus) and {Max 2 Hits, Melee} has two (Incisus and Calgar), so neither proposes a team
- **AND** every other subset has no candidate (Resilient), fewer than three, or the same members as a proposal above
- **AND** the ranking is Melee team (+945, depth 5), Max 2 Hits team (+870), Ultramarines team (+811)

#### Scenario: Gains re-rank after a team is saved

- **GIVEN** the worked example and the user has saved the Melee proposal (Incisus, Titus, Calgar) as a team with no stored depth
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

#### Scenario: Healer joins a non-mechanical team

- **GIVEN** a subset with seven candidates, none Mechanical, the five strongest without the Healer trait and the sixth a Healer
- **WHEN** suggestions are built
- **THEN** the proposal holds the four strongest and the Healer

#### Scenario: No healer for a fully mechanical team

- **GIVEN** a subset whose five strongest candidates are all Mechanical and a weaker Healer candidate
- **WHEN** suggestions are built
- **THEN** the proposal is the five strongest, without the Healer

#### Scenario: Mechanic joins a team with a mechanical member

- **GIVEN** a subset whose five strongest candidates include a Mechanical unit and no Mechanic, and a weaker Mechanic candidate
- **WHEN** suggestions are built
- **THEN** the Mechanic replaces the weakest member that is neither Healer nor Mechanic

### Requirement: Suggest teams dialog

Each lane's Teams section SHALL offer a **Suggest teams** button beside Add team, and in its empty state. It SHALL open a dialog on desktop and a bottom sheet on mobile. The dialog SHALL show the two toggles and the first three proposals, with **Show more** revealing up to ten. Each proposal SHALL show:

- its members as portraits in order, each with its goal badge and locked styling;
- its covered objectives as chips;
- a one-line reason: "Covers Ultramarines and Melee · clears ~5 · +945 points over your teams";
- a **Use this team** action.

**Use this team** SHALL open the team editor (`legendary-event-teams`) as a new team with the proposal's members in order, its derived objectives covered, the default name, and the proposal's objective subset selected as the picker's objective chips. Saving SHALL create the team through the existing create call. Cancelling SHALL save nothing and return to the suggestions. No proposal SHALL ever be saved without the user saving the editor.

When clear estimates are unavailable, Suggest teams SHALL be disabled with the reason "Needs clear estimates". With no proposal, the dialog SHALL say "No team adds points over your current teams". While inputs load, it SHALL show a skeleton.

#### Scenario: Use this team

- **GIVEN** the worked example
- **WHEN** the user presses Use this team on the Melee team proposal
- **THEN** the team editor opens as a new team with Incisus, Titus and Calgar selected in that order, Ultramarines and Melee covered, the name "Ultramarines · Melee" and the Melee chip selected in the picker; nothing is saved until the user presses Save

#### Scenario: Cancel saves nothing

- **WHEN** the user cancels the editor opened from a proposal
- **THEN** no team is created and the suggestions are shown again unchanged

#### Scenario: Estimates unavailable

- **GIVEN** the horde-mode tier read failed
- **WHEN** the Teams section renders
- **THEN** Suggest teams is disabled and its accessible description reads "Needs clear estimates"

#### Scenario: Desktop dialog

- **WHEN** the user opens Suggest teams at or above 768px
- **THEN** a dialog shows the toggles in one row above the stacked proposal cards

#### Scenario: Mobile sheet

- **WHEN** the user opens Suggest teams below 768px
- **THEN** a bottom sheet shows the toggles in a compact bar, proposal cards stacked, and full-width Use this team buttons with a touch target of at least 44px
