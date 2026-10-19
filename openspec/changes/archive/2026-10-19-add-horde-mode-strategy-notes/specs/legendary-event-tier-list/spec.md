## ADDED Requirements

### Requirement: Tier List tile details show horde-mode strategy

The tile details SHALL include a collapsed **Strategy** section when the character has any `hordeStrategy` text or `synergies`. Opened, it SHALL show, in this order and each only when present: Strengths, How to use, Recommended teammates (each with portrait and localized name, linking to `/library/characters/{unitId}`, in the served `synergies` order), and Relic advice. A missing field in the reader's language SHALL fall back to English. All text SHALL come from the `hordeStrategy` locale namespace by `unitId`; nothing is hard-coded. The section SHALL be the same on desktop (popover) and mobile (bottom sheet).

Assumptions:

- Strategy text applies to every horde-style mode; mode restrictions (factions, alliances, LRE objectives) are evaluated elsewhere.

#### Scenario: Angrax strategy

- **GIVEN** `blackTerminator` with `hordeStrategy` strengths, how to use and relic advice, and synergies `deathRotbone`, `worldTerminator`, `blackAbaddon`
- **WHEN** the user opens Angrax's details and expands Strategy
- **THEN** it shows Strengths, How to use, teammates Nauseous, Wrask and Abaddon in that order, each linking to its Library page, and the Daemonflesh Plate advice

#### Scenario: Text without teammates

- **GIVEN** `custoBladeChampion` with strengths and how to use, no relic advice and no synergies
- **WHEN** the user expands Strategy
- **THEN** it shows Strengths and How to use, and no teammates or relic block

#### Scenario: No strategy

- **GIVEN** an untiered character, with no `hordeStrategy` keys and no synergies
- **WHEN** the user opens its details
- **THEN** no Strategy section is shown
