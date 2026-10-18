## ADDED Requirements

### Requirement: Event teams are suggested for every scoring token mode

For a running or upcoming instance whose resolved variant is `Personal` and has a tracker scoring in Arena, Onslaught or Salvage Run, Dailies > HSE SHALL show a teams section with one Arena team when the event scores in Arena, three Onslaught teams (Imperial, Chaos, Xenos) when it scores in Onslaught, and three Salvage Run teams (Imperial, Chaos, Xenos) when it scores in Salvage Run. Onslaught and Salvage Run teams SHALL contain only characters of their alliance. The section SHALL NOT be shown for past instances, Global variants, instances without `config.hse`, or events that score in none of the three modes. A mode whose synced token bucket is null SHALL still get its teams.

#### Scenario: Psyker Boost gets seven teams

- **GIVEN** Psyker Boost (scores in Arena, Onslaught, Salvage Run) is upcoming
- **THEN** the section shows one Arena team, three Onslaught teams and three Salvage Run teams

#### Scenario: Single-mode event

- **GIVEN** 11th Edition Week 2 (scores in Onslaught only)
- **THEN** the section shows only the three Onslaught teams

#### Scenario: Past event

- **GIVEN** a past Flying Boost is selected
- **THEN** no teams section is shown

### Requirement: Event units lead each team, chosen in Power mode

Each team SHALL be the shared engine's Plan team in Power mode with a team size of 5, with no XP / Power control, no Random team, no team size control and no preference filters. Its highest-priority pool SHALL be the mode's event units (design D2): the owned characters passing a scoring tracker's player filter (traits or alliance, faction), with characters passing more trackers ranked first; then the engine's full mode-eligible roster. A player filter that only disallows `MachineOfWar` counts as no filter. When no scoring tracker has a player filter, the team SHALL be the strongest five of the mode-eligible roster and say any unit scores. When a mode mixes a scoring tracker without a narrowing player filter with narrower ones, every unit scores: the filtered characters SHALL only rank first, the team SHALL NOT be marked broadened, and the other members SHALL show the `event-unit` rationale without a named match. For line-up trackers (Faction Focus), whatever their filter, the pool SHALL be one faction of the mode-eligible roster: factions with at least five owned characters there rank first, then by the summed combat power of their five strongest (ties by faction id). Members SHALL show the rationale `event-unit` (naming the trait or faction) or `strength`. A team that had to use non-event units SHALL be marked broadened; a broadened Faction Focus team SHALL say that line-up points need a full team of one faction and fewer than five of that faction are owned.

#### Scenario: Imperial Onslaught team for Psyker Boost

- **GIVEN** the player owns the Imperial Psykers Sibyll, Tigurius, Njal and Mephiston and other Imperial characters
- **THEN** the Imperial Onslaught team holds those four Psykers, ordered by combat power, and the strongest other Imperial character, and is marked broadened

#### Scenario: Chaos team fully from event units

- **GIVEN** the player owns the Chaos Psykers Archimatos, Abraxas, Thaumachus, Ahriman and Typhus
- **THEN** the Chaos Onslaught and Salvage Run teams are those five, ordered by combat power, and not broadened

#### Scenario: Faction Boost ranks double matches first

- **GIVEN** Faction Boost for Dark Angels, whose Arena trackers count kills by Imperial units and by Dark Angels units
- **THEN** the Arena team ranks owned Dark Angels first, then other Imperial characters, by combat power

#### Scenario: No player filter

- **GIVEN** Defeat Waves (no player filter)
- **THEN** each team is the strongest five of its roster and says any unit scores

#### Scenario: Mixed any-unit and narrower trackers

- **GIVEN** 11th Edition Week 3 (Personal), whose Arena trackers give 3 points per kill by any unit and 1 per kill by a Blood Angels or Orks unit
- **THEN** the Arena team leads with the owned Blood Angels and Orks, is filled with the strongest others, is not marked broadened, and the others show "Scores for the event"

#### Scenario: Faction Focus picks one faction per team

- **GIVEN** in the Xenos track the player owns at least five Necrons, and their five strongest sum to more combat power than any other Xenos faction with five owned characters
- **THEN** the Xenos teams are those Necrons and the rationale names Necrons

#### Scenario: Faction Focus prefers a full line-up

- **GIVEN** in Arena the player owns three strong Thousand Sons and five weaker Necrons
- **THEN** the Arena team is the five Necrons, not broadened, because the Thousand Sons cannot field a full line-up

#### Scenario: Faction Focus without five of any faction

- **GIVEN** no faction in the team's roster has five owned characters
- **THEN** the faction with the strongest summed characters leads, the strongest others fill the team, and the broadened line says a full team of one faction is needed and fewer than five of that faction are owned

#### Scenario: Too few characters in an alliance

- **GIVEN** the player owns two Xenos characters
- **THEN** the Xenos teams show the existing insufficient-roster message instead of a team

### Requirement: Enemy-side rules are stated

When a scoring tracker in a mode has an enemy filter (traits or alliance, faction, unit id), the mode's teams SHALL show a one-line hint naming which enemies count (For the Emperor: only non-Imperial enemies; Squig Smash: only Squigs), localized in en, de, es and fr. Summons and Steppables excluded alone SHALL NOT produce a hint.

#### Scenario: For the Emperor

- **GIVEN** For the Emperor (kills of non-Imperial enemies by Imperial units count)
- **THEN** the teams lead with Imperial units and show that only non-Imperial enemies count

### Requirement: Event teams layout

On desktop (at or above 768px) the section SHALL show the Arena team, then a row of three Onslaught alliance teams and a row of three Salvage Run alliance teams. On mobile (below 768px) it SHALL show a segmented control for Arena, Onslaught and Salvage Run (only modes the event scores in), defaulting to the first, with the chosen mode's teams stacked below it; the choice SHALL NOT persist across navigation. The section SHALL sit below the points projection and above any raid lists, and the HSE tour SHALL include a step for it on both forms.

#### Scenario: On desktop

- **WHEN** the viewport is at or above 768px and Psyker Boost is selected
- **THEN** one Arena card and two rows of three alliance cards are shown

#### Scenario: On mobile

- **WHEN** the viewport is below 768px and Psyker Boost is selected
- **THEN** Arena is selected in the segmented control and choosing Onslaught shows the three Onslaught teams stacked

#### Scenario: Loading and failure

- **WHEN** the roster is loading or fails to load
- **THEN** the section shows the shared team loading or error state and the rest of the page is unaffected
