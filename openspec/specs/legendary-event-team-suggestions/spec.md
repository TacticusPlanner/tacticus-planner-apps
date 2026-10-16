# legendary-event-team-suggestions Specification

## Purpose

Defines how the planner proposes teams for a Legendary Event lane from the lane's objectives, the synced roster, goals and existing teams; how proposals are ranked and explained; and how the user accepts one into the team editor without anything being saved automatically.

## Requirements

### Requirement: Team suggestions per lane

For a lane, the planner SHALL build proposals, client side and never stored, as follows.

- **Subsets.** Every set of one or two of the lane's objectives.
- **Candidates.** For a subset, the units the lane allows that satisfy every objective in it. Units the synced roster lacks are excluded while **Only unlocked** is on.
- **Order.** Candidates are ordered: units with an Active Unlock, Ascension, Rank or Ability goal first, only while **Prefer units with goals** is on; then effective power on the synced roster (Stage 5), descending; then points per battle, descending; then localized name.
- **Proposal.** The first five candidates, in that order, with no reserve. Its covered objectives are derived from its members (every objective all of them satisfy), and its depth is its Stage 5 team estimate.
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
- **THEN** {Ultramarines} proposes Tigurius, Incisus, Calgar, Titus, Certus, covering Ultramarines, effective power 45,718.4, depth 6, gain 0 + 75 + 140 + 144 + 146 + 148 = 653
- **AND** {Max 2 Hits} proposes Tigurius, Incisus, Calgar, Certus, covering Ultramarines and Max 2 Hits, effective power 36,926.4, depth 5, gain 50 + 125 + 190 + 194 + 196 = 755
- **AND** {Melee} proposes Incisus, Calgar, Titus, covering Ultramarines and Melee, effective power 26,376, depth 5, gain 65 + 140 + 205 + 209 + 211 = 830
- **AND** {Piercing} proposes Incisus alone, covering Ultramarines, Max 2 Hits, Melee and Piercing, effective power 8,792, depth 3 (battle 4's threshold is 10,351.5), gain 205 + 280 + 345 = 830
- **AND** {Max 2 Hits, Melee} proposes Incisus, Calgar, covering Ultramarines, Max 2 Hits and Melee, effective power 17,584, depth 4, gain 115 + 190 + 255 + 259 = 819
- **AND** every other subset either has no candidate (Resilient) or the same members as a proposal above
- **AND** the ranking is Melee team (+830, depth 5), Incisus alone (+830, depth 3), Incisus and Calgar (+819), Max 2 Hits team (+755), Ultramarines team (+653)

#### Scenario: Gains re-rank after a team is saved

- **GIVEN** the worked example and the user has saved the Melee proposal (Incisus, Calgar, Titus) as a team with no stored depth
- **WHEN** suggestions are rebuilt
- **THEN** the Melee proposal is gone (same members as a team); Incisus alone adds Max 2 Hits and Piercing in battles 1 to 3, +420; the Max 2 Hits team adds Max 2 Hits in battles 1 to 5, +250; Incisus and Calgar add Max 2 Hits in battles 1 to 4, +200; the Ultramarines team adds battle 6, 43 + 30 + 75 = +148
- **AND** the ranking is +420, +250, +200, +148

#### Scenario: Prefer units with goals

- **GIVEN** a subset with seven candidates where the two weakest have Active goals
- **WHEN** Prefer units with goals is on
- **THEN** the proposal for that subset holds those two units first, followed by the three strongest of the rest

#### Scenario: Only unlocked off

- **GIVEN** Only unlocked is turned off and a locked unit satisfies a subset
- **WHEN** suggestions are built
- **THEN** the locked unit can be a member, adds 0 effective power and shows the locked styling

### Requirement: Suggest teams dialog

Each lane's Teams section SHALL offer a **Suggest teams** button beside Add team, and in its empty state. It SHALL open a dialog on desktop and a bottom sheet on mobile. The dialog SHALL show the two toggles and the first three proposals, with **Show more** revealing up to ten. Each proposal SHALL show:

- its members as portraits in order, each with its goal badge and locked styling;
- its covered objectives as chips;
- a one-line reason: "Covers Ultramarines and Melee · clears ~5 · +830 points over your teams";
- a **Use this team** action.

**Use this team** SHALL open the team editor (`legendary-event-teams`) as a new team with the proposal's members in order, its derived objectives ticked and the default name. Saving SHALL create the team through the existing create call. Cancelling SHALL save nothing and return to the suggestions. No proposal SHALL ever be saved without the user saving the editor.

When clear estimates are unavailable, Suggest teams SHALL be disabled with the reason "Needs clear estimates". With no proposal, the dialog SHALL say "No team adds points over your current teams". While inputs load, it SHALL show a skeleton.

#### Scenario: Use this team

- **GIVEN** the worked example
- **WHEN** the user presses Use this team on the Melee team proposal
- **THEN** the team editor opens as a new team with Incisus, Calgar and Titus selected in that order, Ultramarines and Melee ticked and the name "Ultramarines · Melee"; nothing is saved until the user presses Save

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
