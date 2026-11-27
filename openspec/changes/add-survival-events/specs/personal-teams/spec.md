## ADDED Requirements

### Requirement: Survival teams follow their event's rules

A team MAY carry a `survivalEventKey`. The editor SHALL keep such a team Horde only (the mode choice is hidden), show the event's featured hero, caps and allowed factions, leave the featured hero out of the picker and hide MoWs when the event takes none. It SHALL flag, as the API does, `survivalModeRequired`, `unknownSurvivalEvent`, `survivalFeaturedCharacter`, `survivalTooManyCharacters`, `survivalTooManyMows`, and `mowsNotAllowed` and `factionNotAllowed` under the event's rules. The Teams page SHALL label the team "Survival: <event name>", for past events too.

#### Scenario: Featured hero stored

- **GIVEN** a team for December 2026
- **WHEN** its lineup includes the event's featured hero
- **THEN** the editor marks that hero and the team is flagged with `survivalFeaturedCharacter`
