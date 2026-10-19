# Spec Delta

## ADDED Requirements

### Requirement: Plan wizard entry points

For signed-in users on an event that is active or upcoming, the Overview tab SHALL show a **Plan this event** button beside the Next token card, and each lane's Suggest teams dialog SHALL show a **Plan all lanes for a goal** link. Both SHALL open `/legendary-events/:eventId/plan` with step 1's target on the next step (a `?target=` step preselects another). An archived or finished event SHALL show neither.

#### Scenario: Open from Overview

- **WHEN** the user presses Plan this event on Uthar's Overview
- **THEN** the app navigates to `/legendary-events/votanUthar/plan` at step 1

### Requirement: Five steps with a preview before anything is written

The wizard SHALL have five steps in order, each reachable by Next and Back and, once visited, from the stepper: **Target**, **Upgrades**, **Teams**, **Runs and tokens**, **Review and create**. Nothing SHALL be written until Create on the last step. Changing an earlier step SHALL recompute later steps and keep the user's edits there where they still apply (a removed team stays removed; ticks are kept while the recommendation list is unchanged). Leaving the page with edits SHALL ask for confirmation.

- **Target**: the offered steps with each one's verdict, points target and points short, the deadline (with "estimated" when it is), and the event unit's current shards. Next is disabled until a step is chosen; choosing a Too ambitious step is allowed and keeps its warning on every later step.
- **Upgrades**: the recommendations, each with a tick (on for the target's recommendations), its steps, ceiling gain, ready date, first run helped and "already planned" when an Active goal covers it. Ticking a unit's later recommendation ticks its earlier ones; unticking an earlier one unticks the later ones. The verdict line updates as ticks change ("With these upgrades: reachable · 450 points spare").
- **Teams**: per lane the generated teams (existing ones marked "yours"), each with members and depth per run, and a Remove action (the next best suggestion takes its place; Restore brings removed teams back); a **Keep my teams / Replace my teams** choice when the plan has teams.
- **Runs and tokens**: the token plan split by run and the run forecast for the draft, with the run inputs (mission checklist, Plan to complete, bundle, Oh So Close, Show paid options) editable inline; edits here are saved with the plan on Create.
- **Review and create**: the project (see creation), the goals to create grouped by unit, the teams to create or remove per lane, the run inputs to save, and the final verdict ("By the end of run 3: Unlock reached · 450 points spare").

#### Scenario: Too ambitious warning carries through

- **GIVEN** the user picks Blue star marked Too ambitious
- **WHEN** they move to Teams
- **THEN** a banner reads "Blue star looks out of reach: Five stars is the highest step within reach" with a link back to Target

#### Scenario: Unticking an upgrade updates the verdict

- **GIVEN** Unlock needs upgrades and the recommended set brings it to reachable with 450 points spare
- **WHEN** the user unticks a recommendation worth 900 points of ceiling
- **THEN** the line reads "With these upgrades: 450 points short"

#### Scenario: Nothing written before Create

- **WHEN** the user goes through every step and leaves from Review without pressing Create, confirming the prompt
- **THEN** no project, goal, team or run input was written

### Requirement: Creation files goals in a project targeting the event

Review SHALL offer as the destination the most recently updated active project whose target is the event (`project-event-target`), any other active project with that target, or **New project** named "<unit name> · <step>" with the event target, defaulting to the first when one exists, else New project. Create SHALL, in order: create the project when new; create each unit's chosen goals with one combined goal creation into the destination project, appended to its order; create, edit and remove the teams through the plan's write queue; save the edited run inputs. Each item SHALL show pending, done or failed with its error; **Retry failed** SHALL resend only failed items. When every item is done the app SHALL return to the event's Overview with a toast "Plan created: N goals, M teams" linking to the project.

#### Scenario: Existing event project

- **GIVEN** the active project "Uthar run 3" targets Uthar
- **WHEN** Review renders
- **THEN** the destination defaults to "Uthar run 3"

#### Scenario: New project

- **GIVEN** no project targets Uthar and the target is Unlock
- **WHEN** the user presses Create
- **THEN** the project "Uthar · Unlock" is created with the Uthar target before any goal, and every goal is created in it

#### Scenario: Partial failure

- **GIVEN** one unit's goal creation fails with a slot conflict
- **WHEN** creation finishes
- **THEN** that unit's row shows the conflict message, every other item shows done, and Retry failed resends only that unit's goals

### Requirement: Wizard layouts

#### Scenario: Desktop layout

- **WHEN** the wizard renders at or above 768px
- **THEN** the steps are a vertical stepper on the left, the step content in the middle, and Back / Next (Create on the last step) in a footer that stays visible

#### Scenario: Mobile layout

- **WHEN** the wizard renders below 768px
- **THEN** a header shows "Step N of 5 · <step name>" with a progress bar, lanes on the Teams step are tabs, and Back / Next sit in a sticky bottom bar; nothing scrolls horizontally

### Requirement: Wizard data states are distinct

While the catalog, roster, plan or goals load, the page SHALL show its skeleton. Signed out, the page SHALL ask the user to sign in; on an archived event it SHALL say there is nothing left to plan. When clear estimates are unavailable, the page SHALL say "The 1-click plan needs clear estimates" with a link back to the event. When the event's catalog record or synced progress fails to load, the page SHALL show the failure with Retry. When the deadline is unknown, the Target step SHALL say "Run dates are unknown: planning only the announced runs". While farming estimates load, the Upgrades step SHALL show a skeleton, and while recommendations are still being explored it SHALL say so.

#### Scenario: Estimates unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** the wizard opens
- **THEN** the page shows "The 1-click plan needs clear estimates" and a link back to the event

### Requirement: Wizard tour and analytics

The wizard page SHALL have a page tour (desktop and mobile) targeting the stepper (desktop) or step header (mobile), the Target verdicts, the highest step within reach and the Back / Next footer, localized in en/de/es/fr. It SHALL report product analytics events for opening the wizard (with the entry point), choosing a target (with its verdict) and creating a plan (with goal and team counts).

#### Scenario: Tour on mobile

- **WHEN** the tour runs below 768px
- **THEN** every step's tooltip lies inside the viewport and targets the visible step header and bottom bar
