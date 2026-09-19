## MODIFIED Requirements

### Requirement: Actual Progress and Potential Progress captions carry a visible explanation

Wherever the goal progress display renders an Actual Progress ratio together with a Potential Progress ratio, an explanation of what each one measures SHALL be reachable without requiring a hover or other hidden-until-pointer interaction, but SHALL NOT be required to render unconditionally inline. On a viewport at or above the mobile breakpoint (see `goal-list-layout`), the explanation SHALL be exposed through an explicit "i" (info) trigger that opens a popover; below that breakpoint, tapping the goal's remaining-text line SHALL expand the explanation inline within the same card, with no separate popover. The Actual Progress line SHALL state that it reflects the player's currently synced/owned state, and note the underlying remaining-count figure (e.g. "9 upgrade slots remaining" for a Rank goal, "6 levels remaining" for a Level goal). The Potential Progress line SHALL state that it reflects applying already-owned resources after this project's higher-priority goals reserve their share, that it does not change the goal's actual status, and note the underlying remaining-count figure (e.g. "1,674 energy remaining" for a Rank goal, "1,304,192 XP remaining" for a Level goal).

Assumptions:

- Rank, Ability, Ascension, and Level goals each compute both an Actual and a Potential ratio at once, given a project context (`computePotentialProgressRatio` for Rank/Ability progress-slot allocation and Ascension orb allocation; the XP-book allocation in `goal-progress-display`'s own "Level goal Potential progress reflects owned XP books" requirement below for Level) — this requirement applies wherever both ratios are present, so it extends automatically if a future goal kind also computes both.

#### Scenario: Both bars render in the compact goals list

- **GIVEN** a goal row in the goals list has both an Actual Progress ratio and a Potential Progress ratio to show, on a viewport at or above the mobile breakpoint
- **WHEN** the row renders
- **THEN** the row shows the stacked bar, the percent readout, and an "i" button, with neither explanation visible until the button is activated — reachable, not hover-only, but no longer unconditionally inline

#### Scenario: Both bars render on a project detail card

- **GIVEN** the same goal is shown on a project's detail page instead of the goals list, on a viewport at or above the mobile breakpoint
- **WHEN** the card renders
- **THEN** it shows the same "i"-triggered popover disclosure as the goals list, not a separate always-inline copy

#### Scenario: Both bars render in the goal-detail sheet

- **GIVEN** the same goal is opened in its detail sheet
- **WHEN** the sheet renders
- **THEN** the same disclosure behavior (popover at or above the mobile breakpoint, inline expand below it) applies, and the two explanation lines appear at most once each, never duplicated by a second, separate copy

#### Scenario: Desktop — activating the info trigger reveals both lines

- **GIVEN** a row or card from the two scenarios above, with its popover closed
- **WHEN** the user activates the "i" button
- **THEN** a popover opens showing the Actual line and the Potential line, each with its explanation text and remaining-count figure, and closes on a subsequent activation of the same button, an outside click, or Escape

#### Scenario: Mobile — both ratios present, explanation collapsed by default

- **GIVEN** the same goal renders as a card below the mobile breakpoint
- **WHEN** the card renders
- **THEN** the footer line shows the remaining-text figure and an info affordance, with the explanation collapsed

#### Scenario: Mobile — tapping the footer line expands the explanation inline

- **GIVEN** the card from the previous scenario
- **WHEN** the user taps the footer line
- **THEN** the same two explanation lines expand inline within the card body (not a floating popover), and collapse on a subsequent tap

#### Scenario: Only Actual Progress applies

- **GIVEN** a goal has no Potential Progress ratio to show (for example, no active project context supplies one)
- **WHEN** its progress renders
- **THEN** only the Actual Progress fill and percent render, with no info trigger, popover, or expand affordance — unchanged from today's single-ratio behavior

#### Scenario: A Level goal's explanation carries its own remaining-levels and remaining-XP figures

- **GIVEN** a Level goal row has both an Actual Progress ratio and a Potential Progress ratio to show
- **WHEN** the user activates the "i" button
- **THEN** the Actual line notes the remaining-levels figure (e.g. "6 levels remaining") and the Potential line notes the remaining-XP figure (e.g. "1,304,192 XP remaining")

### Requirement: Remaining resource text uses a per-goal-kind formatter with thousands separators

Wherever the goal progress display shows a still-needed resource count for a goal, it SHALL use one formatter per goal kind rather than a generic material/shard/orb breakdown: a Level goal SHALL show "{{count}} levels" (remaining levels to the target) or, when the raw XP still needed to close that gap is nonzero, "{{count}} levels · {{xp}} XP"; a Rank goal SHALL show "{{slots}} slots · {{energy}} energy" (remaining upgrade slots and, when a farming energy estimate is available, the remaining energy); an Unlock goal SHALL show "{{shards}} shards" (remaining shard need, per `goal-farming-estimates`' zero-once-owned rule). Every number formatted by this requirement SHALL render with the locale's thousands separator.

Assumptions:

- This requirement only changes how an already-computed remaining count is formatted for display; it does not change any calculation in `goal-farming-estimates` or `computeGoalProgress`.
- A Rank goal with no farming energy estimate available (for example, no project context) SHALL show only the slots figure ("{{slots}} slots"), omitting the "· {{energy}} energy" segment rather than showing a placeholder.
- A Level goal's XP figure is the gap between the target level's own total-XP threshold and the character's true total XP already gained (the real Tacticus API's own `xp` field — "total XP gained for character", not a per-level-reset partial amount) — it is NOT netted against owned XP books (mirrors the Rank goal's slots figure, which is also the raw material need, not a potential-adjusted one). It is omitted (not shown as "0 XP") whenever the character's total XP already gained meets or exceeds that threshold.

#### Scenario: Rank goal with both slots and energy available

- **GIVEN** a Rank goal has 9 upgrade slots remaining and a farming estimate of 1,674 remaining energy
- **WHEN** its remaining text renders
- **THEN** it reads "9 slots · 1,674 energy"

#### Scenario: Unlock goal

- **GIVEN** an Unlock goal has 227 shards remaining
- **WHEN** its remaining text renders
- **THEN** it reads "227 shards"

#### Scenario: Level goal

- **GIVEN** a Level goal's target is 6 levels above the player's current level, and the raw xp gap to close it is 1,304,192
- **WHEN** its remaining text renders
- **THEN** it reads "6 levels · 1,304,192 XP"

#### Scenario: Level goal whose target is already covered by total xp already gained

- **GIVEN** a Level goal's target is 2 levels above the player's current level, and the player's total xp already gained meets or exceeds that target level's own threshold
- **WHEN** its remaining text renders
- **THEN** it reads "2 levels", with no XP segment

## ADDED Requirements

### Requirement: Level goal Potential progress reflects owned XP books, shared by priority

A Level goal's Potential Progress ratio SHALL reflect the highest level reachable by spending the account's owned XP books against the goal's own XP need, given a project context. Where a project has more than one Level goal, the account's XP-book inventory SHALL be treated as one shared pool: a higher-priority Level goal's allocation SHALL be computed first, and the books it spends SHALL be removed from the pool before a lower-priority Level goal's allocation is computed, so two Level goals in the same project never count the same books twice. Applying a book is all-or-nothing (an indivisible unit, not a fractional XP amount) — a book spent covering one goal's need contributes nothing to a different goal's allocation, even if that book's XP value exceeds what the first goal strictly needed.

Assumptions:

- Worked example: a project has two Level goals for different characters, "high" (priority 1) and "low" (priority 2), each needing 22,000 XP to reach its own next level. The account owns exactly 2 Legendary-rarity XP books (12,500 XP each — 25,000 XP combined). "high"'s allocation is computed first: it fully covers its 22,000 XP need (2 books spent, since one alone falls short and books aren't divisible), reaching its target level. With the pool now empty, "low"'s allocation finds no books left and its Potential ratio equals its Actual ratio (unchanged from its current level) — not the ratio it would have shown had the books not already been spent by "high".
- No project context (the flat, cross-project Goals list) supplies no Potential ratio for any goal kind, Level included — unchanged from today (see the "Only Actual Progress applies" scenario above).

#### Scenario: Owned books fully cover a Level goal's own xp need

- **GIVEN** a Level goal needs 22,000 xp to reach its target level, and the account owns enough xp books (unclaimed by any higher-priority Level goal in the same project) to cover at least that much
- **WHEN** its Potential Progress ratio is computed
- **THEN** the ratio reflects the goal's target level being fully reachable

#### Scenario: Owned books partially cover a Level goal's own xp need

- **GIVEN** a Level goal's own remaining xp need exceeds what's left in the shared book pool after higher-priority Level goals in the same project have taken their share
- **WHEN** its Potential Progress ratio is computed
- **THEN** the ratio reflects the highest level the leftover, allocated xp value actually reaches — never the goal's full target, and never negative progress

#### Scenario: A higher-priority Level goal claims the shared pool first

- **GIVEN** two Level goals in the same project each need the same amount of xp, and the account's owned books are enough to fully cover only one of them
- **WHEN** their Potential Progress ratios are computed
- **THEN** the higher-priority goal's ratio reflects its target level being fully reachable, and the lower-priority goal's ratio reflects no books being left for it

#### Scenario: No books owned

- **GIVEN** a Level goal needs xp to reach its target level, and the account owns no xp books at all
- **WHEN** its Potential Progress ratio is computed
- **THEN** the ratio equals the Actual Progress ratio (no additional reach from Potential)
