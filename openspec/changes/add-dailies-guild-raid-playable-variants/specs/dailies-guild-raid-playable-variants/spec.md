## Purpose

Builds deterministic, roster-achievable Guild Raid team variants from explicit authored substitution rules while keeping performance estimation and strategic scoring out of scope.

## ADDED Requirements

### Requirement: Playable variants use only explicit slot rules

For each exact recommendation, the system SHALL keep an owned ideal hero in its original slot. For each missing ideal hero, it SHALL consider only owned characters listed in that slot's `replacementCharacterIds`. One character SHALL fill at most one slot, and a character already retained in an ideal slot SHALL not be used as a replacement elsewhere.

The system SHALL evaluate complete and partial assignments rather than greedily consuming candidates. It SHALL first maximize the number of filled essential slots, then maximize total filled slots. Among assignments tied on those objectives, it SHALL compare replacement choices in authored slot order, preferring higher existing character combat-power estimates, then authored replacement order, then unit id. It SHALL never pull a character from a Comp pool or the general roster without an explicit rule.

#### Scenario: One explicit replacement completes a lineup

- **WHEN** four ideal heroes are owned and the missing slot's first allowed replacement is owned and unused
- **THEN** the recommended variant contains the four ideal heroes plus that replacement with the mapping identified

#### Scenario: Candidate is already used by another slot

- **WHEN** the same owned candidate is allowed for two missing slots
- **THEN** the assignment uses it in at most one slot and searches the remaining authored candidates for the other

#### Scenario: Impossible completion reserves a shared candidate for an essential slot

- **WHEN** an essential and a non-essential missing slot share the only owned allowed candidate and neither has another owned candidate
- **THEN** the partial assignment fills the essential slot, leaves the non-essential slot unfilled, and does not use greedy slot order to produce an Unavailable result

#### Scenario: Comp member is not an explicit replacement

- **WHEN** an owned character appears in a referenced Comp but in no missing slot's replacement list
- **THEN** that character is not placed in the recommended variant

### Requirement: Variant availability follows fillability and essential rules

Alongside the existing exact-readiness result, the system SHALL classify variant availability as:

- `Exact` when all five ideal heroes are owned;
- `Playable` when all five hero slots can be filled by unique owned ideal/replacement characters and at least one substitution is used;
- `Unavailable` when any missing slot marked `essential` cannot be filled, or when no hero slot can be filled;
- `Partial` otherwise, when at least one but fewer than five slots can be filled.

Machine-of-War ownership SHALL be evaluated after hero assignment. The ideal owned Machine of War SHALL be preferred; otherwise the highest-investment owned id from `mowReplacementIds` SHALL be selected, with authored order and id as ties. Missing Machine-of-War availability SHALL be reported but SHALL NOT change hero readiness because an attack can still be made with the five-character lineup.

#### Scenario: Complete substituted team is playable

- **WHEN** every hero slot is filled by unique owned units and at least one is an allowed replacement
- **THEN** variant availability is Playable while exact readiness remains based only on exact-hero ownership

#### Scenario: Essential slot cannot be filled

- **WHEN** an essential ideal hero is missing and none of that slot's explicit replacements is owned and unused
- **THEN** variant availability is Unavailable even if other slots are filled

#### Scenario: Non-essential gaps remain partial

- **WHEN** no essential slot is unfillable but only four unique hero slots can be filled
- **THEN** variant availability is Partial

### Requirement: Exact readiness remains a separate unchanged signal

Exact readiness SHALL continue to be calculated only from ownership of the five exact `heroIds` as Ready, Partial, or Unavailable. Substitution availability, essential flags, Machine-of-War selection, and candidate investment SHALL NOT change that value. Recommendations SHALL remain in authored order rather than being reordered by exact readiness or variant availability.

#### Scenario: Substitution completes an exact-partial recommendation

- **WHEN** an exact recommendation is Partial because one ideal hero is missing but an allowed replacement completes the variant
- **THEN** exact readiness remains Partial, variant availability is Playable, and the recommendation keeps its authored position

### Requirement: Ideal and recommended lineups are clearly separated

Each recommendation SHALL retain the ideal Meta lineup and existing exact-readiness label and SHALL additionally show the separately labeled variant availability and recommended owned lineup when at least one slot is fillable. Every substitution SHALL identify the ideal hero, selected replacement, role, and that it was selected from the authored allowed list. The UI SHALL not state an effectiveness reduction or damage expectation because the rules contain no performance model.

At or above 768px, ideal and recommended lineups SHALL be comparable side by side. Below 768px, the recommended lineup and readiness SHALL appear first, with the ideal lineup and replacement details in expandable secondary content.

#### Scenario: Desktop compares ideal and Playable variant

- **WHEN** a recommendation with Playable variant availability is viewed at or above 768px
- **THEN** the ideal and recommended lineups plus replacement mappings are visible together

#### Scenario: Mobile prioritizes the usable team

- **WHEN** a recommendation with Playable variant availability is viewed below 768px
- **THEN** the recommended owned lineup appears before expandable ideal/replacement detail without horizontal scrolling

### Requirement: Recommendation ordering preserves editorial intent

Results SHALL remain in authored recommendation order. Exact readiness, variant availability, substitution count, and combat power SHALL NOT reorder different recommendations. Combat power used to choose between otherwise equivalent allowed assignments SHALL NOT be exposed as expected effectiveness.

The results SHALL recompute when active boss, roster, or variant-rule data changes.

#### Scenario: Earlier unavailable recommendation retains its position

- **WHEN** one authored recommendation has Playable variant availability and an earlier authored recommendation is Unavailable
- **THEN** the earlier recommendation remains first and both availability states are shown without a performance claim

#### Scenario: Equal results preserve editorial order

- **WHEN** two recommendations have any exact-readiness or variant-availability values
- **THEN** their authored order is preserved

### Requirement: Missing rules and no viable team are explicit

The system SHALL distinguish an older/absent rules payload from valid rules that yield no Exact or Playable variant result. Missing or malformed rules SHALL leave the exact-readiness experience intact and explain that variants are unavailable. Valid rules with no viable team SHALL show Partial/Unavailable variant results and their unfilled slots.

#### Scenario: Variant rules are not available

- **WHEN** exact recommendations exist but the synchronized payload does not provide valid variant rules
- **THEN** exact readiness remains visible and no substitutions are inferred

#### Scenario: Player cannot build a viable team

- **WHEN** rules and roster are valid but no variant availability is Exact or Playable
- **THEN** the page reports that no viable authored variant is currently buildable and shows the blocking slots
