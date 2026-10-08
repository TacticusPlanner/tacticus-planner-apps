## Purpose

Lets a signed-in player see where they are in every campaign event and quickly correct their per-track progress, so that daily raid planning uses accurate event nodes.

## ADDED Requirements

### Requirement: Effective track progress and its source

For each campaign event track (`{campaignGroupId, type}`, where type is Standard or Extremis), the page SHALL show the effective progress, resolved separately for regular battles and for challenges:

- regular battles: the manual override's `completedBattleCount` when it is not null, else the synced `campaign-events-progress` entry's `completedBattleCount`, else 0;
- challenges: the manual override's `completedChallengeBattlesIds` when it is not null, else the synced entry's `completedChallengeBattlesIds`, else none.

Each of the two values SHALL carry its source: **Manual** when the override value is used, **Synced** when the synced entry is used, and **No synced data** when neither exists. The page SHALL NOT label a value Synced when no synced entry exists for that track. The source is shown next to the value it describes and does not sit between a label and its count.

This is the same resolution daily raids uses for event-node eligibility (see `daily-raids-today`).

#### Scenario: Manual override wins over synced data

- **GIVEN** the synced entry for `{eventCampaign1, Standard}` has `completedBattleCount: 8`
- **AND** the override for the same track has `completedBattleCount: 12`
- **WHEN** the page renders that track
- **THEN** the regular count is 12 and its source is Manual

#### Scenario: Synced value used when no override exists

- **GIVEN** the synced entry for `{eventCampaign1, Extremis}` has `completedBattleCount: 3` and `completedChallengeBattlesIds: ["AME3B"]`
- **AND** there is no override for that track
- **WHEN** the page renders that track
- **THEN** the regular count is 3 and the challenge count is 1, both with source Synced

#### Scenario: Track with neither synced nor manual data

- **GIVEN** there is no synced entry and no override for `{eventCampaign4, Extremis}`
- **WHEN** the page renders that track
- **THEN** the regular count is 0 and no challenges are completed, both with source No synced data

#### Scenario: Regular and challenge sources are independent

- **GIVEN** the override for `{eventCampaign1, Standard}` sets `completedBattleCount: 20` and leaves `completedChallengeBattlesIds` null
- **AND** a synced entry exists for that track
- **WHEN** the page renders that track
- **THEN** the regular count's source is Manual and the challenges' source is Synced

### Requirement: Current event section

When `live-progress.activeCampaignEventId` identifies an event campaign present in the catalog, the page SHALL show that event first, in its own section headed as the current event, expanded by default. That event SHALL NOT also appear in the event list below. When no campaign event is active, or the active id has no catalog event, the section SHALL be omitted and all events appear in the list.

#### Scenario: An event is active

- **GIVEN** live progress reports `activeCampaignEventId: "eventCampaign6"`
- **WHEN** the page loads
- **THEN** `eventCampaign6` is shown expanded in the current-event section at the top, and it is not repeated in the event list

#### Scenario: No event is active

- **GIVEN** live progress has no active campaign event id
- **WHEN** the page loads
- **THEN** no current-event section is shown and every event appears in the event list

### Requirement: Collapsible event cards with a summary

Every event in the event list SHALL be a card that is collapsed by default and can be expanded and collapsed again. The collapsed card SHALL show the event's icon and localized name and a one-line summary of its effective progress: Standard regular count over total, Extremis regular count over total, and completed challenges over total challenges across both tracks (for example `Standard 12/30 · Extremis 0/30 · Challenges 2/5`), plus an indication of whether any value in the event is Manual or has No synced data. Expanding a card SHALL reveal the per-track editors. Collapsing a card SHALL NOT discard unsaved edits made in it.

#### Scenario: Collapsed summary

- **GIVEN** an event with 30 Standard and 30 Extremis regular battles and 5 challenges in total
- **AND** effective progress is Standard 12, Extremis 0, and 2 challenges completed
- **WHEN** its card is collapsed
- **THEN** the card shows `Standard 12/30 · Extremis 0/30 · Challenges 2/5`

#### Scenario: Collapsing keeps edits

- **GIVEN** the player expands an event card and changes its Standard count
- **WHEN** they collapse the card
- **THEN** the summary shows the edited count and the unsaved-changes bar is still shown

### Requirement: Unfinished events first, with completed events optionally hidden

An event SHALL count as completed when, for each of its Standard and Extremis tracks, the effective regular count equals the track's number of regular battles and every challenge in the track is completed. A track with no battles in the catalog counts as completed. The event list SHALL show unfinished events before completed ones, keeping catalog order within each group. The page SHALL offer a "Hide completed events" option, off by default, that removes completed events from the list. The option SHALL be remembered in this browser across visits. Completion SHALL be evaluated on the current draft, so an event moves between groups as the player edits it. The current event SHALL be shown in its section even when completed and the option is on.

#### Scenario: Ordering

- **GIVEN** catalog order is event A (completed), event B (unfinished), event C (unfinished)
- **WHEN** the page renders the list with "Hide completed events" off
- **THEN** the order is B, C, A

#### Scenario: Hiding completed events is remembered

- **GIVEN** the player turns on "Hide completed events"
- **WHEN** they leave and later return to the page in the same browser
- **THEN** the option is still on and completed events are not listed

#### Scenario: Every event completed with the option on

- **GIVEN** every listed event is completed and "Hide completed events" is on
- **WHEN** the page renders the list
- **THEN** it shows a message that all events are completed, with a way to show them

### Requirement: One compact editor per track

Each expanded track SHALL edit its regular-battle count with a single compact control: decrease and increase steps, a Max action that sets the count to the track's number of regular battles, and a progress bar that also works as a slider (pointer drag and keyboard arrows). The count SHALL be shown as `count/total`. Values SHALL stay within 0 and the total; the decrease step is disabled at 0 and the increase step and Max at the total. There SHALL be no separate number input, slider, or progress bar for the same value. Any change creates or updates the manual override for that value.

A "Reset to synced" action SHALL appear for a value only while it is Manual, and SHALL clear that override value so the value falls back to synced data (or No synced data).

Challenges SHALL be toggled individually. Toggling any challenge makes the track's challenge list Manual.

#### Scenario: Max

- **GIVEN** a Standard track with 30 regular battles and effective count 12 (Synced)
- **WHEN** the player chooses Max
- **THEN** the count becomes 30/30 with source Manual

#### Scenario: Bounds

- **GIVEN** a track's effective count is 0
- **THEN** the decrease step is disabled, and increasing once gives 1

#### Scenario: Reset to synced

- **GIVEN** a track's regular count is Manual 20 and its synced count is 8
- **WHEN** the player chooses "Reset to synced"
- **THEN** the count shows 8 with source Synced and "Reset to synced" is no longer shown for it

#### Scenario: No reset action for a synced value

- **GIVEN** a track's regular count is Synced
- **THEN** no "Reset to synced" action is shown for it

### Requirement: Understandable challenge labels

Challenge nodes SHALL be labelled "Challenge 1", "Challenge 2", … in their node order within the track, localized. The battle's node id (for example `AME7B`) SHALL be available as a tooltip or equivalent accessible description, and each challenge toggle SHALL expose its completed state to assistive technology.

#### Scenario: Labels follow node order

- **GIVEN** a track's challenges are nodes `AME3B`, `AME7B`, `AME11B`
- **WHEN** the track is expanded
- **THEN** they are labelled Challenge 1, Challenge 2, Challenge 3, and hovering or focusing Challenge 2 reveals `AME7B`

### Requirement: Labelled core characters

An expanded event SHALL show all of the event's core characters under a localized "Core characters" label. Characters the player owns SHALL be shown normally; characters the player does not own SHALL be visibly de-emphasised and described as not owned. Events SHALL NOT be hidden or filtered by core-character ownership.

#### Scenario: Unowned core character

- **GIVEN** an event whose core characters are A and B, and the player owns only A
- **WHEN** the event is expanded
- **THEN** both A and B are shown under "Core characters", with B de-emphasised and described as not owned

### Requirement: Sticky unsaved-changes bar

While the draft differs from the saved progress, the page SHALL show an unsaved-changes bar fixed to the bottom of the viewport with Save and Discard. When the draft matches the saved progress again (including after editing a value back), the bar SHALL disappear. The page SHALL have no other Save button.

- Save sends the full draft with the revision it was based on. While saving, Save shows progress and both actions are disabled. On success the bar disappears and a translated success message is shown.
- Discard returns every value to the saved progress.

#### Scenario: Bar appears and disappears

- **GIVEN** there are no unsaved changes
- **THEN** the bar is not shown
- **WHEN** the player increases a count
- **THEN** the bar is shown
- **WHEN** they decrease it back to the saved value
- **THEN** the bar is hidden

#### Scenario: Discard

- **GIVEN** the player changed two tracks
- **WHEN** they choose Discard
- **THEN** both tracks show their saved values and the bar is hidden

#### Scenario: On desktop, the bar spans the content area

- **GIVEN** a viewport at or above 768px
- **WHEN** the bar is shown
- **THEN** it is fixed to the bottom of the viewport within the page content area and does not cover the last event card when scrolled to the end

#### Scenario: On mobile, the bar sits above the bottom navigation

- **GIVEN** a viewport below 768px
- **WHEN** the bar is shown
- **THEN** it is fixed directly above the mobile bottom navigation, does not overlap it, and does not cover the last event card when scrolled to the end

### Requirement: Save conflicts and errors are translated

If the save is rejected because the progress was changed elsewhere (revision conflict), the page SHALL reload the saved progress, drop the draft, and show a translated message explaining that the progress was updated elsewhere and the edits were not saved. If the save fails for any other reason, the page SHALL keep the draft and the unsaved-changes bar and show a translated general save-error message. Raw API error text SHALL NOT be shown.

#### Scenario: Revision conflict

- **GIVEN** the progress was saved from another tab after this page loaded
- **WHEN** the player saves
- **THEN** the page shows the other tab's saved values, the bar is hidden, and the translated conflict message is shown

#### Scenario: Other API error

- **GIVEN** the API rejects the save with a validation error carrying its own message text
- **WHEN** the player saves
- **THEN** the translated general save-error message is shown instead of the API's text, and the edits and bar remain

### Requirement: Leaving with unsaved edits asks first

While there are unsaved changes, navigating to another route inside the app SHALL ask the player to confirm leaving, with options to stay or to leave and lose the changes. Closing or reloading the browser tab SHALL trigger the browser's own leave confirmation. With no unsaved changes, navigation SHALL NOT be interrupted.

#### Scenario: In-app navigation with edits

- **GIVEN** there are unsaved changes
- **WHEN** the player selects another Progress tab
- **THEN** a confirmation asks whether to leave; choosing Stay keeps the page and edits, choosing Leave navigates away and discards them

#### Scenario: Navigation without edits

- **GIVEN** there are no unsaved changes
- **WHEN** the player selects another Progress tab
- **THEN** navigation happens without a confirmation

### Requirement: Loading, failure and empty states

The page SHALL show a loading indicator until the catalog, synced progress and saved overrides are all available. If the synced progress or the saved overrides fail to load, it SHALL show a translated load-error message instead of editors. If the catalog contains no event campaigns, it SHALL show a translated empty-state message.

#### Scenario: Override load failure

- **GIVEN** the saved overrides request fails
- **WHEN** the page loads
- **THEN** a translated load-error message is shown and no editors are rendered

#### Scenario: No events in catalog

- **GIVEN** the catalog has no campaigns with release type event
- **WHEN** the page loads
- **THEN** a translated message states there are no campaign events to track

### Requirement: Responsive layout and tour

The page SHALL be usable without horizontal scrolling at viewports below 768px. On desktop an expanded event SHALL show its Standard and Extremis tracks side by side; on mobile they SHALL stack. On mobile, collapsed summaries MAY wrap onto more than one line but SHALL keep each track's figure intact. The page SHALL have an onboarding tour introducing the current-event section, an event card summary, a track editor, the completed-events option, and the unsaved-changes bar, with steps defined for both desktop and mobile.

#### Scenario: On desktop, tracks are side by side

- **GIVEN** a viewport at or above 768px
- **WHEN** an event is expanded
- **THEN** its Standard and Extremis tracks are shown in two columns

#### Scenario: On mobile, tracks stack

- **GIVEN** a viewport below 768px
- **WHEN** an event is expanded
- **THEN** its tracks are stacked, and the page has no horizontal scroll

#### Scenario: Tour on both forms

- **WHEN** the player starts the page tour on desktop or on mobile
- **THEN** each step highlights an element that is visible in that form
