## MODIFIED Requirements

### Requirement: Required-level book availability is visible wherever the goal is listed

The available/needed XP-book count (see "Required-level guidance preserves raw XP and adds an equivalent") SHALL render everywhere a Rank/Ability goal's level requirement already renders remaining-XP text — the Goals overview list and its mobile cards, and project detail's goal list and its mobile cards — and the create-goal preview; there is no goal detail view. Every one of these surfaces SHALL use the same selected XP-book rarity and the same priority-ordered pool state, so the count for a given goal never disagrees between the Goals list, the project list, and the create-goal preview.

#### Scenario: Goals overview list shows the count

- **WHEN** a user viewing the Goals overview desktop table has a Rank or Ability goal below its required level
- **THEN** that goal's row shows the available/needed book count computed with the selected XP-book rarity

#### Scenario: Mobile cards show the count

- **WHEN** the same page is viewed below the mobile breakpoint
- **THEN** each goal's card shows the available/needed book count the same way the desktop row does

#### Scenario: Project detail list shows the count

- **WHEN** a user views a project's goal list containing a Rank or Ability goal below its required level
- **THEN** that goal's row shows the available/needed book count, consistent with the Goals overview

### Requirement: The create-goal required-level preview follows the selected rarity

The required-level cost preview on a Rank or Ability goal's creation card (`computeLevelGoalCost`) SHALL express the owned-book remainder in the user's selected XP-book rarity, so it never disagrees with goal and project guidance. The book count SHALL be `ceil(net XP gap / selected book XP)` after netting owned books, and the gold to apply SHALL be that count multiplied by the fixed per-book apply cost (500 gold, independent of rarity). A missing or unsupported stored rarity SHALL behave as Legendary, which keeps today's Legendary-only figures for users who never change the setting. The raw remaining-XP figure is unchanged.

#### Scenario: Default rarity keeps today's preview

- **GIVEN** a user who has never chosen a rarity and a character needing 12,200 XP with no owned books
- **WHEN** the creation card previews the required level
- **THEN** it shows 1 book and 500 gold, as before

#### Scenario: A lower rarity changes book count and gold together

- **GIVEN** the user selected Epic (2,500 XP per book) and the same 12,200 XP gap with no owned books
- **WHEN** the creation card previews the required level
- **THEN** it shows 5 books and 2,500 gold, and, once the goal is created, the Goals list and project list show the same 5 Epic-book equivalent

## REMOVED Requirements

### Requirement: Goal detail exposes resource and source guidance

**Reason**: The read-only goal detail that hosted the per-goal resource breakdown, farming locations and Dailies link is removed to keep goal editing minimal.
**Migration**: Remaining resources show as chips in the Goals list's Remaining column (`goal-remaining-resources`); farming locations and next actions live in Dailies and a project's scoped guidance (the "Project detail provides scoped guidance" requirement, unchanged).
