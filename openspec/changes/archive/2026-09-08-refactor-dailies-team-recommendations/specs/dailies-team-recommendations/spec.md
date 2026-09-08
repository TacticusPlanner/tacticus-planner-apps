## Purpose

Defines the game-mode-agnostic team recommendation engine shared by the Dailies
team-building pages (Arena now; Salvage Run and Onslaught next). It fixes the
Plan-team ordering and pool-widening rules, the Random-team draw and Regenerate
behaviour, the soft preference filters, and the shared team presentation, so each
page is a thin configuration over one engine rather than its own copy.

## ADDED Requirements

### Requirement: Configurable engine inputs

The engine SHALL build recommendations from a per-page configuration, without any
knowledge of which game mode invoked it. The configuration SHALL consist of:

- a **generation mode**, `xp` or `power`;
- a **requested team size** (a positive integer);
- a **mode-eligible roster** — the owned characters the page allows for this run,
  already narrowed by any page-specific restriction (for example a single
  alliance). The engine SHALL NOT re-add a character the caller excluded.
- an ordered list of **priority pools**, highest priority first. Each pool is a
  set of unit ids drawn from the roster, plus a rationale describing why a
  character in that pool was chosen. The engine SHALL append the full
  mode-eligible roster as an implicit lowest-priority pool.
- a set of **preference filters** (see "Preference filters narrow eligibility");
- a **lock set** of unit ids for the Random team;
- a **random seed** integer that increments once per Regenerate.

The engine SHALL return, for that configuration, a **Plan team** and a **Random
team**, each reporting the requested size, the delivered size, the widest pool it
drew on, whether it was broadened beyond its primary pool, and whether XP-capped
characters were included to reach the minimum.

#### Scenario: The same engine serves different pool configurations

- **WHEN** two pages invoke the engine with the same roster, mode, size, and
  seed but different priority-pool lists
- **THEN** each page's Plan team reflects its own pool ordering, and the Random
  team — which does not use the priority pools — is identical for both

#### Scenario: The caller's roster restriction is authoritative

- **WHEN** the mode-eligible roster passed in excludes a character that would
  otherwise match a priority pool
- **THEN** that character never appears in the Plan team or the Random team

### Requirement: Minimum team size and pool widening

Every recommended team SHALL contain at least three characters whenever the
mode-eligible roster holds at least three. For the Plan team the engine SHALL
start from the highest-priority pool and, only while the current candidate set
holds fewer than three **eligible** characters, widen it one pool at a time down
the configured priority order, ending with the full mode-eligible roster. Once
the candidate set holds at least three eligible characters, the team SHALL be
generated from it per the mode and the requested size. When the delivered team
drew on a pool below its primary pool, the team SHALL be marked as broadened.

Assumptions:

- "Eligible" depends on the mode (XP-eligible in XP mode; every owned character
  in Power mode) and on the active preference filters (see "Preference filters
  narrow eligibility").
- Pool widening is governed by the three-character minimum, not by the requested
  size; a requested size the widest pool still cannot fill with eligible
  characters yields a smaller delivered team.
- The Random team draws from the full mode-eligible roster and is never
  broadened.

#### Scenario: Thin primary pool is widened

- **WHEN** the highest-priority pool holds only two eligible characters
- **THEN** the candidate set expands down the priority order until at least three
  eligible characters are available, and the Plan team is marked broadened

#### Scenario: Roster smaller than the minimum

- **WHEN** the mode-eligible roster holds fewer than three characters
- **THEN** the engine reports this to the caller rather than padding the team
  from outside the roster

### Requirement: XP mode ordering

In `xp` mode the engine SHALL treat a character as **XP-eligible** when its
synced level is below the level cap for its current progression tier's rarity,
and SHALL rank candidates by, in order: XP-eligible before XP-capped; then higher
priority-pool rank before lower; then higher combat-power estimate; then unit id
for a stable tie-break. An XP-capped character SHALL be included only when fewer
than three XP-eligible characters exist in the widened pool, and then only up to
the three-character minimum — never to pad beyond three. A requested size above
three SHALL NOT pull in an XP-capped character.

Assumptions:

- Level caps by current progression-tier rarity: Common 8, Uncommon 17, Rare 26,
  Epic 35, Legendary 50, Mythic 60.
- Combat power is the shared `character-combat-power` estimate.

#### Scenario: XP-capped contributor is deprioritized

- **WHEN** the widened pool has four XP-eligible characters and one XP-capped
  contributor, and the requested size is three
- **THEN** the team is the three highest-ranked XP-eligible characters and the
  XP-capped contributor is not selected

#### Scenario: Capped fillers reach the minimum only

- **WHEN** the widened pool has only two XP-eligible characters and the requested
  size is five
- **THEN** the delivered team has three characters — the two eligible plus one
  capped filler — and is marked as having included capped characters

### Requirement: Power mode ordering

In `power` mode the engine SHALL ignore XP eligibility and rank the widened
candidate pool by combat-power estimate descending, unit id breaking ties, and
SHALL deliver the requested size or fewer only when the pool holds fewer owned
characters than requested.

#### Scenario: Strongest characters are chosen

- **WHEN** `power` mode, requested size five, and the widened pool has six owned
  characters with distinct combat-power estimates
- **THEN** the team is the five highest-power characters in descending
  combat-power order

### Requirement: Preference filters narrow eligibility

The configuration MAY carry zero or more **preference filters**, each a
predicate over a character (for example "has trait X", "deals damage type Y").
An active preference filter SHALL be applied as an extra condition on candidate
**eligibility**, composed with the mode's own eligibility rule using logical
AND. Because eligibility drives pool widening, a preference that too few
characters in the primary pool satisfy SHALL cause the pool to widen (and the
team to be marked broadened) rather than the team to shrink or a category to
fail. A preference filter SHALL never, on its own, cause a category to produce
no team when the mode-eligible roster holds at least three characters: if the
fully widened pool still holds fewer than three characters satisfying every
active preference, the engine SHALL fall back to ignoring the preferences for
the slots that cannot otherwise be filled. Preference filters SHALL apply to
every category, including the Random team, whose draw pool is narrowed to
matching characters and falls back to the unnarrowed mode pool when fewer
matches than the requested size exist.

#### Scenario: A satisfiable preference restricts the team

- **WHEN** a "has trait X" preference is active and the roster holds at least
  the requested size of characters with trait X
- **THEN** every character in the Plan team and the Random team has trait X

#### Scenario: An under-supplied preference widens the pool

- **WHEN** a "has trait X" preference is active, the primary pool holds only one
  character with trait X, but the full roster holds four
- **THEN** the Plan team is filled with trait-X characters drawn from the
  widened pool and the team is marked broadened

#### Scenario: An unsatisfiable preference never empties a category

- **WHEN** a preference is active that no owned character satisfies
- **THEN** both categories still deliver a team of the usual size, drawn as if
  the preference were not set

### Requirement: Random team draw and Regenerate

The Random team SHALL be drawn at random from the mode-eligible roster (narrowed
by any active preference filters), at the requested size or fewer when the pool
is smaller. In `xp` mode the draw pool is the XP-eligible characters, topped up
with XP-capped characters only when fewer than the requested size are eligible.
In `power` mode the draw pool is the whole mode-eligible roster and the draw is
weighted by combat-power estimate so stronger characters are more likely without
any being guaranteed or excluded. The draw SHALL be deterministic for a given
roster, mode, preference set, lock set, and seed. A **Regenerate** SHALL
increment the seed and produce a team that differs from the currently shown one
whenever the unlocked slots can differ; it SHALL affect only the Random team.

#### Scenario: Regenerate changes the unlocked slots

- **WHEN** the player has at least six eligible characters, no locked slots, and
  regenerates
- **THEN** the new Random team differs from the previous one and the Plan team
  is unchanged

#### Scenario: Power-mode draw favours strength

- **WHEN** `power` mode and the player regenerates many times
- **THEN** higher-combat-power characters appear more often than lower-power
  ones, with none guaranteed or excluded

### Requirement: Random team character locks

Each Random team slot SHALL have a lock. A locked character SHALL be kept across
every subsequent Regenerate until unlocked, with only the unlocked slots
re-drawn, and SHALL be retained even when a mode or preference change would
otherwise drop it from the draw pool. Regenerate SHALL be disabled when every
slot is locked. Locks apply only to the Random team and SHALL NOT be persisted.

#### Scenario: Locked character survives Regenerate

- **WHEN** the player locks a character and regenerates
- **THEN** that character stays in the Random team and the unlocked slots are
  re-drawn

#### Scenario: Locked character kept against a filter change

- **WHEN** the player locks a character, then changes the mode or a preference
  so a fresh draw would exclude it
- **THEN** the locked character remains in the Random team

### Requirement: Shared team presentation

Each recommended team SHALL identify every character by in-game name and
portrait resolved through the shared catalog and translations, SHALL show each
character's current rarity and rank, and SHALL present members as a single
vertical list (one character per row). The rarity icon, the rank icon, and the
Random team's lock toggle SHALL each expose their meaning as a hover/focus
tooltip. For each character the team SHALL convey why it was chosen — the
rationale supplied by the winning priority pool, or that it was chosen for
combat strength, added to meet the minimum size, or drawn at random.

#### Scenario: Rationale and progression are shown per row

- **WHEN** a character is chosen because it belongs to a priority pool
- **THEN** its row shows that pool's rationale plus the character's rarity and
  rank

#### Scenario: Single column at every viewport

- **WHEN** a team of four or five characters is shown at any viewport
- **THEN** the characters are listed one per row in a single column
