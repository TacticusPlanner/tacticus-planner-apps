# Proposal

## Why

Planning a Legendary Event today takes many separate steps: read the reward outlook, build teams lane by lane, set depths, enter run inputs, then go to Goals to create upgrades for the units that fall short. Severyn wants a **1-click plan**: pick what the event should end with (Unlock, 4 stars, 5 stars, Blue star), and the app proposes the upgrade goals, the most efficient teams and the token plan to get there by the end of run 3, previews everything, lets the user adjust it, and creates it in one go, filed in a project for that event.

## What Changes

- **Run 3 date estimate.** When a later run's start is not announced, it is estimated from the gaps between consecutive announced runs of every catalog event (median, whole days), so the plan has a deadline. Shown as "about 15 April 2027 (estimated)".
- **Target feasibility.** For each remaining ascension step of the event unit, the planner computes the points it needs (the reward projection's points target for that step) and compares it with what the roster can score within the remaining token supply, today and with upgrades. Each step is labelled **Reachable now**, **Needs upgrades** or **Too ambitious**, with the shortfall.
- **Upgrade recommendations.** For a target that needs upgrades, the planner picks unit upgrades (Unlock, Ascension, Rank) greedily by points gained in this event per farming day, keeping only those whose estimated completion lands before the run that uses them, until the shortfall is closed. Ties prefer units with more value across Legendary Events (master table total) and a higher horde-mode tier. Existing goals are reused, not duplicated.
- **Team generation.** With the roster each run is expected to have (synced plus the accepted goals finished before that run), the planner proposes per lane the set of teams that adds the most reachable points, from the existing team suggestions, keeping the user's current teams by default.
- **Plan wizard.** A new page `/legendary-events/:eventId/plan` with five steps: 1 **Target** (with the feasibility badge), 2 **Upgrades** (recommended goals, untick or change targets), 3 **Teams** (per lane, keep / remove / edit / add), 4 **Runs and tokens** (the per-run token plan and forecast, with the mission checklist, paid options and bundle inline), 5 **Review and create** (teams, goals and the project they go into). Desktop shows a side stepper; mobile shows a step header and a sticky Back / Next bar.
- **Entry points.** A **Plan this event** button on the Overview tab (beside the Next token card) and a **Plan all lanes for a goal** link in each lane's Suggest teams dialog.
- **Creation.** Create writes the teams through the plan API, the goals through the combined goal creation per unit into the chosen project (an existing active project targeting the event, or a new one "Uthar · Blue star" created with the event target), and reports each item's result with retry for failures.

Depends on `add-legendary-event-roster-potential-map`, `split-legendary-event-token-plan-by-run`, `add-legendary-event-mission-tracking` and `add-project-event-target`. No new API change beyond those.

## Capabilities

### New Capabilities

- `legendary-event-run-date-estimate`: estimated start of unannounced runs and the event's deadline.
- `legendary-event-plan-generation`: target points per step, roster ceiling and verdict, upgrade recommendations and team generation.
- `legendary-event-plan-wizard`: entry points, the five steps, adjustments, creation and its data states.

## Impact

- `entities/legendary-event/lib`: run date estimate, step points target (generalising the reward projection), roster ceiling.
- New `features/legendary-event-plan` (generation model, wizard steps), reusing `legendary-event-team-suggestions`, `legendary-event-tokens`, `legendary-event-run-inputs`, goal creation and project entities.
- New route and page under `pages/legendary-events`; Overview and Suggest teams entry points; tour for the wizard page.
- `legendaryEvents` i18n in en/de/es/fr.
