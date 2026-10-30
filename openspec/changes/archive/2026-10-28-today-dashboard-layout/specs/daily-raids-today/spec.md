## ADDED Requirements

### Requirement: Today lays out its sections as a dashboard

On Dailies › Raids, Today SHALL show, from top to bottom: one controls row, a row of glance tiles (see "Today shows glance tiles"), and a grid of cards: Today's plan, Bonus raids, Shop recommendations, Onslaught and Today's attempts. Each card SHALL be a named region with its own level-2 heading.

The controls row SHALL hold the "Quick filters" caption and its two chips, then the project selector, the Raids Filters trigger and the Planning settings trigger, in that order. When the row is too narrow it SHALL wrap, chips first, without hiding or truncating any control. While a quick filter is on, its one-line note SHALL appear on its own line directly below the row.

The card grid SHALL size its tracks from the width of the page content, not the viewport, so an open or collapsed section menu is accounted for:

- at least 84rem: four equal tracks. Today's plan spans tracks 1–2, the third track stacks Bonus raids then Shop recommendations, and the fourth stacks Onslaught then Today's attempts;
- at least 42rem: two tracks. Today's plan spans both, and the two stacks form the second row side by side in the same pairs;
- below 42rem: one track, with every card stacked.

Cards SHALL keep their own height. A card that sits under another in a stack SHALL start directly below it, and a card that is not rendered SHALL let the next card in its stack move up. The reading and keyboard focus order SHALL be Today's plan, Bonus raids, Shop recommendations, Onslaught, Today's attempts at every track count, and it SHALL match the visual order.

On this page only, the content width cap SHALL be 150rem (2400px) instead of the app's default 100rem (1600px).

Assumptions:

- One resource card needs 20rem to stay readable, so no track is narrower than 20rem except in the one-track layout on a phone.
- The 768px desktop/mobile breakpoint is the app's existing `useIsMobile()` split. Below it this change renders the same cards in the one-track layout; a dedicated mobile form is a separate change.

#### Scenario: Four tracks on a wide monitor

- **GIVEN** a 2560px-wide window with the section menu open
- **WHEN** the user opens Dailies › Raids
- **THEN** the content is at most 2400px wide, Today's plan spans the first two of four tracks, Bonus raids sits above Shop recommendations in the third, and Onslaught sits above Today's attempts in the fourth

#### Scenario: Two tracks on a narrow desktop

- **GIVEN** the page content is between 42rem and 84rem wide (for example a 1024px window with the section menu open)
- **WHEN** Today renders
- **THEN** Today's plan spans the full width, and below it the Bonus raids / Shop recommendations stack and the Onslaught / Today's attempts stack sit side by side

#### Scenario: One track on a phone

- **GIVEN** a 390px-wide viewport
- **WHEN** Today renders
- **THEN** the cards stack in the order Today's plan, Bonus raids, Shop recommendations, Onslaught, Today's attempts, with no horizontal scroll

#### Scenario: Focus order follows the cards

- **WHEN** a keyboard user tabs through Today at any width
- **THEN** focus moves through Today's plan, then Bonus raids, then Shop recommendations, then Onslaught, then Today's attempts

#### Scenario: Missing cards close up

- **GIVEN** there are no Bonus raids entries below the energy limit and no goal needs an Onslaught run today
- **WHEN** Today renders with four tracks
- **THEN** Shop recommendations is at the top of the third track and Today's attempts is at the top of the fourth, with no empty space reserved above them

#### Scenario: Wider cap applies to Raids only

- **WHEN** the user opens Dailies › HSE on the same 2560px window
- **THEN** its content is still capped at 1600px

#### Scenario: Controls wrap without truncation

- **GIVEN** the German UI and a page content width too narrow for the controls on one line
- **WHEN** Today renders
- **THEN** the controls wrap onto a second line, the chips first, and every label is shown in full

#### Scenario: Quick filter note under the row

- **WHEN** the player turns on Bottlenecks
- **THEN** its one-line note appears directly below the controls row

#### Scenario: Tour steps point at the cards

- **WHEN** a user runs the Today tour on desktop or mobile
- **THEN** the schedule step highlights the Today's plan area (Bonus raids in its place at the energy limit), the energy step highlights the Daily energy used tile, the campaign event step highlights the Campaign event tile, and the Today's attempts and Onslaught steps highlight their cards
- **AND** the navigation step highlights the section menu on desktop (its reopen toggle when collapsed) and the section tabs on mobile
- **AND** a step whose card is left out today (Onslaught, or the shop offer groups when nothing is worth buying) is dropped from the tour rather than left without a target

### Requirement: Today shows glance tiles

Today SHALL show a row of glance tiles above the card grid, as a labelled region ("Today at a glance"). Each tile SHALL show a short label above its value, and tiles SHALL be static text, not controls. In order:

1. **Daily energy used**: a progress bar and the rounded percentage from "Today shows real daily energy usage". Once the daily energy limit is reached (the same test Bonus raids uses), the label SHALL read "Energy limit reached" and the bar and tile border SHALL switch to a distinct over-limit colour.
2. **Planned today**: the plan's energy and raid attempt totals ("638 energy · 66 raid attempts"). It SHALL be hidden when Today's plan has no entries and the energy limit is not reached. Once the energy limit is reached, this tile SHALL show the Onslaught tile's label and value instead, and tile 3 SHALL NOT be shown.
3. **Onslaught**: today's whole tokens to spend, from "Today lists today's Onslaught runs". It SHALL be hidden when no goal needs an Onslaught run today.
4. **Campaign event**: the status from "Today states the detected campaign event and its remaining time".

Tiles SHALL take at least 12rem each and wrap onto further rows when there is not room for all of them on one. Tile values SHALL wrap rather than truncate. Tiles 1–3 SHALL render only once Today's raid data is ready. The Campaign event tile SHALL render regardless.

Worked example: daily energy 638, real spend today 663 energy, the plan's totals 638 energy and 66 raids, and two Onslaught runs planned at 1.2 and 0.5 runs. Energy used is 663 ÷ 638 = 103.9%, shown as "104%". That is at or above 100%, so the limit is reached: tile 1 reads "Energy limit reached" with a full bar in the over-limit colour, tile 2 shows "Onslaught" with 1.2 + 0.5 = 1.7, rounded up to "2 tokens", and tile 3 is not shown. Below the limit, at a real spend of 410 energy, tile 1 shows 410 ÷ 638 = 64.3%, rounded to "64%", tile 2 shows "638 energy · 66 raid attempts", and tile 3 shows "2 tokens".

#### Scenario: Tiles in order below the limit

- **GIVEN** the plan has entries, a goal needs an Onslaught run, and the energy limit is not reached
- **WHEN** Today renders
- **THEN** the tiles read Daily energy used, Planned today, Onslaught, Campaign event, in that order

#### Scenario: Over the limit

- **GIVEN** today's real energy spend has reached the daily energy limit
- **WHEN** Today renders
- **THEN** the first tile is labelled "Energy limit reached" with a full bar in the over-limit colour, the second tile shows the Onslaught tokens, and there is no separate Onslaught tile

#### Scenario: No plan

- **GIVEN** Today's plan has no entries and the energy limit is not reached
- **WHEN** Today renders
- **THEN** there is no Planned today tile

#### Scenario: Raids still loading

- **GIVEN** Today's raid data is still loading
- **WHEN** Today renders
- **THEN** only the Campaign event tile is shown

## MODIFIED Requirements

### Requirement: Today uses an icon-led responsive schedule

Today SHALL show the relevant unit portrait for each goal group, icons for energy and raid-attempt statistics, and a goal-type icon for each goal's target: a Rank target SHALL show its goal-type icon paired with its rank icon, with no accompanying text; every other goal kind (Ability, Ascension, Unlock, Level, Upgrade) SHALL show its goal-type icon paired with its existing text label, matching the icon/text treatment used by the Create Goal sheet's goal-type picker. The icon treatment SHALL supplement accessible text rather than replace it, except for the Rank case where the icon pair is the accessible representation (with an accessible name available to assistive technology via the rank icon).

When a goal's only scheduled resource is that same unit's shards, Today SHALL combine the goal identity and shard schedule into one row instead of repeating the portrait and unit name in a separate goal header and resource card.

At or above the 768px breakpoint, Today's goal groups SHALL stack one below the other across the full width of their card, and each group's resource cards SHALL fill that width in as many 20rem columns as fit. A group SHALL NOT be confined to one column because it is the only group. Plan › Schedule keeps its own layout.

#### Scenario: Single shard schedule avoids duplicate identity

- **GIVEN** a goal whose only scheduled resource is the goal unit's shards
- **WHEN** Today renders that goal group
- **THEN** one combined row shows the unit portrait, unit name, target, raid total, and node details without a separate duplicate goal header or shard portrait

#### Scenario: Mobile schedule is compact

- **WHEN** Today is viewed below the 768px mobile breakpoint
- **THEN** goal headings, resource identity, raid totals, and node details are composed as dense rows that minimize vertical space while preserving every label and control

#### Scenario: Desktop schedule fills the page width

- **WHEN** Today is viewed at or above the 768px desktop breakpoint
- **THEN** each goal group's resource cards fill the Today's plan card's width in as many 20rem columns as fit, keeping each card compact rather than stretching a single card across the card

#### Scenario: One goal group fills the plan card

- **GIVEN** today's plan has a single goal group with 11 resource cards, and the Today's plan card is about 1165px wide (four tracks at 2560px)
- **WHEN** Today renders
- **THEN** the 11 cards are laid out in 3 columns, not stacked in one

#### Scenario: Plan › Schedule is unchanged

- **WHEN** the user opens Plan › Schedule
- **THEN** its goal groups and resource cards are laid out as before this change

#### Scenario: Rank goals show the goal-type icon paired with the rank icon

- **GIVEN** a goal group's target is a Rank goal
- **WHEN** Today renders that goal's header
- **THEN** it shows the Rank goal-type icon next to the target rank's icon, with no accompanying text, and exposes the rank as an accessible name

#### Scenario: Non-Rank goals show an icon with text

- **GIVEN** a goal group's target is any goal kind other than Rank
- **WHEN** Today renders that goal's header
- **THEN** it shows that goal kind's icon paired with its existing text label

### Requirement: Bonus Raids

Today SHALL show a Bonus raids card: upgrades or shards that receive zero raids under the real daily energy budget but would receive at least one raid if energy were unlimited. The card's header SHALL say that these raids apply if energy is left. While the daily energy limit is not spent, an upgrade or shard that already receives at least one raid in the real schedule SHALL NOT appear in Bonus Raids; once it is spent, the rule below applies instead. Bonus Raids SHALL be ordered by the same goal-priority order the main schedule uses. Below the limit, when no entry qualifies, the Bonus raids card SHALL NOT be rendered.

Below the limit, Bonus Raids SHALL initially display only the top 3 qualifying entries in that order. When more than 3 entries qualify, Today SHALL show a "Show more" control beneath the visible entries; activating it reveals the remaining entries in place (still in the same order, still grouped by goal per the grouping requirement above) and turns the control into "Show less", which returns to the top 3. The expanded state SHALL NOT be stored in the URL.

Once the real energy spent today (from the player's synced attempts, the same figure Today's energy tile shows) reaches or exceeds the daily energy limit (`planningSettings.dailyEnergy`), Bonus Raids SHALL be the only raids list on Today: the Today's plan card SHALL NOT be shown, and the Bonus raids card SHALL take its place in the dashboard (the same tracks, the same card grid inside goal groups), with a short caption as the first line of its body stating that the daily energy limit has been reached. Bonus Raids SHALL then list every raid still open today rather than only the upgrades and shards the real schedule left unraided: today's schedule recomputed with unlimited energy and with each node's raids capped at the player's real attempts left today, so an upgrade or shard the real schedule already raided keeps its remaining farming, in goal-priority order ahead of lower-priority goals. A node whose real attempts-left data is unavailable keeps its full daily attempt cap. For such a capped node, the attempts left stand in for its daily attempt cap when the row decides whether to show "N upgrades left" (Today's raid schedule shows what is left to farm). The Bonus Raids entries keep the same goal grouping, goal-priority order and exhausted-node exclusion described above, and SHALL all be shown, with no top-3 truncation and no "Show more" control. When the limit is reached and no Bonus Raids entry remains, the Bonus raids card SHALL still be shown, with a caption stating that the limit is reached and no bonus raids are left. Below the limit, Today's plan and Bonus Raids render unchanged, except that when Today's plan has no entries but Bonus Raids do, the Bonus raids card SHALL take the plan's place (top 3 with "Show more", no limit caption) instead of sitting beside an empty plan card. When no synced attempt data is available the energy spent is 0, so Today renders unchanged; a daily energy limit of 0 or less is treated as no limit. The Raids Plan tab is unaffected.

Assumptions:

- Energy spent today is the account-wide real spend from synced attempts at standing campaign nodes (Today's "Today shows real daily energy usage" requirement); it is not capped at the limit.
- The daily energy limit is `planningSettings.dailyEnergy` (default 288 when unset).
- Below the limit, Bonus Raids are computed from an unlimited energy budget at each node's full daily attempt cap. Once the limit is reached they are the raids left today: an unlimited energy budget with each node capped at the player's real attempts left (`live-progress.battleAttempts[].attemptsLeft`, standing and event-campaign nodes alike). The Planned today tile is replaced by the Onslaught tile at the limit (see "Today shows glance tiles").
- A node's daily attempt cap is shared by every goal and material raided there, in goal-priority order; the real attempts left lower that shared cap.
- Upgrades already farmed today are counted through the synced inventory, so each goal's remaining need already reflects them.

#### Scenario: A zero-raid upgrade appears as a bonus raid

- **GIVEN** an upgrade has an in-scope goal need but the real energy budget is exhausted before any raid against it is planned, while an unlimited budget would raid it at least once
- **WHEN** Today loads
- **THEN** that upgrade appears in Bonus Raids, listing the node(s) and raid count an unlimited budget would have used

#### Scenario: A partially-raided upgrade is excluded from Bonus Raids

- **GIVEN** an upgrade receives at least one raid in the real schedule but not enough to fully clear its need, and the daily energy limit is not yet spent
- **WHEN** Today loads
- **THEN** that upgrade does not appear in Bonus Raids, even though additional energy would raid it further

#### Scenario: Bonus Raids ordering

- **GIVEN** two or more upgrades qualify for Bonus Raids, belonging to goals of different priority
- **WHEN** Today loads
- **THEN** Bonus Raids lists them in the same goal-priority order as the main schedule, not by any other ranking

#### Scenario: Bonus Raids truncated to top 3 with a Show more control

- **GIVEN** more than 3 entries qualify for Bonus Raids and the energy limit is not spent
- **WHEN** Today loads
- **THEN** only the first 3 entries (in goal-priority order) are shown, followed by a "Show more" control, and the remaining entries are not rendered until that control is activated

#### Scenario: Show more reveals the rest

- **GIVEN** Bonus Raids is showing its truncated top-3 view with a "Show more" control
- **WHEN** the user activates "Show more"
- **THEN** the remaining qualifying entries are revealed in place, in the same goal-priority order, still grouped by goal, and the control reads "Show less"
- **AND WHEN** the user activates "Show less"
- **THEN** only the first 3 entries are shown again

#### Scenario: 3 or fewer entries need no truncation

- **GIVEN** 3 or fewer entries qualify for Bonus Raids
- **WHEN** Today loads
- **THEN** all qualifying entries are shown and no "Show more" control is displayed

#### Scenario: No bonus raids available

- **GIVEN** the energy limit is not spent and no upgrade or shard qualifies for Bonus Raids (every farmable need is either fully covered by the real schedule or would still receive zero raids even with unlimited energy)
- **WHEN** Today loads
- **THEN** no Bonus raids card is rendered, and the next card in its stack moves up

#### Scenario: Bonus Raids become the only list once the energy limit is spent

- **GIVEN** the daily energy limit is 288 and the player's synced attempts today have spent 288 energy, and Bonus Raids has entries at nodes with attempts left
- **WHEN** Today loads
- **THEN** the Today's plan card is not shown, and the Bonus raids card takes its place as the only raids list, captioned that the daily energy limit has been reached

#### Scenario: Bonus Raids keep the top-3 truncation after the limit is spent

- **GIVEN** the energy limit is spent and 6 Bonus Raids entries have a node that is not exhausted
- **WHEN** Today loads
- **THEN** the top-3 truncation no longer applies: Bonus Raids shows all 6 entries in goal-priority order, with no "Show more" control

#### Scenario: Below the energy limit nothing changes

- **GIVEN** the daily energy limit is 288 and the player's synced attempts today have spent 287 energy
- **WHEN** Today loads
- **THEN** Today's plan and Bonus Raids are both shown as before, with no limit-reached caption

#### Scenario: Empty plan below the limit

- **GIVEN** the energy limit is not spent, Today's plan has no entries, and 4 entries qualify for Bonus Raids
- **WHEN** Today loads
- **THEN** the Today's plan card is not shown, and the Bonus raids card takes its place with the top 3 entries, a "Show more" control and no limit-reached caption

#### Scenario: No synced attempts leave Today unchanged

- **GIVEN** no synced attempt data is available for today
- **WHEN** Today loads
- **THEN** the energy spent is 0, and Today's plan and Bonus Raids are shown as before

#### Scenario: Limit spent with no bonus raids left

- **GIVEN** the energy limit is spent and no Bonus Raids entry remains
- **WHEN** Today loads
- **THEN** the Today's plan card is not shown, and the Bonus raids card in its place says the daily energy limit is reached and no bonus raids are left

#### Scenario: Worked example, the top goal keeps its farming after the limit

- **GIVEN** the daily energy limit is 30 and the player's synced attempts today have spent 30 energy (3 raids at node B1, 10 energy each, daily cap 5, so 2 attempts are left)
- **AND** the top-priority goal (Snappa, Rank D1) still needs 8 of upgrade U1, dropped at B1 (1 per raid), and the second goal (Patermine, Rank B1) needs 2 of upgrade U2, dropped at node B2 (10 energy, cap 5, 1 per raid, no attempts used)
- **WHEN** Today loads
- **THEN** the real schedule at 30 energy would raid B1 3 times for U1 (30 energy), so the below-limit Bonus Raids would list only U2
- **AND** because the limit is spent, Bonus Raids instead list the raids left today: Snappa first with U1 at B1 for min(5 cap, 2 left) = 2 raids (8 − 2 = 6 still needed afterwards), then Patermine with U2 at B2 for min(5 cap, ⌈2 ÷ 1⌉ = 2) = 2 raids, 40 energy in all
- **AND** B1 shows no "N upgrades left" label, since its 2 planned raids reach its 2 attempts left

#### Scenario: A partly-raided upgrade stays in Bonus Raids after the limit

- **GIVEN** the energy limit is spent, and an upgrade received at least one raid in the real schedule but its node still has real attempts left today
- **WHEN** Today loads
- **THEN** that upgrade appears in Bonus Raids under its goal, at that node

#### Scenario: Raids left today respect the real attempts left

- **GIVEN** the energy limit is spent and a node with a daily cap of 5 has 2 real attempts left today
- **WHEN** Today loads
- **THEN** Bonus Raids plan at most 2 raids there across all goals, and a node with no real attempts left gets none

### Requirement: Today's Attempts section

Today SHALL show a "Today's attempts" card (see "Today lays out its sections as a dashboard"), listing every campaign node — standing (standard/mirror/elite/eliteMirror) or event-campaign — the player has actually raided today — real synced attempts (`live-progress.battleAttempts[].attemptsUsed > 0`), account-wide, not scoped to the current project's schedule or Bonus Raids. Each listed location SHALL show its real numeric raid count today (`attemptsUsed`), including when its real synced attempts remaining are zero. An event-campaign attempt record is matched to its battle by campaign group, `type` (Standard/Extremis), and battle index, distinguishing the two tiers rather than excluding them.

Each location SHALL be one compact row: the material icon, the campaign icon, the campaign name and node label on one line that wraps rather than truncates, and the attempts used ("6 attempts") at the end of the row. The material's name SHALL be part of the row's accessible name. The card's header SHALL show the number of rows and the total attempts used ("5 nodes · 29").

#### Scenario: An attempted location appears in Today's Attempts

- **GIVEN** the player has real synced attempts today at a standing-campaign node
- **WHEN** Today loads
- **THEN** that location appears in the Today's attempts card as one row showing its real raid count today

#### Scenario: An attempted event-campaign location appears in Today's Attempts

- **GIVEN** the player has real synced attempts today at an event-campaign node (for example, 6 raids at a node in the "Adepta Sororitas" event campaign's Standard tier)
- **WHEN** Today loads
- **THEN** that location appears in the Today's attempts card showing its real raid count today, the same as a standing-campaign location would

#### Scenario: An exhausted location shows a numeric actual count

- **GIVEN** a location listed in Today's Attempts has zero real attempts left today and a positive real number of attempts used
- **WHEN** Today loads
- **THEN** that location's entry shows the numeric attempts-used value and not "Max raids"

#### Scenario: Today's Attempts includes locations unrelated to the current project

- **GIVEN** the player has real synced attempts today at a standing-campaign node with no relevance to the current project's schedule or Bonus Raids
- **WHEN** Today loads
- **THEN** that location still appears in Today's Attempts

#### Scenario: Header totals

- **GIVEN** the player has raided 5 nodes today, with 6, 6, 10, 5 and 2 attempts
- **WHEN** Today loads
- **THEN** the Today's attempts header shows 5 nodes and 6 + 6 + 10 + 5 + 2 = 29 attempts

#### Scenario: No attempts recorded yet today

- **GIVEN** the player has no real synced attempts recorded yet today
- **WHEN** Today loads
- **THEN** the Today's attempts card shows an explicit empty state, not a blank or hidden card

### Requirement: Today shows real daily energy usage

Today SHALL show, in its Daily energy used glance tile, a progress indicator reflecting the percentage of the player's configured daily energy (`planningSettings.dailyEnergy`) actually spent today, computed from the player's real synced attempt counts (not the plan's simulated schedule) across every campaign node on the account — standing or event-campaign, including nodes unrelated to the currently selected project — each priced at that node's energy cost. This percentage SHALL NOT be capped at 100%. The bar itself fills to at most 100%, and its accessible value text SHALL state the uncapped percentage. Once the daily energy limit is reached, the tile SHALL switch to its over-limit state (see "Today shows glance tiles").

An event-campaign attempt's energy cost is included using the same per-node pricing as a standing-campaign attempt, resolved to the correct tier (Standard vs Extremis) via the attempt record's `type`.

#### Scenario: Usage reflects real attempts across the whole account

- **GIVEN** the player has real synced attempts recorded today at standing-campaign nodes outside the current project's schedule
- **WHEN** Today loads
- **THEN** the energy-usage indicator includes those attempts' energy cost in its total, not only attempts at nodes within this project's schedule

#### Scenario: Event-campaign attempts are included in the total, priced the same as standing attempts

- **GIVEN** the player has real synced attempts recorded today at an event campaign's nodes
- **WHEN** Today loads
- **THEN** the energy-usage indicator's total includes those event-campaign attempts' energy cost, priced the same way a standing-campaign attempt's cost is

#### Scenario: Usage can exceed the daily energy budget

- **GIVEN** the player's real total energy cost from today's synced attempts exceeds their configured daily energy setting
- **WHEN** Today loads
- **THEN** the energy-usage indicator shows a percentage above 100%, uncapped, its accessible value text states that percentage, and the tile is in its over-limit state

#### Scenario: No real usage yet today

- **GIVEN** the player has no recorded real attempts yet today
- **WHEN** Today loads
- **THEN** the energy-usage indicator shows 0%

#### Scenario: Real usage data is part of Today's readiness gate

- **GIVEN** the player's real synced attempt data has not yet loaded
- **WHEN** Today would otherwise render
- **THEN** Today defers rendering the energy-usage indicator until that data is available, consistent with how Today already gates rendering on its other required data sources

### Requirement: Today states the detected campaign event and its remaining time

Today SHALL show a campaign-event status reporting the campaign event it has detected as active and, only when the active calendar occurrence is confirmed, how long remains until that event ends. The status SHALL be a glance tile labelled "Campaign event" whose value is the detected event — its campaign icon, its name, and its end-time status. The value SHALL wrap rather than truncate.

The detected campaign event SHALL be the one named by `live-progress.activeCampaignEventId`, rendered by that campaign group's localized display name. This is the same signal that governs which event-campaign nodes are farmable (see "Only the active campaign event is farmable"), so the status line and Today's schedule can never disagree about whether an event is active.

When `live-progress.activeCampaignEventId` is present but does not resolve to a known campaign group, the status line SHALL still report that a campaign event is active, using generic copy in place of the name, and SHALL NOT display the raw group id. It SHALL NOT report that no campaign event is active, because Today is gating event-node eligibility on that id regardless of whether a display name exists for it. Failure to resolve a name SHALL degrade the status line only — it SHALL NOT prevent Today from rendering.

When `live-progress.activeCampaignEventId` is absent or null, the status line SHALL state that no campaign event is active, regardless of what the events calendar shows for the current instant. Today's schedule excludes every event-campaign node in exactly that situation, so the status line SHALL NOT claim an event is active that Today will not schedule.

The remaining time SHALL be taken from the `endUtc` of a `confirmed: true` events-calendar entry for the `campaign-event` definition whose window contains the current instant, rendered as localized relative time at the same coarseness the app's other remaining-time displays use. If that window is a `confirmed: false` projection, the status line SHALL keep the detected event identity and state that its end time is not confirmed, without a numeric remaining-time phrase. When no such calendar entry is active, the status line SHALL name the detected campaign event and omit the remaining time rather than showing an estimated, stale, or zero duration.

Assumptions this requirement depends on:

- `live-progress.activeCampaignEventId` is a campaign group id, and a campaign group's display name is the same for both of its tiers — the status line names the event, not a tier.
- That id originates in synced player data, not the catalog, so the catalog may not yet carry a display name for a campaign event that has already gone live in game.
- At most one `campaign-event` calendar entry is active at any instant.
- `campaign-event` calendar entries may be projected placeholders rather than authored occurrences. A projected boundary is the catalog's best-known schedule, not a guarantee from the game; the served `confirmed` flag distinguishes it from an authored occurrence.

#### Scenario: An event is detected and the calendar knows when it ends

- **GIVEN** `live-progress.activeCampaignEventId` names the Adepta Sororitas event campaign group
- **AND** a confirmed `campaign-event` calendar entry's window contains the current instant and ends in three days
- **WHEN** Today loads
- **THEN** the status line names "Adepta Sororitas" and states that it ends in three days

#### Scenario: The active window is only projected

- **GIVEN** `live-progress.activeCampaignEventId` names a known event campaign group
- **AND** the only active `campaign-event` entry is unconfirmed and its projected `endUtc` is three hours away
- **WHEN** Today loads
- **THEN** the status line names the detected event and states that the end time is not confirmed, without saying it ends in three hours

#### Scenario: No campaign event is detected

- **GIVEN** `live-progress.activeCampaignEventId` is absent or null
- **WHEN** Today loads
- **THEN** the status line states that a campaign event is not active, and no campaign name or remaining time is shown

#### Scenario: The calendar shows an event but none is detected

- **GIVEN** `live-progress.activeCampaignEventId` is absent or null
- **AND** a `campaign-event` calendar entry's window contains the current instant
- **WHEN** Today loads
- **THEN** the status line still states that a campaign event is not active, matching Today's schedule, which excludes every event-campaign node in this situation

#### Scenario: A detected event id has no known display name

- **GIVEN** `live-progress.activeCampaignEventId` names a campaign group the catalog does not recognize
- **WHEN** Today loads
- **THEN** the status line reports that a campaign event is active without naming it, shows remaining time only if the calendar has a confirmed active window, does not display the raw group id, and Today renders normally rather than failing

#### Scenario: An event is detected but the calendar has no active window

- **GIVEN** `live-progress.activeCampaignEventId` names a campaign event group
- **AND** no `campaign-event` calendar entry's window contains the current instant
- **WHEN** Today loads
- **THEN** the status line names that campaign event and omits the remaining time, rather than showing an expired, zero, or estimated duration

#### Scenario: A detected event shows its campaign icon

- **GIVEN** `live-progress.activeCampaignEventId` resolves to a known campaign group
- **WHEN** Today renders the Campaign event tile
- **THEN** the detected event's campaign icon renders beside its name

#### Scenario: On mobile the status block sits below the energy-usage row

- **GIVEN** Today is viewed below the mobile breakpoint
- **WHEN** Today renders its glance tiles
- **THEN** the Campaign event tile comes after the Daily energy used tile in reading order, as a tile of its own

#### Scenario: On desktop the status block takes half the header

- **GIVEN** Today is viewed at or above the mobile breakpoint
- **WHEN** Today renders its glance tiles
- **THEN** the Campaign event tile is the last tile in the glance row, at the same size as the other tiles; there is no separate header block

#### Scenario: A long event status wraps

- **GIVEN** the German UI and a detected event whose status does not fit on one line of its tile
- **WHEN** Today renders the Campaign event tile
- **THEN** the status wraps onto further lines and is shown in full

#### Scenario: The status line is part of Today's guided tour

- **GIVEN** a user starts Today's guided tour on either a mobile or a desktop viewport
- **WHEN** the tour reaches the campaign-event status
- **THEN** it highlights the Campaign event tile with its own step explaining what the detected campaign event governs and why an unconfirmed end has no countdown

### Requirement: Today lists today's Onslaught runs

The Raids tab SHALL show an "Onslaught" card in the dashboard (see "Today lays out its sections as a dashboard"), listing one row per unit that today's plan spends Onslaught tokens on, with its expected runs and shards, in goal-priority order. The runs SHALL come from the same plan run as Today's raids, so tokens are shared across goals in priority order exactly as Plan > Schedule's day 1 shows them. The card header SHALL show the whole tokens to spend today: the sum of the rows' expected runs, rounded up. The Onslaught glance tile SHALL show the same whole-token total. When no goal needs an Onslaught run today, neither the card nor the tile SHALL be shown. Raids Filters SHALL NOT affect it.

Assumptions:

- One Onslaught run costs one token, and the plan spends at most the catalog's Onslaught runs per day.
- Expected runs are fractional because shard drops per run are an expectation, not a guarantee.

Worked example: goal g1 (priority 1, Bellator) is planned 1.2 runs for 6 expected shards and goal g2 (priority 2, Aleph-Null) 0.5 runs for 2 expected shards. The rows are Bellator "≈1.2 runs · 6 shards", then Aleph-Null "≈0.5 runs · 2 shards", and the header and the tile show 1.2 + 0.5 = 1.7, rounded up to 2 tokens.

#### Scenario: Runs are listed in goal priority

- **GIVEN** today's plan spends Onslaught tokens on two goals' units
- **WHEN** the user opens Raids
- **THEN** the Onslaught card lists the higher-priority goal's unit first, each row with its expected runs and shards

#### Scenario: Nothing to run

- **GIVEN** no goal needs an Onslaught run today
- **THEN** the Raids tab has no Onslaught card and no Onslaught tile

#### Scenario: Tour step

- **WHEN** the user runs the Today tour with the Onslaught card shown
- **THEN** a localized step explains the card, on desktop and mobile

## REMOVED Requirements

### Requirement: Today lays out its groups side by side when there is room

**Reason**: Replaced by "Today lays out its sections as a dashboard". The three auto-fit lanes left a wide monitor half empty while the page still scrolled, and Shops and Onslaught sat below them out of view.

**Migration**: Today's plan, Bonus raids and Today's attempts become cards in the dashboard grid, next to Shop recommendations and Onslaught. No data or URL change.
