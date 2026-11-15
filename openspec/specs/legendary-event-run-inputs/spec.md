# legendary-event-run-inputs Specification

## Purpose

Defines the run inputs drawer on a Legendary Event page: the per-run economy inputs the Tacticus API does not expose (missions, premium missions, the currency bundle, "Oh So Close" shards), the account's Legendary Event settings (Show paid options, Watch daily ads), and how run inputs persist through the plan's single-revision contract.

## Requirements

### Requirement: The Run status card opens a run inputs drawer

The Run status card SHALL carry an **Inputs** button (`data-testid="legendary-event-run-inputs"`) for signed-in users. It SHALL open a drawer with the **current run** only: the run in progress, else the next run (upcoming or between runs), labelled "Now" or "Planned" against the runs resolved by `legendary-event-run-resolution`; while the run is unknown it SHALL list runs 1, 2 and 3 unlabelled; after the last run it lists none. Every run is edited in place in the Plan tab's Run forecast (`legendary-event-run-forecast`). A run SHALL show **Regular missions** as the event's regular missions in order, each marked done (struck through with a check), current (the first not done, highlighted "Now") or later, with a **Done** count (0..the catalog regular mission count) and a **Plan to complete** count (the done count..the catalog count). Missions finish in order, so there are no per-mission ticks: picking a mission row sets the done count to that mission (or, on a done row, to the one before it), and a done count above the planned count SHALL raise the planned count to it. When the account's **Show paid options** is on (`legendary-event-settings` below), a run SHALL also show **Premium missions** the same way, **Bought the 300 currency bundle** (on/off) and **Oh So Close shards** (0..75). A run with no stored inputs SHALL plan all of its free missions: 0 done, Plan to complete 10 regular missions, 0 premium, off and 0 shards.

Assumptions:

- Each run has its own set of missions and its own bundle offer; the mission list is the same for all three runs.
- Missions of a track finish one after another; only the current one counts progress.
- "Oh So Close" shards are at most three chest-sized (25-shard) awards per run.
- The game does not sync mission progress; the done count is the user's record.

#### Scenario: Drawer for a run-2 account

- **GIVEN** Uthar's synced entry says run 2 and the plan stores nothing for run 2
- **WHEN** the user opens Inputs
- **THEN** the drawer shows run 2 only, labelled "Now", with 0 done, mission 1 marked "Now" and Plan to complete 10

#### Scenario: Done raises the plan

- **GIVEN** run 2 has 3 done and plans 3
- **WHEN** the user picks the fifth mission
- **THEN** run 2 shows 5 done with missions 1–5 struck through, mission 6 current and Plan to complete 5, and one write saves both once changes settle

#### Scenario: Plan cannot drop below done

- **GIVEN** run 2 has 3 missions done and plans 5
- **WHEN** the user presses − on Plan to complete three times
- **THEN** the count stops at 3 and − is disabled

#### Scenario: Paid fields hidden

- **GIVEN** the account's Show paid options is off
- **WHEN** the drawer opens
- **THEN** the run shows only the regular missions and their counts

#### Scenario: Desktop drawer

- **WHEN** the drawer opens at or above 768px
- **THEN** it is a side sheet on the right, the event page stays visible beside it, and closing it returns focus to the Inputs button

#### Scenario: Mobile drawer

- **WHEN** the drawer opens below 768px
- **THEN** it is a bottom sheet covering most of the screen with touch-sized mission rows and − / + controls, and swiping it down or tapping Close dismisses it

### Requirement: Legendary Event settings hold Show paid options and Watch daily ads

Show paid options and Watch daily ads SHALL be account settings for every Legendary Event, stored as user preference flags on the user settings (`LegendaryEventShowPaidOptions`, `LegendaryEventSkipDailyAds`; Show paid options off and Watch daily ads on by default), never on an event's plan. While signed in on the Legendary Events section, the section's top row SHALL carry a settings button (gear, `data-testid="legendary-event-settings"`) beside the section tabs on both forms; it opens a **Legendary Event settings** dialog with a **Show paid options** switch, explained as showing the premium missions, the 300 currency bundle and Oh So Close shards in run inputs and counting them in the forecast and token plan, and a **Watch daily ads** switch with its token explanation. A change SHALL save at once; a failed save shows the run inputs error toast and keeps the previous value. The plan wizard SHALL plan with the account's Show paid options and SHALL not write it.

#### Scenario: Turning paid options on

- **GIVEN** Show paid options is off
- **WHEN** the user turns it on in Legendary Event settings
- **THEN** the setting is saved to the account, and every event's run inputs show the premium missions, bundle and Oh So Close fields

### Requirement: Run inputs save per run through the plan revision

A change to a run's inputs SHALL show at once and SHALL be saved as one write of that run (`PUT /api/v1/legendary-event-plans/{eventId}/runs/{run}` with the cached plan revision) once changes to that run settle; a run whose settled values equal the stored ones SHALL send nothing. Writes SHALL go through the same queue as team writes, so they never race a team edit in the same tab. Success, conflict and failure SHALL follow the plan write queue (`legendary-event-teams`, "The plan is persisted through the API with one revision"); after a conflict the drawer SHALL show the adopted values. Paid values stored while Show paid options is off SHALL be kept, not cleared.

#### Scenario: Quick edits save once

- **WHEN** the user presses + on run 3 Regular missions ten times in quick succession
- **THEN** the field shows 1 through 10 as pressed, and once the presses settle one write saves run 3 with `regularMissions` 10

#### Scenario: Conflict adopts the other device's values

- **GIVEN** another device saved run 2 with 8 regular missions after this tab loaded the plan
- **WHEN** this tab saves run 2 with 6
- **THEN** the reloaded toast shows and run 2 reads 8

#### Scenario: Turning paid options off keeps the values

- **GIVEN** run 2 stores 10 premium missions
- **WHEN** the user turns Show paid options off and back on in Legendary Event settings
- **THEN** run 2 shows 10 premium missions again

### Requirement: The run inputs drawer is in the event page tour

The event page tour's Run inputs step (its place in the order: `legendary-events-hub`) SHALL have translated title and content explaining that the user sets how many missions of the current run are done (they finish in order) and how many they plan to complete, plus the packs the game does not report, that later runs assume all free missions, and that every run is edited from the Plan tab's Run forecast.

#### Scenario: Run inputs step copy

- **WHEN** the event page tour reaches the Run inputs step on either form
- **THEN** it highlights the Inputs button and its copy says missions finish in order and later runs assume all free missions
