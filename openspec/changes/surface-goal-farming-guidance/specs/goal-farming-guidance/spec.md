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

### Requirement: Level guidance preserves raw XP and adds an equivalent

For a Level goal, the existing raw remaining-XP figure SHALL remain visible. Where the selected project and XP-book inventory allow allocation, guidance SHALL additionally show the _additional_ Legendary-book-equivalent count required after owned books have been allocated once in goal-priority order; it SHALL label the count as an equivalent, not as owned actual Legendary books or a guaranteed shop/farm source. It SHALL not double-count books reserved for higher-priority goals.

Assumptions:

- A Legendary XP book contributes 12,500 XP in the current game data; books are indivisible. The equivalent is `ceil(net XP gap / 12,500)` and is anchored to the unit's current total XP and the goal's target threshold.
- Worked example: Bellator at level 31 has 82,000 total XP and targets level 32 (94,200 XP threshold). Raw remaining XP is 94,200 - 82,000 = 12,200 XP. If no unallocated books remain, net gap is 12,200 XP and the display shows 1 additional Legendary-book equivalent (`ceil(12,200 / 12,500) = 1`) alongside 12,200 raw XP. If one owned Legendary book is allocated to this goal, net gap is 0 and additional equivalent is 0, while raw XP remains 12,200 until actually applied.

#### Scenario: Owned books already allocated elsewhere

- **WHEN** a higher-priority Level goal consumes all owned XP books in the selected project's shared pool
- **THEN** a lower-priority Level goal's additional equivalent uses the remaining zero-book pool, not the original inventory again
