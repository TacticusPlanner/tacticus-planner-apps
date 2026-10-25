# Spec Delta

## MODIFIED Requirements

### Requirement: Five steps with a preview before anything is written

The wizard SHALL have five steps in order, each reachable by Next and Back and, once visited, from the stepper or step chips: **Target**, **Upgrades**, **Teams**, **Runs and tokens**, **Review and create**. Nothing SHALL be written until Create. Changing an earlier step SHALL recompute later steps and keep the user's edits where they still apply. Leaving the page with edits SHALL ask first. Each step's content is defined by its own requirement below.

#### Scenario: Nothing written before Create

- **WHEN** the user goes through every step and leaves from Review without pressing Create, confirming the prompt
- **THEN** no project, goal, team or run input was written

#### Scenario: Too ambitious warning carries through

- **GIVEN** the user picks Blue star marked Too ambitious
- **WHEN** they move to Teams
- **THEN** the plan summary reads "Blue star looks out of reach: Five stars is the highest step within reach" with a Change target link back to Target

#### Scenario: Unticking an upgrade updates the verdict

- **GIVEN** Unlock needs upgrades and the recommended set brings it to reachable with 450 points spare
- **WHEN** the user unticks a recommendation worth 900 points of ceiling
- **THEN** the line reads "With these upgrades: 450 points short"

#### Scenario: A removed team stays removed

- **GIVEN** the user removed a generated Alpha team on Teams
- **WHEN** they go back to Upgrades, untick one recommendation and return to Teams
- **THEN** that team is still removed and Undo still restores it

### Requirement: Wizard layouts

At or above 768px the wizard SHALL show a vertical stepper on the left, the step content in the middle, the plan summary as a right rail (above the content from 768px to 1023px), and Back / Next in a footer that stays visible. Below 768px it SHALL show a step header with chips for visited steps and a progress bar, the plan summary as a sticky strip under it, and a sticky Back / Next bar above the bottom navigation. Nothing SHALL scroll horizontally.

#### Scenario: Desktop layout

- **WHEN** the wizard renders at 1280px
- **THEN** the stepper is on the left, the summary rail on the right, and Back / Next stay visible while the content scrolls

#### Scenario: Mobile layout

- **WHEN** the wizard renders below 768px
- **THEN** a header shows "Step N of 5 · <step name>" with chips for visited steps and a progress bar, the plan summary is a strip under it, lanes on the Teams step are tabs, and Back / Next sit in a sticky bar above the bottom navigation; nothing scrolls horizontally

#### Scenario: Mobile footer above the bottom navigation

- **WHEN** the wizard renders at 390px and the user scrolls the Target step
- **THEN** Back / Next stay visible directly above the bottom navigation, and nothing scrolls horizontally

#### Scenario: Mobile step chips

- **GIVEN** the user has visited Target, Upgrades and Teams below 768px
- **WHEN** they tap the Upgrades chip
- **THEN** the wizard shows Upgrades, and the Runs and Review chips are not tappable

### Requirement: Wizard data states are distinct

While the reads load, the page SHALL show its skeleton. Signed out, it SHALL ask the user to sign in; on an archived event it SHALL say there is nothing left to plan. When the event unit has no step left to reach, or the event has no reward ladder, it SHALL say which, with a link back to the event. When clear estimates are unavailable, it SHALL name the missing data with a link back. A failed catalog or progress read SHALL show Retry.

#### Scenario: Nothing left to reach

- **GIVEN** the user's Uthar is fully ascended
- **WHEN** the wizard opens
- **THEN** the page says Uthar has no step left to reach in this event and links back to the event, with no stepper or footer

#### Scenario: Estimates unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** the wizard opens
- **THEN** the page says "The 1-click plan needs clear estimates", names unit power as missing, and links back to the event

### Requirement: Creation files goals in a project targeting the event

Review SHALL offer the destination project as today (`project-event-target`). Create SHALL, in order: create the project when new; create each unit's goals with one combined goal creation; remove, update and create the teams through the plan's write queue; save the edited run inputs. Each item SHALL show pending, done or failed. **Retry failed** SHALL resend only failed items and SHALL be available whenever Create is not running. While a failed item remains, leaving SHALL ask first. When every item is done, the app SHALL return to Overview with a pluralised toast linking to the project.

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
- **THEN** that row shows the conflict message, Retry failed is enabled at once, and leaving asks "Some items failed. Leave without retrying?"

#### Scenario: One goal

- **WHEN** a plan with one goal and two teams is created
- **THEN** the toast reads "Plan created: 1 goal, 2 teams"

### Requirement: Wizard tour and analytics

The wizard SHALL have a page tour on desktop (stepper, target cards, Assumptions panel, plan summary rail, footer) and on mobile (step header and chips, target cards, Assumptions panel, summary strip, bottom bar), localized in en/de/es/fr. It SHALL report analytics for opening the wizard (with the entry point), an explicit target choice (with its verdict), and creating a plan (with goal and team counts). The wizard's token plan and forecast SHALL NOT report the event page's expand events.

#### Scenario: Tour on mobile

- **WHEN** the tour runs below 768px
- **THEN** every tooltip lies inside the viewport and targets the visible step header, cards, Assumptions panel, summary strip and bottom bar

## ADDED Requirements

### Requirement: Target step leads with the choice

The Target step SHALL show one card per offered step, right after the heading and deadline. Each card SHALL show the step, points target, verdict, and a bar of the synced and fully upgraded ceilings against the target. Run inputs SHALL sit in a collapsed **Assumptions** panel summarised per run in its header; the potential maps SHALL sit under **Why this verdict?**.

Assumptions:

- The bar's unit is event points, anchored to the unit's current progression.

#### Scenario: Card bar for Unlock

- **GIVEN** the Unlock target of 10,000 points, a synced ceiling of 6,136 and a ceiling with every recommended upgrade of 10,450
- **WHEN** the Unlock card renders
- **THEN** the solid segment fills 61% (6,136 ÷ 10,000), the hatched segment fills the rest to 100% (10,450 is capped at the target), and the card reads "Needs upgrades · 3,864 points short with your roster · +450 spare with upgrades" (10,000 − 6,136; 10,450 − 10,000)

#### Scenario: Assumptions summary

- **GIVEN** run 2 with 6 of 8 missions planned and the bundle bought, and run 3 with none
- **WHEN** the Target step renders
- **THEN** the Assumptions panel is closed and its header reads "Run 2: 6 of 8 missions · bundle · Run 3: 0 of 8 missions"

### Requirement: Default target is the highest step within reach

Until the user chooses a target (or `?target=` names one), the chosen target SHALL be the next step while upgrades are explored, then the highest step within reach once they are. The change SHALL happen at most once and SHALL be announced in the plan summary. An explicit choice SHALL never be replaced.

#### Scenario: Default moves to the best step once

- **GIVEN** Unlock is the next step and Five stars turns out to be the highest step within reach
- **WHEN** the search ends without the user having chosen
- **THEN** Five stars becomes selected and the summary says "Five stars is the highest step within reach"

### Requirement: Plan summary on every step

Every step SHALL show a plan summary: the target and its verdict, "ceiling X of Y needed" or "+Z spare", the goals to create and the team changes (+created / −removed). A Too ambitious target SHALL show its warning there with a **Change target** link, in place of a separate banner.

#### Scenario: Summary follows the ticks

- **GIVEN** Unlock (10,000 points) with three ticked recommendations bringing the ceiling to 10,450
- **WHEN** the user unticks the third one (ceiling back to 9,100)
- **THEN** the summary changes from "+450 spare" to "ceiling 9,100 of 10,000 needed" and the goals count drops by one

### Requirement: Upgrades step groups by run with quick actions

Recommendations SHALL be grouped by the first run they help ("Ready for run N"), each row showing the ceiling after it against the target. **Just enough**, **All** and **None** SHALL set the ticks. New finds SHALL be auto-ticked until the user ticks by hand; afterwards the step SHALL say how many new suggestions are not ticked, with **Tick them**.

#### Scenario: Manual ticks keep later finds visible

- **GIVEN** the user unticked one recommendation while the search was still running
- **WHEN** two more recommendations are found
- **THEN** they appear unticked and the step reads "2 new suggestions not ticked" with Tick them

### Requirement: Teams step undoes, edits and adds teams

Each removed team SHALL stay listed, struck through, with its own **Undo**; **Restore all** SHALL restore every removed team. **Edit** SHALL open the team editor on the draft team, and **Add a team** SHALL add a team to the lane. Depth per run SHALL show as battles cleared out of the lane's battles. Keep / Replace SHALL show the number of the user's teams and of generated teams. On desktop at or above 1024px the lanes SHALL sit side by side; below 768px they stay tabs.

#### Scenario: Undo one removal

- **GIVEN** the user removed two Alpha teams
- **WHEN** they press Undo on the first
- **THEN** only that team returns, and the other stays removed

#### Scenario: Edited stored team

- **GIVEN** the user's stored team "Melee" in Alpha
- **WHEN** they edit it to swap one member and reach Review
- **THEN** Review lists "Update 'Melee' in Alpha" and Create sends an update for it, not a removal and a creation

### Requirement: Runs and tokens step shows its content

The token plan and the run forecast SHALL open expanded in the wizard, with their open state kept apart from the event page's. The leftover-tokens link SHALL open the Teams step on that lane.

#### Scenario: Leftover link

- **GIVEN** the forecast says 40 tokens are left over for Beta
- **WHEN** the user presses that line
- **THEN** the wizard shows the Teams step with Beta selected

### Requirement: Review lists every write by name

Review SHALL have a heading and three cards, Goals, Teams and Run inputs, each saying "Nothing to change" when empty. Team removals SHALL be listed by name in destructive styling, and updates and creations by name. The Create button SHALL carry the counts.

#### Scenario: Named removal and counted Create

- **GIVEN** Replace my teams removes the user's "Melee" and "Psykers" from Alpha and the plan creates 4 goals and 3 teams
- **WHEN** Review renders
- **THEN** it lists "Remove 'Melee' from Alpha" and "Remove 'Psykers' from Alpha" in destructive styling, and the button reads "Create 4 goals and 3 teams"

### Requirement: Wizard step is kept in the URL

The current step SHALL be the `?step=` search parameter. Next, Back and the stepper SHALL add history entries, so the browser's Back and Forward move between steps without the leave prompt. A step after the furthest visited one SHALL show the furthest visited one instead.

#### Scenario: Browser Back moves one step

- **GIVEN** the user is on Teams after Target and Upgrades
- **WHEN** they press the browser's Back
- **THEN** the wizard shows Upgrades with the draft unchanged, and no leave prompt appears

#### Scenario: Refresh starts from Target

- **GIVEN** the user is on `?step=teams`
- **WHEN** they reload the page
- **THEN** the wizard opens on Target (the draft and visited steps are not saved), and `?step=` is rewritten to `target`
