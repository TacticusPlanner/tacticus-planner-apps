# Spec Delta

## ADDED Requirements

### Requirement: Suggestions do not rely on objectives already cleared

A proposal SHALL be dropped when any objective of its subset is cleared through its depth (`legendary-event-teams`). A shown proposal's covered objectives cleared through its depth SHALL carry the card's cleared mark, and its reason line SHALL name only the other covered objectives, reading "Clears ~n · +N points over your teams" when none remain.

#### Scenario: Spent objective drops the pair proposal

- **GIVEN** the Lysander Alpha progress of the `legendary-event-teams` worked example (No Resilient cleared in battles 1–13, Flying open) and a {Flying, No Resilient} proposal with depth 12
- **WHEN** suggestions are built
- **THEN** that proposal is dropped, because No Resilient is cleared through battle 12, and the {Flying} proposal remains if it adds points

#### Scenario: Deeper proposal keeps the objective

- **GIVEN** the same progress and a {No Resilient} proposal with depth 14
- **WHEN** suggestions are built
- **THEN** it is kept, because battle 14 has No Resilient open, and its gain counts No Resilient only in battle 14

#### Scenario: Derived objective already cleared

- **GIVEN** the same progress and a {Flying} proposal at depth 11 whose members also all satisfy No Resilient
- **WHEN** the dialog shows it
- **THEN** both chips show, No Resilient with the cleared mark, and the reason line reads "Covers Flying · clears ~11 · +880 points over your teams" (assuming no existing team reaches those battles)
