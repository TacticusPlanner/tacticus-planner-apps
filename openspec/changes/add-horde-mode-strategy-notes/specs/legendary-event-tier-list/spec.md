## ADDED Requirements

### Requirement: Tier List tile details show horde-mode strategy

The tile details SHALL include a collapsed **Strategy** section when the character has any `hordeStrategy` text or `synergies`. Opened, it SHALL show, in this order and each only when present: Strengths, How to use, Recommended teammates (each with portrait and localized name, linking to `/library/characters/{unitId}`, in the served `synergies` order), and the relic advice beneath each relic row. All text SHALL come from the `hordeStrategy` locale namespace by `unitId`; nothing is hard-coded. The section SHALL be the same on desktop (popover) and mobile (bottom sheet).

Assumptions:

- Strategy text applies to every horde-style mode; mode restrictions (factions, alliances, LRE objectives) are evaluated elsewhere.

#### Scenario: Angrax strategy

- **GIVEN** `blackTerminator` with `hordeStrategy` strengths, how to use and relic advice, synergies `deathRotbone`, `worldTerminator`, `blackAbaddon`, `deathBlightlord`, and relic `R_Block_DaemonfleshPlate`
- **WHEN** the user opens Angrax's details and expands Strategy
- **THEN** it shows Strengths, How to use, teammates Nauseous, Wrask, Abaddon and Maladus in that order, and the Daemonflesh Plate row carries its advice

#### Scenario: No strategy

- **GIVEN** a character with no `hordeStrategy` keys and no synergies
- **WHEN** the user opens its details
- **THEN** no Strategy section is shown
