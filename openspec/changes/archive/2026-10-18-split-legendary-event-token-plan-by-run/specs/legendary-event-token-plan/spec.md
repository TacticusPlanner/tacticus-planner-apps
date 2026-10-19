# Spec Delta

## MODIFIED Requirements

### Requirement: Token plan list

Below the Run status card the Overview tab SHALL show a collapsible **Token plan**, collapsed by default and remembered per device, headed "N tokens · +P points". Expanded, it SHALL list the planned tokens in **run sections**: the plan's tokens are spent in order across the runs that are not Done, each run taking up to its supply, exactly as the run forecast spends them (`legendary-event-run-forecast`). Each section SHALL be headed "Run R · <state> · U of A tokens · +P points · ends at E" (state Now, Next or Planned; U the tokens it uses, A its supply, P their points, E the running points after its last token), or, when it uses none, "Run R · <state>" with "No tokens planned · A tokens available". Tokens that no run's supply covers SHALL follow in a final **Not enough tokens** section headed "N tokens beyond run R's supply" (R the last run). When the run is unknown there SHALL be one section for the Next run. Done runs SHALL have no section.

Within a section, consecutive tokens of the same team SHALL be grouped under the team name; each row shows its number (counted across the whole plan), lane, battle, the icons of the objectives it clears, "+points" and running points, the Maybe flag when flagged, and a marker when the running points cross a points milestone ("Milestone M · +E currency") or when the run forecast reaches an ascension step at that token. Under the list one line per lane with teams SHALL show the fewest tokens per battle ("Alpha: a full clear takes 2 tokens a battle") or the objectives no team covers ("Alpha: no team covers Resilient, Max 2 Hits, Piercing"). With an empty plan the section SHALL be hidden; the Next token card carries the reason.

#### Scenario: Sections on the worked example

- **GIVEN** the worked token plan (6 tokens, 1,136 points from 5,000) and the worked supply (run 1 Done, run 2 Now with 32, run 3 Planned with 68)
- **WHEN** the token plan is expanded
- **THEN** it shows "Run 2 · Now · 6 of 32 tokens · +1,136 points · ends at 6,136" with tokens 1–6, then "Run 3 · Planned" with "No tokens planned · 68 tokens available", and no section for run 1 and no Not enough tokens section

#### Scenario: Plan longer than the current run

- **GIVEN** a plan of 40 tokens, run 2 Now with 32 tokens and run 3 Planned with 68
- **WHEN** the token plan is expanded
- **THEN** run 2's section holds tokens 1–32 and run 3's holds tokens 33–40, headed "8 of 68 tokens"

#### Scenario: Plan longer than every run

- **GIVEN** a plan of 110 tokens, run 2 Now with 32 tokens and run 3 Planned with 68
- **WHEN** the token plan is expanded
- **THEN** run 2 holds tokens 1–32, run 3 tokens 33–100, and "10 tokens beyond run 3's supply" holds tokens 101–110

#### Scenario: Unknown run

- **GIVEN** the run is unknown and the supply is one Next run of 68 tokens
- **WHEN** the token plan is expanded
- **THEN** it shows one section "Run · Next" holding the tokens up to 68, then Not enough tokens for any beyond

#### Scenario: Milestone marker

- **WHEN** the token plan for the worked example is expanded
- **THEN** within run 2's section token 3 (running 5,740) carries "Milestone 13 · +85 currency", token 5 (running 6,071) carries "Milestone 14 · +90 currency" and no other row carries a marker

#### Scenario: Grouping

- **WHEN** the worked example's plan is expanded
- **THEN** run 2's section shows the groups Melee (tokens 1–3), Five (token 4), Melee (tokens 5–6)

#### Scenario: Grouping restarts in a new section

- **GIVEN** tokens 32 and 33 are both team Melee and run 2's supply is 32
- **WHEN** the plan is expanded
- **THEN** token 32 closes a Melee group in run 2 and token 33 opens a new Melee group in run 3

#### Scenario: Desktop layout

- **WHEN** the plan is expanded at or above 768px
- **THEN** each section header spans the list and each token is one row with number, lane, battle, objective icons, +points and running points in aligned columns

#### Scenario: Mobile layout

- **WHEN** the plan is expanded below 768px
- **THEN** each section header wraps to two lines (run and state; tokens, points and ending points) and each token is a two-line row that fits the viewport width without horizontal scroll
