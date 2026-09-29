# goal-farming-guidance Specification

## Purpose

Connects a goal or project view to the resources and eligible sources needed for progression without misrepresenting a preview as a raid that can be performed now.

## Requirements

### Requirement: Goal detail exposes resource and source guidance

For a goal with outstanding farmable needs, goal detail SHALL show a concise breakdown of remaining resources and quantities, suitable farming locations, and a reachable next action or Dailies link. It SHALL distinguish a location usable now from one locked, out of attempts, or otherwise unavailable, with the reason stated rather than silently omitting it. The quantities SHALL derive from the same need/allocation result used by planning, not an independent UI calculation.

A Rank goal whose milestone is fully covered by an earlier goal in the global order (`rankSlotAllocation.allocated === 0` for that slot) has no outstanding farmable need of its own to show; guidance SHALL state that it is covered by the earlier goal instead of a resource breakdown or a duplicate farming list.

#### Scenario: Farmable and locked locations

- **WHEN** a Rank goal needs a material obtainable at one eligible node and one locked node
- **THEN** its detail identifies the remaining quantity, the usable node as actionable, and the locked node as unavailable with a reason

#### Scenario: No actionable source

- **WHEN** a goal has a true outstanding need but no currently usable source
- **THEN** its detail states the unmet need and blocker without claiming the goal can complete now

#### Scenario: Covered by an earlier goal

- **WHEN** a Rank goal's milestone is fully allocated to an earlier goal in the global order and this goal's own remaining allocation is zero
- **THEN** its detail states that the milestone is covered by the earlier goal instead of listing resources to farm

### Requirement: Project detail provides scoped guidance

Project detail SHALL present a summary or direct link to outstanding goal farming guidance for that project. Dailies plans across all goals in the global goal order and a project is only an optional filter, so a project's guidance SHALL be labeled a preview whenever it is not the scope Dailies currently shows (all goals, or a different project filter), and SHALL NOT imply its listed nodes are today's schedule. Empty or fully satisfied projects SHALL show an appropriate next step rather than a misleading farming list.

#### Scenario: Project outside the Dailies scope

- **WHEN** the user opens a project that is not the project filter applied in Dailies (including when Dailies shows all goals)
- **THEN** its outstanding resource guidance is available as a preview, clearly distinct from today's scheduled raids

#### Scenario: No outstanding farmable need

- **WHEN** the viewed project has no outstanding farmable need
- **THEN** it shows an explicit no-work state or relevant navigation instead of an empty list

### Requirement: Planning settings choose the XP-book equivalent rarity

The Planning settings dialog SHALL include an XP-book rarity setting offering Common, Uncommon, Rare, Epic, Legendary, and Mythic, defaulting to Legendary. The choice SHALL persist with the user's planning settings. A missing or unsupported stored value SHALL behave as Legendary.

#### Scenario: Default rarity

- **WHEN** a user who has never chosen a rarity opens Planning settings
- **THEN** Legendary is selected and required-level guidance uses Legendary books

#### Scenario: Changing rarity

- **WHEN** the user saves Epic as the XP-book rarity
- **THEN** required-level guidance shows its additional equivalent in Epic books, and raw XP is unchanged

### Requirement: Required-level guidance preserves raw XP and adds an equivalent

For a Rank or Ability goal whose character is below the level it requires, the existing raw remaining-XP figure SHALL remain visible. Where the XP-book inventory allows allocation, guidance SHALL additionally show the _additional_ book-equivalent count, in the user's selected XP-book rarity, required after owned books have been allocated once in global goal order (across every project); it SHALL label the count with that rarity as an equivalent, not as owned actual books or a guaranteed shop/farm source. It SHALL not double-count books reserved for higher-priority goals or levels already covered by a higher-priority goal of the same unit.

Assumptions:

- XP per book by rarity in the current game data: Common 20, Uncommon 100, Rare 500, Epic 2,500, Legendary 12,500, Mythic 62,500; books are indivisible. The equivalent is `ceil(net XP gap / selected book XP)` and is anchored to the unit's current total XP and the goal's target threshold. Owned-book allocation is in raw XP across all rarities and does not depend on the selected rarity.
- Worked example: Bellator at level 31 has 82,000 total XP and a Rank goal requires level 32 (94,200 XP threshold). Raw remaining XP is 94,200 - 82,000 = 12,200 XP. If no unallocated books remain, net gap is 12,200 XP and, with the default Legendary rarity, the display shows 1 additional Legendary-book equivalent (`ceil(12,200 / 12,500) = 1`) alongside 12,200 raw XP; with Epic it shows 5 (`ceil(12,200 / 2,500)`), and with Mythic 1. If owned books worth at least 12,200 XP are allocated to this goal, net gap is 0 and additional equivalent is 0, while raw XP remains 12,200 until actually applied.

#### Scenario: Owned books already allocated elsewhere

- **WHEN** a goal earlier in the global order (in any project) requires a level and consumes all owned XP books in the account's shared pool
- **THEN** a later goal's additional equivalent uses the remaining zero-book pool, not the original inventory again

### Requirement: The create-goal required-level preview follows the selected rarity

The required-level cost preview on a Rank or Ability goal's creation card (`computeLevelGoalCost`) SHALL express the owned-book remainder in the user's selected XP-book rarity, so it never disagrees with goal and project guidance. The book count SHALL be `ceil(net XP gap / selected book XP)` after netting owned books, and the gold to apply SHALL be that count multiplied by the fixed per-book apply cost (500 gold, independent of rarity). A missing or unsupported stored rarity SHALL behave as Legendary, which keeps today's Legendary-only figures for users who never change the setting. The raw remaining-XP figure is unchanged.

#### Scenario: Default rarity keeps today's preview

- **GIVEN** a user who has never chosen a rarity and a character needing 12,200 XP with no owned books
- **WHEN** the creation card previews the required level
- **THEN** it shows 1 book and 500 gold, as before

#### Scenario: A lower rarity changes book count and gold together

- **GIVEN** the user selected Epic (2,500 XP per book) and the same 12,200 XP gap with no owned books
- **WHEN** the creation card previews the required level
- **THEN** it shows 5 books and 2,500 gold, and the goal detail guidance shows the same 5 Epic-book equivalent
