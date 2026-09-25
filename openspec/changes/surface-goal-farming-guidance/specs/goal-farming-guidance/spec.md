## Purpose

Connects a goal or project view to the resources and eligible sources needed for progression without misrepresenting a preview as a raid that can be performed now.

## ADDED Requirements

### Requirement: Goal detail exposes resource and source guidance

For a goal with outstanding farmable needs, goal detail SHALL show a concise breakdown of remaining resources and quantities, suitable farming locations, and a reachable next action or Dailies link. It SHALL distinguish a location usable now from one locked, out of attempts, or otherwise unavailable, with the reason stated rather than silently omitting it. The quantities SHALL derive from the same need/allocation result used by planning, not an independent UI calculation.

#### Scenario: Farmable and locked locations

- **WHEN** a Rank goal needs a material obtainable at one eligible node and one locked node
- **THEN** its detail identifies the remaining quantity, the usable node as actionable, and the locked node as unavailable with a reason

#### Scenario: No actionable source

- **WHEN** a goal has a true outstanding need but no currently usable source
- **THEN** its detail states the unmet need and blocker without claiming the goal can complete now

### Requirement: Project detail provides scoped guidance

Project detail SHALL present a summary or direct link to outstanding goal farming guidance for that project. A project not selected for today's Dailies SHALL label this as a preview and SHALL NOT imply its listed nodes are part of the currently selected daily schedule. Empty or fully satisfied projects SHALL show an appropriate next step rather than a misleading farming list.

#### Scenario: Non-selected project preview

- **WHEN** the user opens a project that is not the Dailies-selected project
- **THEN** its outstanding resource guidance is available as a preview, clearly distinct from today's scheduled raids

#### Scenario: No outstanding farmable need

- **WHEN** the viewed project has no outstanding farmable need
- **THEN** it shows an explicit no-work state or relevant navigation instead of an empty list

### Requirement: Planning settings choose the XP-book equivalent rarity

The Planning settings dialog SHALL include an XP-book rarity setting offering Common, Uncommon, Rare, Epic, Legendary, and Mythic, defaulting to Legendary. The choice SHALL persist with the user's planning settings. A missing or unsupported stored value SHALL behave as Legendary.

#### Scenario: Default rarity

- **WHEN** a user who has never chosen a rarity opens Planning settings
- **THEN** Legendary is selected and Level guidance uses Legendary books

#### Scenario: Changing rarity

- **WHEN** the user saves Epic as the XP-book rarity
- **THEN** Level guidance shows its additional equivalent in Epic books, and raw XP is unchanged

### Requirement: Level guidance preserves raw XP and adds an equivalent

For a Level goal, the existing raw remaining-XP figure SHALL remain visible. Where the selected project and XP-book inventory allow allocation, guidance SHALL additionally show the _additional_ book-equivalent count, in the user's selected XP-book rarity, required after owned books have been allocated once in goal-priority order; it SHALL label the count with that rarity as an equivalent, not as owned actual books or a guaranteed shop/farm source. It SHALL not double-count books reserved for higher-priority goals.

Assumptions:

- XP per book by rarity in the current game data: Common 20, Uncommon 100, Rare 500, Epic 2,500, Legendary 12,500, Mythic 62,500; books are indivisible. The equivalent is `ceil(net XP gap / selected book XP)` and is anchored to the unit's current total XP and the goal's target threshold. Owned-book allocation is in raw XP across all rarities and does not depend on the selected rarity.
- Worked example: Bellator at level 31 has 82,000 total XP and targets level 32 (94,200 XP threshold). Raw remaining XP is 94,200 - 82,000 = 12,200 XP. If no unallocated books remain, net gap is 12,200 XP and, with the default Legendary rarity, the display shows 1 additional Legendary-book equivalent (`ceil(12,200 / 12,500) = 1`) alongside 12,200 raw XP; with Epic it shows 5 (`ceil(12,200 / 2,500)`), and with Mythic 1. If owned books worth at least 12,200 XP are allocated to this goal, net gap is 0 and additional equivalent is 0, while raw XP remains 12,200 until actually applied.

#### Scenario: Owned books already allocated elsewhere

- **WHEN** a higher-priority Level goal consumes all owned XP books in the selected project's shared pool
- **THEN** a lower-priority Level goal's additional equivalent uses the remaining zero-book pool, not the original inventory again
