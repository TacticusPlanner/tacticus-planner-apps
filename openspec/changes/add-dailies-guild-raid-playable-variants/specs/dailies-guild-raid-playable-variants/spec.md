## Purpose

Builds deterministic, roster-achievable Guild Raid team variants from explicit authored substitution rules while keeping performance estimation and strategic scoring out of scope.

## ADDED Requirements

### Requirement: Playable variants use only explicit slot rules

For each exact recommendation, the system SHALL keep an owned ideal hero in its original slot. For each missing ideal hero, it SHALL consider only owned characters listed in that slot's `replacementCharacterIds`. One character SHALL fill at most one slot, and a character already retained in an ideal slot SHALL not be used as a replacement elsewhere.

The system SHALL choose a complete assignment that minimizes the number of substitutions. Among assignments with the same substitution count, it SHALL prefer higher existing character combat-power estimates for substituted slots and then authored replacement order and unit id for stable ties. It SHALL never pull a character from a Comp pool or the general roster without an explicit rule.

#### Scenario: One explicit replacement completes a lineup

- **WHEN** four ideal heroes are owned and the missing slot's first allowed replacement is owned and unused
- **THEN** the recommended variant contains the four ideal heroes plus that replacement with the mapping identified

#### Scenario: Candidate is already used by another slot

- **WHEN** the same owned candidate is allowed for two missing slots
- **THEN** the assignment uses it in at most one slot and searches the remaining authored candidates for the other

#### Scenario: Comp member is not an explicit replacement

- **WHEN** an owned character appears in a referenced Comp but in no missing slot's replacement list
- **THEN** that character is not placed in the recommended variant

### Requirement: Four-state readiness follows fillability and essential rules

The system SHALL classify a recommendation as:

- `Ready` when all five ideal heroes are owned;
- `Playable Variant` when all five hero slots can be filled by unique owned ideal/replacement characters and at least one substitution is used;
- `Unavailable` when any missing slot marked `essential` cannot be filled, or when no hero slot can be filled;
- `Partial` otherwise, when at least one but fewer than five slots can be filled.

Machine-of-War ownership SHALL be evaluated after hero assignment. The ideal owned Machine of War SHALL be preferred; otherwise the highest-investment owned id from `mowReplacementIds` SHALL be selected, with authored order and id as ties. Missing Machine-of-War availability SHALL be reported but SHALL NOT change hero readiness because an attack can still be made with the five-character lineup.

#### Scenario: Complete substituted team is playable

- **WHEN** every hero slot is filled by unique owned units and at least one is an allowed replacement
- **THEN** the result is Playable Variant

#### Scenario: Essential slot cannot be filled

- **WHEN** an essential ideal hero is missing and none of that slot's explicit replacements is owned and unused
- **THEN** the result is Unavailable even if other slots are filled

#### Scenario: Non-essential gaps remain partial

- **WHEN** no essential slot is unfillable but only four unique hero slots can be filled
- **THEN** the result is Partial

### Requirement: Ideal and recommended lineups are clearly separated

Each recommendation SHALL retain the ideal Meta lineup and SHALL additionally show the recommended owned lineup when at least one slot is fillable. Every substitution SHALL identify the ideal hero, selected replacement, role, and that it was selected from the authored allowed list. The UI SHALL not state an effectiveness reduction or damage expectation because the rules contain no performance model.

At or above 768px, ideal and recommended lineups SHALL be comparable side by side. Below 768px, the recommended lineup and readiness SHALL appear first, with the ideal lineup and replacement details in expandable secondary content.

#### Scenario: Desktop compares ideal and playable variant

- **WHEN** a Playable Variant is viewed at or above 768px
- **THEN** the ideal and recommended lineups plus replacement mappings are visible together

#### Scenario: Mobile prioritizes the usable team

- **WHEN** a Playable Variant is viewed below 768px
- **THEN** the recommended owned lineup appears before expandable ideal/replacement detail without horizontal scrolling

### Requirement: Recommendation ordering is useful without performance scoring

Results SHALL be ordered by readiness (`Ready`, `Playable Variant`, `Partial`, `Unavailable`), then by fewer substitutions, then by authored recommendation order. Combat power used to choose between allowed replacement candidates SHALL NOT be exposed as expected effectiveness and SHALL NOT reorder different authored recommendations within the same readiness/substitution group.

The results SHALL recompute when active boss, roster, or variant-rule data changes.

#### Scenario: Buildable team precedes unavailable Meta

- **WHEN** one authored recommendation is Playable Variant and an earlier authored recommendation is Unavailable
- **THEN** the Playable Variant is displayed first without claiming it has higher expected damage

#### Scenario: Equal results preserve editorial order

- **WHEN** two recommendations have the same readiness and substitution count
- **THEN** their authored order is preserved

### Requirement: Missing rules and no viable team are explicit

The system SHALL distinguish an older/absent rules payload from valid rules that yield no Ready or Playable Variant result. Missing or malformed rules SHALL leave the exact-readiness experience intact and explain that variants are unavailable. Valid rules with no viable team SHALL show Partial/Unavailable results and their unfilled slots.

#### Scenario: Variant rules are not available

- **WHEN** exact recommendations exist but the synchronized payload does not provide valid variant rules
- **THEN** exact readiness remains visible and no substitutions are inferred

#### Scenario: Player cannot build a viable team

- **WHEN** rules and roster are valid but no result is Ready or Playable Variant
- **THEN** the page reports that no viable authored variant is currently buildable and shows the blocking slots
