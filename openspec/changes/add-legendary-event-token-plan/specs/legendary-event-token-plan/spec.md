# legendary-event-token-plan Specification

## Purpose

Defines how the planner orders the tokens a Legendary Event still rewards (which team, lane and battle, and what each earns) from synced progress, the plan's teams and depths and its Maybe clear / Stop here marks; how many tokens a full clear of a battle takes; and how the Next token card and the token plan list show the result on the event page.

## ADDED Requirements

### Requirement: Token plan from synced progress, teams, depths and marks

The planner SHALL compute one ordered token plan per event, client side and never persisted, as follows.

- **Cells.** Each battle `b` of a lane has six cells: defeat-all (id 0) and the lane's five objectives (id `index + 1`), cleared or not from the synced progress exactly as the progress grid reads them, and a **high score** from the synced `highScore` (0 without an encounter). A lane with no synced record starts with nothing cleared.
- **Team reach.** A team reaches battle `b` (0-based) when its **depth** for the current run is greater than `b`. The depth is the team's stored depth for the current run (`currentLegendaryEventRun`) when one exists, else its Stage 5 clear estimate, else none; a team with no depth or depth 0 plans nothing. Only a team's non-reserve members and its stored covered objectives count; the reserve never does.
- **Availability.** Battle `b` of a lane is available when it is the lane's first battle or battle `b − 1` has defeat-all cleared, counting cells cleared earlier in the plan.
- **Token value.** A token of team `T` on an available, reachable battle `b` clears every cell of `b` that is not cleared, not marked Stop here, and is either defeat-all or an objective `T` covers. It is worth: `battlesPoints[b]` − the battle's high score (not below 0), only when the token clears defeat-all or defeat-all is already cleared; plus `defeatAll[b]` when it clears defeat-all; plus the catalog score of each objective it clears. A token that does not clear defeat-all and whose battle's defeat-all is not already cleared is worth 0 (objectives only count on a won battle). A battle whose defeat-all is marked Stop here is never played, so later battles of that lane stay unavailable unless sync already shows defeat-all cleared there.
- **Choice per lane.** The lane's best token is the highest-value token over its available, not-complete battles from the first battle not complete upwards and its teams in their lane order; on equal value the earlier battle wins, then the earlier team.
- **Choice across lanes.** The next token is the lanes' best token with the most points; on equal points, the one that continues the previous token's team on the next battle of the same lane; then the earlier lane (Alpha, Beta, Gamma).
- **Plan.** Apply the chosen token (its cells become cleared, the battle's high score becomes `battlesPoints[b]` when it clears defeat-all) and repeat until no token is worth more than 0. Each planned token records its lane, battle, team, cleared cell ids, points, running points (synced `currentPoints` + the plan's points so far), and is **flagged Maybe** when any cell it clears is marked Maybe clear.
- Only marks in effect count (`applicableAnnotations`: a mark on a cell sync shows cleared is ignored).

All figures are event points. The plan is anchored to the account's current synced progress and its teams' current depths, never to a goal target. It SHALL be recomputed whenever the synced progress, the roster, the plan (teams, depths, marks) or the clear estimates change.

Assumptions:

- A battle is won by clearing defeat-all; a won battle awards its full kill score (`battlesPoints[b]`), and bonus objectives only count on a won battle.
- The second `battlesPoints[b]` of the maximum model ("high score" beside "kill score") is not counted, matching earned points (its award is unverified, see `legendary-event-synced-progress`).
- A team that reaches battle `b` wins it in one token and satisfies every objective it covers there.
- Battles of a lane unlock in order: battle `b` can be played once battle `b − 1` has been won.
- Progress carries across the three runs, so one plan covers the rest of the event.

#### Scenario: Worked example on Uthar Alpha

- **GIVEN** `votanUthar` Alpha (`battlesPoints` 29, 31, 35, 39, 41, 43, 45…; `defeatAll` 30 each; objectives Ultramarines 75 (index 0), Resilient 95, Max 2 Hits 50, Melee 65 (index 3), Piercing 90), synced `currentPoints` 5,000, Alpha `encounters[0] = { objectivesCleared: [0, 1], highScore: 29 }` and `encounters[1] = { objectivesCleared: [0], highScore: 31 }`, no other encounters, no marks, no teams on Beta or Gamma
- **AND** two Alpha teams in this order: **Five** (`ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary`, `ultraEliminatorSgt`, covering Ultramarines, Stage 5 estimated depth 6, no stored depth) and **Melee** (`ultraCalgar`, `ultraTitus`, `ultraApothecary`, covering Ultramarines and Melee, stored depth 5 for the current run)
- **WHEN** the plan is computed
- **THEN** the first candidates are battle 1: Melee +65 (Melee only; the high score is already full); battle 2: Five +75, Melee +75 + 65 = 140; battle 3 (available because battle 2's defeat-all is cleared): Five 35 + 30 + 75 = 140, Melee 35 + 30 + 75 + 65 = 205; battle 4 is not available yet
- **AND** the plan is: 1) Melee → battle 3, +205, running 5,205; 2) Melee → battle 4, 39 + 30 + 140 = +209, running 5,414; 3) Melee → battle 5, 41 + 30 + 140 = +211, running 5,625; 4) Five → battle 6, 43 + 30 + 75 = +148, running 5,773 (Melee's depth 5 does not reach battle 6); 5) Melee → battle 2, +140, running 5,913; 6) Melee → battle 1, +65, running 5,978
- **AND** nothing else is worth a token (battle 7 is beyond both depths; Resilient, Max 2 Hits and Piercing are covered by no team), so the plan is 6 tokens and 978 points

#### Scenario: Maybe clear flags a token but keeps it

- **GIVEN** the worked example and a Maybe clear mark on battle 3's Melee cell
- **WHEN** the plan is computed
- **THEN** the plan is unchanged and token 1 (Melee → battle 3) is flagged Maybe

#### Scenario: Stop here on defeat-all stops the lane there

- **GIVEN** the worked example and a Stop here mark on battle 4's defeat-all cell
- **WHEN** the plan is computed
- **THEN** the plan is Melee → battle 3 +205, Melee → battle 2 +140, Melee → battle 1 +65 (410 points); battles 4 to 6 are not planned

#### Scenario: Stop here on an objective drops only that objective

- **GIVEN** a Stop here mark on battle 2's Melee cell
- **WHEN** the plan is computed
- **THEN** battle 2 is worth +75 to either team and no planned token clears its Melee cell

#### Scenario: Team without a depth plans nothing

- **GIVEN** a team whose current run has no stored depth and no estimate (for example the horde-mode tier read failed)
- **WHEN** the plan is computed
- **THEN** no token uses that team

#### Scenario: Same team continues on a tie

- **GIVEN** the previous planned token was team A on Beta battle 4, and the best Alpha token (team B, battle 2) and the best Beta token (team A, battle 5) are both worth 150
- **WHEN** the next token is chosen
- **THEN** it is team A on Beta battle 5

#### Scenario: Earlier lane wins a remaining tie

- **GIVEN** the best Alpha and Gamma tokens are both worth 150 and neither continues the previous token's team
- **WHEN** the next token is chosen
- **THEN** it is the Alpha token

#### Scenario: V1 parity

- **GIVEN** the cases of V1 `token-estimation-service.spec.ts` (`computeNextToken`, `computeAllTokenUsage`, current points) translated into V2 lanes, cells and teams in the test fixture
- **WHEN** the plan is computed
- **THEN** the token order, teams, battles and points equal V1's, except where a design deviation (design D3) is pinned by its own case

### Requirement: Fewest tokens to fully clear a battle per lane

For each lane the planner SHALL compute, from the lane's teams that have a depth of at least 1, the fewest teams whose covered objectives together include all of the lane's objectives (V1 `computeMinimumTokensToClearBattle`): that count is the tokens a full clear of a battle takes, for the battles every one of those teams reaches. When the teams' covered objectives together miss any lane objective, it SHALL report the objectives no team covers instead.

#### Scenario: Objectives no team covers

- **GIVEN** the worked Uthar Alpha teams (Ultramarines; Ultramarines and Melee)
- **WHEN** the figure is computed
- **THEN** it reports Resilient, Max 2 Hits and Piercing as not covered

#### Scenario: Overlapping teams

- **GIVEN** a lane with objectives 1–5 and teams covering {1, 2}, {2, 3}, {3, 4, 5} and {1, 4}
- **WHEN** the figure is computed
- **THEN** it is 2 ({1, 2} and {3, 4, 5})

#### Scenario: V1 parity

- **GIVEN** the four `computeMinimumTokensToClearBattle` cases of V1's spec
- **WHEN** the figure is computed
- **THEN** each equals V1's (not all covered, five single-objective teams give 5, overlapping coverage, unnecessary teams)

### Requirement: Next token card heads the Overview tab

The Overview tab SHALL open with a **Next token** card. With a non-empty plan it SHALL show the next token: the first planned token that is not flagged Maybe and whose battle is playable now (its lane's first battle, or synced progress shows the previous battle's defeat-all cleared), or the first planned token when none qualifies. It SHALL show the team name and members' portraits, the lane, "Battle N", "+P points", the icon and name of each objective it clears (defeat-all included), and one reason line: "Most points available now" when it is the plan's highest-value token, otherwise "Most points among battles you can play now"; with " · same team, next battle" appended when it continues the previous planned token's team. When the event is upcoming it SHALL add "for when run N starts". It SHALL carry two actions: **Partly cleared**, which marks the token's objective cells Maybe clear (its defeat-all cell too when it clears no objective), and **Couldn't clear**, which marks every cell it clears Stop here; each is one annotation write for the token's battle through the existing marks contract, and the card and plan recompute at once.

When there is no next token the card SHALL name what is missing, checked in this order:

- the progress read is loading → a skeleton; the progress read failed → "Synced progress is unavailable, so there is no token plan";
- every battle of every lane is complete → "Every battle is cleared";
- the event has no team → "Add a team on <lane> to get a plan", naming the first lane (Alpha, Beta, Gamma) with points left, linking to that lane's Teams section;
- no team has a depth → "Set how far <team> clears", naming the first team without one, linking to its card;
- otherwise (the teams have nothing left they can clear) → "Your teams have nothing left to clear · N points left in <lane>" for the lane with the most points left, linking to that lane's Teams section.

The card SHALL NOT render on an archived event. While the roster, plan or clear estimates load it SHALL show its skeleton; a failed plan read SHALL show the plan's existing failure note.

#### Scenario: Card on the worked example

- **WHEN** the Overview tab renders the worked Uthar Alpha example
- **THEN** the card shows team Melee with its three portraits, "Alpha · Battle 3", "+205 points", defeat-all, Ultramarines and Melee, and "Most points available now"

#### Scenario: Flagged and unplayable tokens are skipped

- **GIVEN** the worked example with battle 3's Melee cell marked Maybe clear
- **WHEN** the card renders
- **THEN** it shows Melee → Alpha battle 2, +140, "Most points among battles you can play now", because token 1 is flagged and tokens 2 to 4 need battle 3 won first

#### Scenario: Couldn't clear

- **GIVEN** the card shows Melee → Alpha battle 3
- **WHEN** the user presses Couldn't clear
- **THEN** one write sends `laneId` `alpha`, `battleIndex` 2, `objectiveIds` `[0, 1, 4]`, `status` `stopHere`, and the card at once shows Melee → Alpha battle 2, +140

#### Scenario: No teams

- **GIVEN** the event has no teams and Alpha has points left
- **WHEN** the card renders
- **THEN** it reads "Add a team on Alpha to get a plan" and links to Alpha's Teams section

#### Scenario: Teams without depth

- **GIVEN** the only team is Melee on Alpha with no stored depth and no estimate
- **WHEN** the card renders
- **THEN** it reads "Set how far Melee clears" and links to Melee's card on Alpha

#### Scenario: Nothing left for the teams

- **GIVEN** the worked example after all six planned tokens were played and synced, and Gamma has 9,124 points left
- **WHEN** the card renders
- **THEN** it reads "Your teams have nothing left to clear · 9,124 points left in Gamma" and links to Gamma's Teams section

#### Scenario: Archived event

- **WHEN** an archived event's Overview renders
- **THEN** there is no Next token card, token plan or run forecast

### Requirement: Token plan list

Below the Run status card the Overview tab SHALL show a collapsible **Token plan**, collapsed by default and remembered per device, headed "N tokens · +P points". Expanded, it SHALL list the planned tokens in order, consecutive tokens of the same team grouped under the team name; each row shows its number, lane, battle, the icons of the objectives it clears, "+points" and running points, the Maybe flag when flagged, and a marker when the running points cross a points milestone ("Milestone M · +E currency") or when the run forecast reaches an ascension step at that token. Under the list one line per lane with teams SHALL show the fewest tokens per battle ("Alpha: a full clear takes 2 tokens a battle") or the objectives no team covers ("Alpha: no team covers Resilient, Max 2 Hits, Piercing"). With an empty plan the section SHALL be hidden; the Next token card carries the reason.

#### Scenario: Milestone marker

- **WHEN** the token plan for the worked example is expanded
- **THEN** token 3 (running 5,625) carries "Milestone 13 · +85 currency" and no other row carries a marker

#### Scenario: Grouping

- **WHEN** the worked example's plan is expanded
- **THEN** it shows the groups Melee (tokens 1–3), Five (token 4), Melee (tokens 5–6)

#### Scenario: Desktop layout

- **WHEN** the plan is expanded at or above 768px
- **THEN** each token is one row with number, lane, battle, objective icons, +points and running points in aligned columns

#### Scenario: Mobile layout

- **WHEN** the plan is expanded below 768px
- **THEN** each token is a two-line row (lane and battle with +points; objective icons with running points) that fits the viewport width without horizontal scroll
