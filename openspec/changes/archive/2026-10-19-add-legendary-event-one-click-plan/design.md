# Design

## Context

Most building blocks exist: the reward projection (points target for the next step), clear estimates and Goals Preview (power from a projected roster), upgrade impact (points gained by a unit's next step), team suggestions (best five per objective subset), the token plan and run forecast, run inputs, combined goal creation and goal farming estimates (completion dates). The wizard is mostly orchestration; the new logic is the step target for any step, the ceiling, the date estimate and the greedy upgrade loop.

## Goals / Non-Goals

- Goal: one flow from "I want Blue star" to saved teams, goals and project, with every item previewed and adjustable before anything is written.
- Goal: honest feasibility. A target the roster cannot reach is said so on step 1, with the best reachable step.
- Non-goal: an exact optimiser. Greedy choices with clear tie-breaks, explained in the UI.
- Non-goal: storing a wizard draft. Leaving the page discards it (with a confirm when anything was changed).

## Decisions

### D1. Step order: Target, Upgrades, Teams, Runs, Review

Teams depend on the roster each run will have, so upgrades come first (Severyn's own note). Runs and tokens come after teams because the token plan is computed from them.

### D2. Points target for any step

Generalise the reward projection: replace "next step" with the chosen step's cumulative threshold; everything else (base, future inputs, payouts, milestones) is unchanged. The next step reproduces today's figures exactly.

### D3. Ceiling = current points + reachable points within the token supply

The **ceiling** for a roster is the run forecast's ending points when the token plan is built from that roster's generated teams (D5) with their per-run depths. Comparing the target with the ceiling for the synced roster gives Reachable now; with the full recommended upgrade set gives Needs upgrades; otherwise Too ambitious, and the wizard names the highest step whose target is at or below the best ceiling.

As built: the token plan gained run slots (`runSlots`), so each token is valued at its run's depth (`perRunDepths`) and a run in which no team can play leaves its remaining tokens unplanned instead of ending the plan. Without this, a roster that only gets deep enough in run 3 was never credited for it.

### D4. Greedy upgrades by points per farming day

Candidates: the next steps (`legendary-event-upgrade-impact`) of every unit any lane allows, repeated up to three steps per unit. Each round scores a candidate by the ceiling gain it adds over the current selection divided by its estimated farming days (goal farming estimates on the account's current plan, added at the end of the goal order), dropping candidates whose estimated completion is after the start of the last run they could improve. Pick the best, repeat until the target is met or nothing gains. Ties: master table total across all served events (value beyond this event), then horde-mode multiplier, then name. Upgrades are capped at 12 goals per plan to keep the step reviewable.

As built:

- Candidates are chains of one to three steps per unit; a single step rarely moves a team one battle, so single steps found nothing.
- Candidates are limited to team members, the top 4 owned units per objective by power and the top 2 locked units per objective by points per battle, which keeps exploration fast.
- Farming days are the unit's chain on its own (not appended to the account's goal order); ready dates queue the recommendations one after another.
- The greedy runs once with no target (to the cap) and each step's recommendations are the prefix that reaches it, so changing the target does not re-run the search. It runs in `setTimeout` chunks so the page stays responsive.

### D5. Team generation reuses suggestions

Per lane and per run roster: start from the user's teams (or none when "Replace my teams" is chosen), repeatedly add the suggestion with the highest gain until no suggestion gains or the lane has 6 teams. Each new team's depth per run is its clear estimate on that run's projected roster.

As built: a lane's teams are cached by the roster changes of the units that lane allows, so evaluating one unit's upgrade regenerates only its lanes. A removed team's members are excluded, so the next best suggestion takes its place. On Create a new team is saved with its first plan run's depth unset (live estimate) and a stored "estimate" depth only for later runs where it differs; it is named by its display name (60 characters at most).

### D6. Creation order and partial failure

1. project (create if new), 2) goals per unit via combined creation into that project (sequential), 3) teams via the plan queue, 4) run inputs. Each item shows pending, done or failed with the error; Retry failed re-sends only failed items. Nothing is rolled back: every created item is already useful and visible elsewhere.

### D7. Run date estimate

Median gap, in whole days rounded up, over every pair of consecutive announced run starts across catalog events; unannounced run N starts at run N−1's start + the gap. With no pair anywhere the deadline is unknown and the wizard plans only the announced runs, saying so.

## Risks / Trade-offs

- Farming estimates run the account's whole plan; the wizard computes them in a worker-friendly batch and shows a skeleton per candidate while they run.
- Greedy picks can miss a cheaper combination; the Upgrades step lets the user swap a goal and see the verdict update.
- Estimated dates can move when the game announces runs; the plan only uses them to filter upgrades, and the dates are labelled estimated.

## Deferred from v1

- Editing a team in the draft (the team editor saving into the draft) and an explicit Add suggestion action. Remove lets the next suggestion in, which covers the common case.
- Changing a recommendation's target step on the Upgrades step.
- A tour that walks every step (later steps are not mounted while the tour runs).
- Running the farming estimates in a worker.

## Open questions

- Goal cap (12) and team cap per lane (6): defaults, easy to change.
- Should accepted goals be created Paused to avoid disturbing the account's goal order? Default: Active, appended at the end of the project's order.
