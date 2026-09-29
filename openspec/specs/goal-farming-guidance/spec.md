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
- **THEN** required-level guidance's available and needed counts both recompute in Epic books, and raw XP and the Potential progress percentage are unchanged

### Requirement: Required-level guidance preserves raw XP and adds an equivalent

For a Rank or Ability goal whose character is below the level it requires, the existing raw remaining-XP figure SHALL remain visible. Where the XP-book inventory allows allocation, guidance SHALL additionally show, in the user's selected XP-book rarity, an available/needed book-equivalent count: the shared owned-book pool's book-equivalent size at this goal's position in global priority order (before this goal's own consumption) over the book-equivalent count this goal itself needs to reach its required level, after subtracting levels already covered by a higher-priority goal of the same unit. It SHALL label both counts with the selected rarity as an equivalent, not as owned actual books of that rarity or a guaranteed shop/farm source. It SHALL not double-count books reserved for higher-priority goals or levels already covered by a higher-priority goal of the same unit.

Both counts SHALL derive from the same raw-XP priority-ordered allocation used by planning (the same one that produces the existing Potential progress bar/percentage), rounding only for display: the available count rounds down (a partial book isn't obtainable from the pool), the needed count rounds up (a partial book still costs a whole one to apply). The available count is not capped to the needed count — a goal whose pool comfortably exceeds its own need shows that surplus rather than being clamped to 100%. The Potential progress percentage SHALL reflect only the gain owned books actually provide toward this goal's required level (0% when the available count is 0), never the character's unrelated absolute position on the level scale; changing the selected rarity SHALL change the displayed book counts and SHALL NOT change that percentage.

Assumptions:

- XP per book by rarity in the current game data: Common 20, Uncommon 100, Rare 500, Epic 2,500, Legendary 12,500, Mythic 62,500; books are indivisible. `needed = ceil(chargedXp / selected book XP)`; `available = floor(poolXp / selected book XP)`, where `chargedXp` is this goal's own priority-ordered XP interval (excluding levels a higher-priority goal of the same unit already covers) and `poolXp` is the shared owned-book pool's raw XP total remaining when this goal's turn in priority order arrives, before this goal consumes from it. Owned-book allocation itself is computed in raw XP across all rarities and does not depend on the selected rarity; only the two counts' rounding does.
- Worked example: three Rank goals share a 100,000 XP owned-book pool (in raw XP, mixed rarities), each needing 12,200 XP (`chargedXp`) to its own next level, processed in priority order 1, 2, 3. At the default Legendary rarity (12,500 XP/book): priority 1 sees the full pool, `available = floor(100,000 / 12,500) = 8`, `needed = ceil(12,200 / 12,500) = 1` (shown as 8/1, fully covered, pool drops to 87,800 after spending 12,200); priority 2 sees the reduced pool, `available = floor(87,800 / 12,500) = 7`, `needed = 1` (7/1, also covered, pool drops to 75,600); this continues until the pool can no longer cover a goal's `chargedXp`, at which point `available < needed` for that goal and every later goal shows `available = 0` once the pool is fully spent. With Epic selected instead (2,500 XP/book), the same three goals show book counts scaled to Epic's smaller book value (e.g. priority 1 shows `available = floor(100,000 / 2,500) = 40`, `needed = ceil(12,200 / 2,500) = 5`) — the same `chargedXp`/`poolXp` raw-XP figures, only the display rounding changes.

#### Scenario: Pool comfortably covers a high-priority goal

- **WHEN** a Rank goal is highest priority and the owned-book pool's raw XP, converted to the selected rarity, exceeds what this goal needs
- **THEN** its detail shows an available count greater than its needed count, uncapped, and the goal is not blocked on books

#### Scenario: Pool exhausted before a lower-priority goal's turn

- **WHEN** higher-priority goals of other units have already consumed the entire shared owned-book pool by the time a later goal's turn in priority order arrives
- **THEN** that goal shows an available count of 0 against its own nonzero needed count

#### Scenario: Pool partially covers a goal

- **WHEN** the pool remaining at a goal's turn, converted to the selected rarity, is less than that goal's own needed count
- **THEN** the goal shows an available count below its needed count, reflecting the actual partial coverage rather than rounding up to full coverage

#### Scenario: Owned books already allocated elsewhere

- **WHEN** a goal earlier in the global order (in any project) requires a level and consumes all owned XP books in the account's shared pool
- **THEN** a later goal's available count reflects the remaining, depleted pool, not the original inventory again

#### Scenario: A near-target goal with no available books shows zero potential

- **WHEN** a goal's available count is 0 (the pool is exhausted before its turn), regardless of how close the character's current level already is to the required level
- **THEN** the Potential progress percentage reads 0%, not a high percentage derived from the character's absolute level position

### Requirement: Required-level book availability is visible wherever the goal is listed

The available/needed XP-book count (see "Required-level guidance preserves raw XP and adds an equivalent") SHALL render everywhere a Rank/Ability goal's level requirement already renders remaining-XP text — the Goals overview list and its mobile cards, project detail's goal list and its mobile cards, and the goal detail view — not only in goal detail as before. Every one of these surfaces SHALL use the same selected XP-book rarity and the same priority-ordered pool state, so the count for a given goal never disagrees between the list and its own detail view.

#### Scenario: Goals overview list shows the count

- **WHEN** a user viewing the Goals overview desktop table has a Rank or Ability goal below its required level
- **THEN** that goal's row shows the same available/needed book count its detail view would show

#### Scenario: Mobile cards show the count

- **WHEN** the same page is viewed below the mobile breakpoint
- **THEN** each goal's card shows the available/needed book count the same way the desktop row does

#### Scenario: Project detail list shows the count

- **WHEN** a user views a project's goal list containing a Rank or Ability goal below its required level
- **THEN** that goal's row shows the available/needed book count, consistent with the Goals overview and the goal's own detail view

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
