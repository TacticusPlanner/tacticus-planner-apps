# legendary-event-plan-wizard Specification

## Purpose

Defines the 1-click plan wizard at `/legendary-events/:eventId/plan`: its entry points, five steps previewing everything before it is written, the ordered creation of the project, goals, teams and run inputs, its layouts, data states, tour and analytics.

## Requirements

### Requirement: Plan wizard entry points

For signed-in users on an event that is active or upcoming, the event header row SHALL show the wizard button after the linked projects line, on every tab: a primary **Plan this event** button until the event has a plan, then a secondary **Refine plan** button. An event has a plan when a project targets it and every lane holds at least two stored teams; while either is unknown (loading or failed) it counts as having none. Each lane's Suggest teams dialog SHALL show a **Plan all lanes for a goal** link. Both SHALL open `/legendary-events/:eventId/plan` with step 1's target on the next step (a `?target=` step preselects another). An archived or finished event SHALL show neither.

#### Scenario: Open from Overview

- **WHEN** the user presses Plan this event on Uthar's page
- **THEN** the app navigates to `/legendary-events/votanUthar/plan` at step 1

#### Scenario: Refine an existing plan

- **GIVEN** the project "Fabius Bile · 5 stars" targets Fabius Bile and each lane holds two or more teams
- **WHEN** Fabius Bile's page renders
- **THEN** the header row shows the project and a secondary **Refine plan** button that opens the wizard

#### Scenario: Plan an event without a project

- **GIVEN** no project targets Farsight
- **WHEN** Farsight's page renders
- **THEN** the header row shows "No project for this event" and a primary **Plan this event** button

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

### Requirement: Wizard layouts

At or above 768px the wizard SHALL show a vertical stepper on the left, the step content in the middle, the plan summary as a right rail from 1536px (below that, a line above the content), the target cards in as many columns as the content width fits, and Back / Next in a footer that stays visible. Below 768px it SHALL show a step header with chips for visited steps and a progress bar, the plan summary as a sticky strip under it, and a sticky Back / Next bar above the bottom navigation. Nothing SHALL scroll horizontally.

#### Scenario: Desktop layout

- **WHEN** the wizard renders at 1280×800
- **THEN** the stepper is on the left, the summary is a line above the content, every target card is visible without scrolling, and Back / Next stay visible while the content scrolls

#### Scenario: Wide desktop layout

- **WHEN** the wizard renders at 1536px or wider
- **THEN** the plan summary is a right rail beside the step content

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

### Requirement: Wizard tour and analytics

The wizard SHALL have a page tour on desktop (stepper, run picker, target cards, Assumptions panel, plan summary rail, footer) and on mobile (step header and chips, run picker, target cards, Assumptions panel, summary strip, bottom bar), localized in en/de/es/fr. The run picker step SHALL be skipped when the plan plays one run. It SHALL report analytics for opening the wizard (with the entry point), an explicit target choice (with its verdict), and creating a plan (with goal and team counts). The wizard's token plan and forecast SHALL NOT report the event page's expand events.

#### Scenario: Tour on mobile

- **WHEN** the tour runs below 768px
- **THEN** every tooltip lies inside the viewport and targets the visible step header, run picker, cards, Assumptions panel, summary strip and bottom bar

#### Scenario: Tour of a one-run plan

- **GIVEN** the plan plays only the event's last run, so the Target step shows no run picker
- **WHEN** the tour runs
- **THEN** it skips the run picker step and counts one step fewer

### Requirement: Run-input edits settle before they are planned

A run-input change on the Target step SHALL update its control at once, and SHALL reach the verdicts and the upgrade search only after 400 ms with no further run-input change.

Assumptions:

- 400 ms covers a burst of stepper clicks yet still feels immediate.

#### Scenario: Several stepper clicks restart the search once

- **GIVEN** Five stars shows "Needs upgrades · 2,100 points short with your roster"
- **WHEN** the user raises Plan to complete for run 3 by four clicks, 150 ms apart
- **THEN** the field shows each new value at once
- **AND** the search restarts once, 400 ms after the fourth click

### Requirement: Verdicts being rechecked keep their last value

While run inputs settle or the search runs again, each step that was not Reachable now SHALL keep its last verdict and points shown, dimmed, with the **Checking** badge, instead of dropping them. A Reachable now step SHALL show **Checking** too once new inputs lower the synced ceiling below its target.

#### Scenario: Last verdict stays visible

- **GIVEN** Five stars shows "Needs upgrades · 2,100 points short with your roster"
- **WHEN** the user changes a run input
- **THEN** Five stars keeps "2,100 points short" dimmed with **Checking** until its verdict settles on the new inputs

### Requirement: Create waits only for the chosen target

Create on the Review step SHALL be enabled as soon as the chosen target's recommendations are final (`legendary-event-plan-generation`), without waiting for the rest of the search, and the Upgrades step SHALL stop saying "Still looking for upgrades…" at that moment. The other steps' verdicts and the "highest step within reach" line SHALL keep **Checking** until the search has ended.

#### Scenario: Create available before the search ends

- **GIVEN** the chosen target is Unlock, and its recommendations are final while the search is still settling Blue star
- **WHEN** the user reaches Review
- **THEN** Create is enabled and pressing it files Unlock's goals
- **AND** the Target step still shows **Checking** for Blue star

#### Scenario: Reachable now needs no search

- **GIVEN** the chosen target is Reachable now with the synced roster
- **WHEN** the wizard opens
- **THEN** the Upgrades step shows "Your roster already reaches the target: no upgrades needed." and Create is enabled on Review without waiting for the search

### Requirement: Target step leads with the choice

The Target step SHALL plan to the end of one run, the **horizon**. Its heading SHALL read "What should <unit> reach by the end of run <N>?", followed, when the plan plays more than one run, by a run picker with one option per plan run showing the run's announced dates or its guess ("maybe ~<month year>", `legendary-event-run-date-estimate`), then the horizon's end ("Run N ends <date>", "Run N ends maybe around <date> (guessed from past runs)", or that its dates are unknown). The horizon SHALL default to the run in progress or the next run; choosing another SHALL recheck every verdict, reset the default ticks and let the default target move again. The verdicts, recommended upgrades, team swap offers, potential maps, Assumptions summary and the Review verdict ("By the end of run N") SHALL all follow the horizon. Then the Target step SHALL show one card per offered step. Each card SHALL show the step, points target, verdict, and a bar of the synced and fully upgraded ceilings against the target. Run inputs SHALL sit in a collapsed **Assumptions** panel summarised per run through the horizon in its header; the potential maps SHALL sit under **Why this verdict?**.

Assumptions:

- The bar's unit is event points, anchored to the unit's current progression.
- The horizon is not stored: each wizard visit starts at the run in progress or the next run.

#### Scenario: Card bar for Unlock

- **GIVEN** the Unlock target of 10,000 points, a synced ceiling of 6,136 and a ceiling with every recommended upgrade of 10,450
- **WHEN** the Unlock card renders
- **THEN** the solid segment fills 61% (6,136 ÷ 10,000), the hatched segment fills the rest to 100% (10,450 is capped at the target), and the card reads "Needs upgrades · 3,864 points short with your roster · +450 spare with upgrades" (10,000 − 6,136; 10,450 − 10,000)

#### Scenario: Assumptions summary

- **GIVEN** run 2 with 6 of 8 missions planned and the bundle bought, run 3 with none, and the horizon run 3
- **WHEN** the Target step renders
- **THEN** the Assumptions panel is closed and its header reads "Run 2: 6 of 8 missions · bundle · Run 3: 0 of 8 missions"

#### Scenario: Upcoming event plans its first run

- **GIVEN** Bile is upcoming with only run 1 announced for 8 November 2026
- **WHEN** the Target step renders
- **THEN** the heading reads "What should Fabius Bile reach by the end of run 1?", the end line reads "Run 1 ends Nov 15, 2026", and the picker offers Run 1 (Nov 8 – Nov 15), Run 2 (maybe ~May 2027) and Run 3 (maybe ~Oct 2027)

#### Scenario: Choosing a later run

- **GIVEN** the horizon is run 1
- **WHEN** the user picks Run 2
- **THEN** the heading reads "… by the end of run 2?", the end line reads "Run 2 ends maybe around May 9, 2027 (guessed from past runs)", and every verdict is rechecked against run 2's ending points

#### Scenario: Choosing a run with the keyboard

- **GIVEN** the horizon is run 2 and the picker offers Run 2 and Run 3
- **WHEN** the user tabs into the picker and presses the right arrow key
- **THEN** the picker is one tab stop on the checked run, Run 3 becomes checked and focused, and the verdicts are rechecked against run 3

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
