# legendary-event-run-inputs Specification

## Purpose

Defines the run inputs drawer on a Legendary Event page: the per-run economy inputs the Tacticus API does not expose (missions, premium missions, the currency bundle, "Oh So Close" shards), the paid-options switch, and how both persist through the plan's single-revision contract.

## ADDED Requirements

### Requirement: The Run status card opens a run inputs drawer

The Run status card SHALL carry an **Inputs** button (`data-testid="legendary-event-run-inputs"`) for signed-in users. It SHALL open a drawer listing runs 1, 2 and 3 in order, each labelled "Done" (before the current run), "Now" (the current run) or "Planned" (after it), where the current run is the synced `currentEventRun` clamped to 1..3, or 1 when the account has no synced entry for the event. Each run SHALL show **Regular missions** (0..the event's catalog regular mission count). When **Show paid options** is on, each run SHALL also show **Premium missions** (0..the catalog premium mission count), **Bought the 300 currency bundle** (on/off) and **Oh So Close shards** (0..75). The drawer SHALL carry the **Show paid options** switch, reflecting the plan's `showPaidOptions`. A run with no stored inputs SHALL show zeros and off. Every run SHALL be editable at any time.

Assumptions:

- Each run has its own set of missions and its own bundle offer; the mission list is the same for all three runs.
- "Oh So Close" shards are at most three chest-sized (25-shard) awards per run.

#### Scenario: Drawer for a run-2 account

- **GIVEN** Uthar's synced entry says run 2 and the plan stores run 1 as 10 regular missions
- **WHEN** the user opens Inputs
- **THEN** run 1 shows "Done" with 10 regular missions, run 2 "Now" with 0, run 3 "Planned" with 0

#### Scenario: Paid fields hidden

- **GIVEN** the plan's `showPaidOptions` is false
- **WHEN** the drawer opens
- **THEN** each run shows only Regular missions, and the Show paid options switch is off

#### Scenario: Paid fields shown

- **WHEN** the user turns Show paid options on
- **THEN** every run shows Premium missions, the bundle switch and Oh So Close shards, and the plan is saved with `showPaidOptions` true and its notes unchanged

#### Scenario: Bounds

- **WHEN** the user tries to raise Regular missions above 10 on a 10-mission event, or Oh So Close shards above 75
- **THEN** the value stays at the bound and the + control is disabled

#### Scenario: Desktop drawer

- **WHEN** the drawer opens at or above 768px
- **THEN** it is a side sheet on the right, the event page stays visible beside it, and closing it returns focus to the Inputs button

#### Scenario: Mobile drawer

- **WHEN** the drawer opens below 768px
- **THEN** it is a bottom sheet covering most of the screen with touch-sized − / + controls, and swiping it down or tapping Close dismisses it

### Requirement: Run inputs save per run through the plan revision

A change to a run's inputs SHALL show at once and SHALL be saved as one write of that run (`PUT /api/v1/me/legendary-event-plans/{eventId}/runs/{run}` with the cached plan revision) once changes to that run settle; a run whose settled values equal the stored ones SHALL send nothing. Writes SHALL go through the same queue as team writes, so they never race a team edit in the same tab. On success the returned plan SHALL replace the cached plan. On a stale-revision conflict the plan from the response SHALL replace the cached plan, the "plan reloaded" toast SHALL show, and the drawer SHALL show the adopted values. Any other failure SHALL restore the stored values and show a translated error toast. Paid values stored while Show paid options is off SHALL be kept, not cleared.

#### Scenario: Quick edits save once

- **WHEN** the user presses + on run 3 Regular missions ten times in quick succession
- **THEN** the field shows 1 through 10 as pressed, and once the presses settle one write saves run 3 with `regularMissions` 10

#### Scenario: Conflict adopts the other device's values

- **GIVEN** another device saved run 2 with 8 regular missions after this tab loaded the plan
- **WHEN** this tab saves run 2 with 6
- **THEN** the reloaded toast shows and run 2 reads 8

#### Scenario: Turning paid options off keeps the values

- **GIVEN** run 2 stores 10 premium missions
- **WHEN** the user turns Show paid options off and back on
- **THEN** run 2 shows 10 premium missions again

### Requirement: The run inputs drawer is in the event page tour

The event page tour SHALL include a step on the Inputs button, after the Run status step, on desktop and mobile, with translated title and content explaining that missions and packs the game does not report feed the reward outlook.

#### Scenario: Tour step order

- **WHEN** the event page tour runs on either form
- **THEN** the step after Run status highlights the Inputs button
