## MODIFIED Requirements

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

### Requirement: Wizard tour and analytics

The wizard SHALL have a page tour on desktop (stepper, run picker, target cards, Assumptions panel, plan summary rail, footer) and on mobile (step header and chips, run picker, target cards, Assumptions panel, summary strip, bottom bar), localized in en/de/es/fr. The run picker step SHALL be skipped when the plan plays one run. It SHALL report analytics for opening the wizard (with the entry point), an explicit target choice (with its verdict), and creating a plan (with goal and team counts). The wizard's token plan and forecast SHALL NOT report the event page's expand events.

#### Scenario: Tour on mobile

- **WHEN** the tour runs below 768px
- **THEN** every tooltip lies inside the viewport and targets the visible step header, run picker, cards, Assumptions panel, summary strip and bottom bar

#### Scenario: Tour of a one-run plan

- **GIVEN** the plan plays only the event's last run, so the Target step shows no run picker
- **WHEN** the tour runs
- **THEN** it skips the run picker step and counts one step fewer
