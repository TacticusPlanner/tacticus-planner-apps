## MODIFIED Requirements

### Requirement: Required-level guidance preserves raw XP and adds an equivalent

For a Rank or Ability goal whose character is below the level it requires, the existing raw remaining-XP figure SHALL remain visible. Where the XP-book inventory allows allocation, guidance SHALL additionally show, in the user's selected XP-book rarity, an available/needed book-equivalent count: the shared owned-book pool's book-equivalent size at this goal's position in global priority order (before this goal's own consumption) over the book-equivalent count this goal itself needs to reach its required level, after subtracting levels already covered by a higher-priority goal of the same unit. It SHALL label both counts with the selected rarity as an equivalent, not as owned actual books of that rarity or a guaranteed shop/farm source. It SHALL not double-count books reserved for higher-priority goals or levels already covered by a higher-priority goal of the same unit.

Both counts SHALL derive from the same raw-XP priority-ordered allocation used by planning (the same one that produces the existing Potential progress bar/percentage), rounding only for display: the available count rounds down (a partial book isn't obtainable from the pool), the needed count rounds up (a partial book still costs a whole one to apply). The available count is not capped to the needed count — a goal whose pool comfortably exceeds its own need shows that surplus rather than being clamped to 100%. The existing Potential progress percentage is unchanged by this requirement and continues to reflect level-reachability, not this book-count ratio; changing the selected rarity SHALL change the displayed book counts and SHALL NOT change that percentage.

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

### Requirement: Planning settings choose the XP-book equivalent rarity

The Planning settings dialog SHALL include an XP-book rarity setting offering Common, Uncommon, Rare, Epic, Legendary, and Mythic, defaulting to Legendary. The choice SHALL persist with the user's planning settings. A missing or unsupported stored value SHALL behave as Legendary.

#### Scenario: Default rarity

- **WHEN** a user who has never chosen a rarity opens Planning settings
- **THEN** Legendary is selected and required-level guidance's available/needed book counts use Legendary books

#### Scenario: Changing rarity

- **WHEN** the user saves Epic as the XP-book rarity
- **THEN** required-level guidance's available and needed counts both recompute in Epic books, and raw XP and the Potential progress percentage are unchanged

## ADDED Requirements

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
