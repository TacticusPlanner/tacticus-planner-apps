# Proposal

## Why

For a Home Screen Event that scores in Arena, Onslaught or Salvage Run, the points depend on which units do the killing (Psyker Boost: only kills by a Psyker count). The Dailies team pages recommend teams for goals and XP, not for the running event. Severyn wants the HSE page to suggest the teams to play during the event: one Arena team, and one team per alliance for Onslaught and for Salvage Run.

## What Changes

- **Event teams section** on Dailies > HSE for running and upcoming Personal events with a tracker scoring in Arena, Onslaught or Salvage Run: one Arena team, three Onslaught teams and three Salvage Run teams (Imperial, Chaos, Xenos), each only for modes the event scores in.
- Built with the shared team engine in **Power mode only** (no XP / Power switch, no Random team, no size control; five characters), with the event's units as the highest-priority pool, then the rest of the mode-eligible roster by combat power.
- Event units come from the tracker's player filter (traits or alliance, faction); events without a player filter use the strongest roster; line-up events (Faction Focus) use the strongest single faction per team.
- Hints for enemy-side rules (For the Emperor: only non-Imperial enemies count).
- New team member rationale `event-unit` in the shared engine.
- Tour step and copy in en/de/es/fr.

Builds on `add-hse-points-projection` (served `config.hse`, variant and tier resolution) and `add-hse-instance-switcher`. Apps only; no API change beyond that companion.

Out of scope: changing the Arena, Onslaught and Salvage Run pages; team suggestions for campaign raids or Legendary Events.

## Capabilities

### New Capabilities

- `hse-team-suggestions`: which modes get teams, event-unit selection, engine configuration, presentation and states.

### Modified Capabilities

- `dailies-team-recommendations`: adds the `event-unit` rationale to the shared team presentation.

## Impact

- `pages/dailies/model/hse-team-recommendations.ts` (+ types, tests), `pages/dailies/model/use-hse-team-recommendations.ts`, `team-recommendations.types.ts` (rationale kind), `pages/dailies/ui/hse-teams/` (section, desktop grid, mobile tabs), `hse-page.tsx`, `hse-page.tutorial.tsx`, locales `dailies.json` and `teamRecs.json` in four languages.
