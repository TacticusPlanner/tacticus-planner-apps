## Purpose

Defines Plan › Survival: picking a Survival event and planning its team, enemies, rewards, missions and offers.

## ADDED Requirements

### Requirement: The Survival page is a sign-in-only Plan tab with routed tabs

The app SHALL serve `/plan/survival/team`, `/plan/survival/enemies`, `/plan/survival/rewards`, `/plan/survival/missions` and `/plan/survival/offers` to signed-in users. `/plan/survival` and any other path under it SHALL redirect to `/plan/survival/team` without reporting a page view.

#### Scenario: Bare path

- **WHEN** a signed-in user opens `/plan/survival`
- **THEN** the address becomes `/plan/survival/team`

### Requirement: The page picks a Survival event

The event SHALL come from the `event` query parameter, kept when switching tabs. Without it the page SHALL show the running event, else the next one to start, else the newest past one, else an undated one. An event the catalog does not serve SHALL drop the parameter. With no served events the page SHALL say so. A monthly event SHALL be named by its month and year in the UI language; any other by its `survival:events.<id>` name.

#### Scenario: Next event by default

- **GIVEN** today is 2026-11-26, December 2026 starts 2026-12-03 and Crescendo A has no dates
- **WHEN** the user opens `/plan/survival/enemies`
- **THEN** December 2026's waves are shown

#### Scenario: Unknown event

- **WHEN** the user opens `/plan/survival/rewards?event=march-2020`
- **THEN** the address becomes `/plan/survival/rewards` and the default event is shown

### Requirement: The Team tab plans the event's team

The Team tab SHALL show the event's featured hero first, marked Featured, then the player's team for the event (the team whose `survivalEventKey` is the event id), its character count against the cap and its issues. Edit team and Create team SHALL open the team editor with Horde as the only mode, the event's caps and factions, and the featured hero left out of the picker. Each unit SHALL show its goal lines with Create goal.

#### Scenario: No team yet

- **GIVEN** no team for December 2026
- **WHEN** the user taps Create team
- **THEN** the editor opens a Horde team named "Survival · December 2026" tied to the event

### Requirement: The Enemies tab lists every wave

Each wave SHALL show its power (compact, exact in a tooltip), round, score, the medal first earned on clearing it and its enemies as tiles; an enemy's card SHALL add the points it scores per kill. A clone wave SHALL say so with its health share. What clearing a wave adds (rarity-ups, power-ups) SHALL follow the wave. The last wave SHALL read "Final wave", with its number and that no team is meant to beat it in a hint.

#### Scenario: Final wave

- **WHEN** December 2026's Enemies tab renders
- **THEN** 20 waves are listed and wave 20 reads "Final wave"

### Requirement: Rewards, Missions and Offers show the event's payouts

Rewards SHALL show the milestones, progress chests with their cost, rarity milestones and how points are scored with the maximum. Missions SHALL show daily missions and mission chains as the event shop does, noting premium chains and chains that pay the stat boost. Offers SHALL show each offer's USD price, purchase limit and rewards; the pass SHALL say how much event currency its premium chains add and link to Missions.

#### Scenario: Pass offer

- **WHEN** December 2026's Offers tab renders
- **THEN** the pass card is shown with a link to Missions
