## Purpose

Defines the Dailies HSE tab: how the single active (or next upcoming) Home Screen Event is derived from the game events calendar, how raid points per event are computed, and the event-optimised farm list, best locations, header controls, previews and empty states. Today and Plan stay event-agnostic.

## Requirements

### Requirement: At most one Home Screen Event is active, derived from the calendar

The system SHALL determine the active Home Screen Event (HSE) from the game-events calendar: the entry whose definition `type` is `HomeScreenEvent` and whose window contains the current instant, compared in UTC with `startUtc` inclusive and `endUtc` exclusive. The player's local timezone SHALL NOT affect whether an event is active. No manual selection SHALL be required. The system assumes at most one HSE is active at a time; if calendar data has several active (stale or erroneous records), it SHALL select an HSE that has a raid-point rule over one that has none, then the one with the latest `startUtc`, then the lowest definition id. Scores of several events SHALL NOT be summed.

#### Scenario: Event inside its window

- **GIVEN** an `hse-machine-hunt` entry from 2026-10-02T08:00:00Z to 2026-10-06T08:00:00Z
- **WHEN** the current time is 2026-10-06T07:59:59Z
- **THEN** Machine Hunt is the active HSE

#### Scenario: Boundary is exclusive at the end

- **WHEN** the current time is exactly 2026-10-06T08:00:00Z
- **THEN** Machine Hunt is not active

#### Scenario: Timezone independence

- **GIVEN** a device in UTC-10 whose local time is 2026-10-01 22:00 (2026-10-02T08:00Z)
- **THEN** the event starting 2026-10-02T08:00:00Z is active

#### Scenario: Overlap of two rule-bearing events

- **GIVEN** Warp Surge (starting 2026-08-09) and Machine Hunt (starting 2026-08-11), both with rules, are active on 2026-08-12
- **THEN** the later-starting event is the active HSE and only it is used

#### Scenario: Rule-bearing beats non-rule on overlap

- **GIVEN** Warp Surge (has a rule, starts 2026-08-09) and Arsenal of War (no rule, starting the same day or later) are both active (stale 2026-08-09 data)
- **THEN** Warp Surge is the active HSE

#### Scenario: No HSE running

- **WHEN** no HSE entry's window contains now
- **THEN** there is no active HSE; the next upcoming HSE, if any, is known and is what the HSE tab previews (see "The HSE tab previews the next event")

### Requirement: Raid points per HSE follow V1's rules

For a campaign battle, the points per raid of a rule-bearing HSE SHALL be the count of matching enemies multiplied by 3, or by 5 when the battle `type` is `Elite` or `EliteMirror`. Enemies whose npc has the trait `Summon` or `Steppable` SHALL NOT count. Matching is per enemy through its npc record: Warp Surge - alliance Chaos; Machine Hunt - trait `Mechanical`; Training Rush - every enemy; Purge Order - faction `Tyranids`. The per-energy score is points per raid divided by the battle's `energyCost`. An HSE with no rule (for example Faction Boost, Squig Smash, Arsenal of War, the 11th-edition weeks, trait boosts) has no raid points. An enemy id that cannot be resolved counts as zero.

#### Scenario: Elite Machine Hunt node

- **GIVEN** an Elite battle with 4 Mechanical enemies and energy cost 10
- **THEN** its Machine Hunt score is (4 x 5) / 10 = 2 per energy

#### Scenario: Summons and steppables excluded

- **GIVEN** a Standard battle with 3 Mechanical enemies, one of them with the trait Summon, cost 6
- **THEN** its score is (2 x 3) / 6 = 1

#### Scenario: Purge Order

- **GIVEN** a Standard battle with 5 Tyranid enemies and energy cost 5
- **THEN** its Purge Order score is (5 x 3) / 5 = 3

#### Scenario: Event with no raid points

- **GIVEN** Faction Boost is the active HSE
- **THEN** no battle has an HSE score and no event-point sections are shown

### Requirement: Event points affect only the HSE tab's farm list

Event points SHALL NOT change Today, Bonus Raids, the Home raids widget or the Raids Plan in any way: they SHALL NOT change which resources a goal needs, which node is scheduled, the order of raids or the day's energy spend there. On the HSE tab only, the farm list (next requirement) SHALL choose point-earning locations even when a cheaper location without points exists for the same material, and SHALL say so in the UI; it SHALL still never change which resources a goal needs and SHALL never schedule more energy than the player has left today.

#### Scenario: Today unchanged by an active event

- **GIVEN** Machine Hunt is active
- **THEN** Today's schedule equals the schedule with no active event

#### Scenario: The farm list may cost more energy per item than Today

- **GIVEN** the cheapest node for a needed material earns no event points and a pricier node for the same material does
- **THEN** the farm list contains the pricier point-earning node, Today keeps the cheaper node, and the farm list carries the note that it spends energy on point-earning nodes even when a cheaper non-point node exists

### Requirement: The farm list covers the whole schedule and is filled to the energy budget

The HSE tab's main list, titled "Farm list for event points", SHALL be computed over the whole schedule, not from Today's picks. The scope SHALL be the active goals of the Dailies project selection (no selection: every Active goal in global priority order; Paused goals do not plan; a goal in several projects counts once), and the need SHALL be each goal's remaining need over all of its stages after the Plan's priority-ordered inventory allocation, summed per resource.

A location SHALL be a candidate only when all of these hold: (1) it earns event points for the active rule (points per raid greater than 0); (2) it is unlocked by the player's campaign progress, has an energy cost above 0 and has attempts left today (the synced attempts left when known, otherwise the node's daily cap, where a cap of 0 means unlimited); (3) it drops a resource that an in-scope goal still needs somewhere in the schedule, where a goal that pins its farm locations is served only by the pinned ones; (4) it passes the persisted Raids Filters, evaluated with the resource it drops.

The energy budget SHALL be the planning-settings daily energy minus the energy the player has really spent today across all campaigns, never below 0. Candidates SHALL be ordered by points per raid divided by energy cost, descending; ties by points per raid descending, then the best (lowest) priority among the goals the location serves, then battle id ascending. The list SHALL be filled in that order: each location gets as many raids as the attempts left, the remaining budget and the remaining need allow (the need is reduced by what earlier locations already farm, so two locations dropping the same resource do not farm it past the need); a location that does not fit is skipped and later candidates are still considered. Locations with no raids SHALL NOT be shown. The day total badges SHALL show the sum of row points and the sum of row energy, and the energy total SHALL never exceed the budget.

#### Scenario: Only point-earning, goal-contributing locations

- **GIVEN** five unlocked locations: one with 0 points, one that drops nothing any goal needs, one whose attempts are all used today, and two that qualify
- **THEN** the list shows only the two that qualify

#### Scenario: Whole schedule, not Today's picks

- **GIVEN** a goal needs a material in a later stage that Today's plan does not farm yet, and a point-earning node drops it
- **THEN** that node is a candidate

#### Scenario: Ordering and tie-breaks

- **GIVEN** location A with 12 points at energy 6 (ratio 2) and B with 15 points at energy 10 (ratio 1.5)
- **THEN** A is listed before B; with equal ratio the location with more points per raid is first, then the better goal priority, then the lower battle id

#### Scenario: Filled until the budget is used

- **GIVEN** 100 energy left today and locations costing 30 each ordered by ratio
- **THEN** the first three get raids (90 energy), the energy badge shows 90, and the total never exceeds 100

#### Scenario: Skipped location does not stop the fill

- **GIVEN** 20 energy left, the best-ratio location costs 30 and the next costs 10
- **THEN** the 30-energy location is skipped and the 10-energy one is listed

#### Scenario: Spent energy and used attempts reduce the list

- **GIVEN** daily energy 240, 90 energy really spent today, and 2 of a node's 3 attempts used
- **THEN** the budget is 150 and that node gets at most 1 raid

#### Scenario: Raids capped by need

- **GIVEN** a node would drop the needed material at 1 per raid and 3 are still needed
- **THEN** it is given 3 raids at most, even with budget left

#### Scenario: Changing daily energy changes the list

- **WHEN** the player changes the daily energy in the Planning Settings opened from the HSE tab
- **THEN** the budget and the farm list change accordingly

#### Scenario: Filter-then-pick

- **GIVEN** a Raids Filter excludes the highest-ratio location
- **THEN** it is not a candidate and the list is filled from the remaining passing locations; no material is reported as filtered out

### Requirement: The HSE tab shows the farm list and the best locations

When a rule-bearing HSE is active (or previewed, see "The HSE tab previews the next event"), the HSE tab SHALL show the event's name, remaining time and text that it earns points from campaign raiding; then (a) the farm list per the requirements above; then (b) a separate goal-independent list of the top 10 locations overall by event points per energy, and (c) while a campaign event is active (`live-progress.activeCampaignEventId` is set) a second list of the top 10 by the same ranking limited to battles of that active event campaign. Event-campaign battles (including Extremis) SHALL enter (a), (b) and (c) only while their campaign is the active campaign event and the player has reached them (the existing `availableCampaignBattles` eligibility); (c) SHALL NOT be shown without an active campaign event. A location in (b) or (c) SHALL be unlocked by the player's campaign progress, SHALL NOT have been raided today (no attempt used today) and SHALL pass the persisted Raids Filters (`daily-raids-filters`, evaluated without a material). Ties order by higher points per raid, then lower energy cost. Locations scoring zero SHALL NOT appear. Each row of (b) and (c) SHALL also show the node's reward when it has a non-gold drop: the drop icon from the catalog node-to-drop index with a tooltip/accessible label naming the resource (the unit shard icon for shard drops), and nothing extra when it has none. Each list has at most 10 entries and fewer when fewer qualify; an event battle MAY appear in both (b) and (c).

#### Scenario: Top-10 row shows the node reward

- **GIVEN** a top-10 node whose drop is an upgrade material, another whose drop is a unit shard, and a third with only gold
- **THEN** the first shows the material icon with its label, the second the unit shard icon, the third nothing extra

#### Scenario: Top 10 excludes locked and raided locations

- **GIVEN** the highest-scoring location is not unlocked and the second-highest was raided today
- **THEN** neither appears in the top 10, and the list holds the next best qualifying locations, at most 10

#### Scenario: Top 10 honors the Raids Filters

- **GIVEN** a Raids Filter excludes the highest-scoring location
- **THEN** it does not appear in either top 10 and the lists hold the next best passing locations

#### Scenario: Top 10 ignores goals and the energy budget

- **GIVEN** the best-scoring location drops nothing any goal needs
- **THEN** it still appears in the top 10 and is absent from the farm list

#### Scenario: Event-campaign top 10 while an event is active

- **GIVEN** `activeCampaignEventId` is set and the player has reached nodes of that event campaign
- **THEN** the event-campaign list shows only that campaign's battles, ranked as specified, and the overall list may also contain them

#### Scenario: No campaign event active

- **GIVEN** no `activeCampaignEventId`
- **THEN** no event-campaign battle appears anywhere and the event-campaign list is not shown

#### Scenario: Filter excludes every location

- **GIVEN** a Raids Filter that no eligible location passes
- **THEN** each shown top-10 list shows a message that no location matches the Raids Filters, with a Reset action

#### Scenario: Fewer than 10 qualify

- **GIVEN** only 4 unlocked, un-raided locations have a score above zero
- **THEN** 4 locations are listed

### Requirement: The HSE tab handles states with no usable event

The HSE tab SHALL always be reachable. With no active HSE and a known upcoming HSE it SHALL show that event's name, its start date and a "starts in ..." countdown (and, when that event has a raid-point rule, the preview of the next requirement). With no active and no upcoming HSE it SHALL say no event is scheduled. With an active HSE that has no raid-point rule it SHALL show the event name and remaining time and say it does not earn points from campaign raiding, without the farm list or any top-10 list. While the calendar loads it SHALL show a loading state; on a calendar read failure it SHALL show an inline message that event data could not be loaded and SHALL NOT block the page. An upcoming event SHALL NOT change Today, Bonus Raids, the Home raids widget or the Raids Plan.

#### Scenario: No event, next one known without a rule

- **GIVEN** no HSE is active and Faction Boost (no raid-point rule) starts in 30 hours
- **THEN** the tab shows "Faction Boost", its start date and the countdown, and no farm list, top-10 lists, preview banner or header controls

#### Scenario: Nothing scheduled

- **GIVEN** no active or upcoming HSE in the calendar
- **THEN** the tab says no event is scheduled

#### Scenario: Active event without raid points

- **GIVEN** Faction Boost is active with 3 days left
- **THEN** the tab shows its name and remaining time and that it does not earn points from campaign raiding

#### Scenario: Calendar read fails

- **THEN** the HSE tab shows an inline error and the rest of Dailies is unaffected

### Requirement: HSE tab layout and localization

On desktop (at or above 768px) the farm list SHALL sit beside a column holding the overall top-10 list and, when shown, the event-campaign top-10 list below it; on mobile they SHALL stack in the order farm list, overall top 10, event-campaign top 10. The tab label SHALL be the localized abbreviation of Home Screen Event in en, de, es and fr, with a description that spells it out, and all HSE-tab strings and the event names for every definition id SHALL exist in all four locales.

#### Scenario: Mobile layout

- **WHEN** the viewport is below 768px and a rule-bearing HSE is active
- **THEN** the overall top-10 list is rendered below the farm list, and the event-campaign list (when shown) below the overall list

#### Scenario: Locale coverage

- **WHEN** translation-coverage tests run
- **THEN** every new key exists in en, de, es and fr

### Requirement: The farm list shows its locations, goals and totals

Each row of the farm list SHALL show the location (icon, campaign, tier and node), raids to do, expected event points (points per raid times raids), energy (energy cost times raids), the goals it serves as round unit/character icons (the icon component Today and Raids use for goal units; one per distinct goal, in goal-priority order; for a shard goal the unit, for an upgrade goal the goal's unit) and the drop icon of the needed resource it drops. At most 4 goal icons SHALL be visible; additional goals SHALL collapse into a "+N" indicator, and the icon group SHALL have an accessible name and tooltip listing all serving goals including those hidden by the overflow. The list header SHALL show total points and total energy badges and a note that the list spends energy on point-earning nodes even when a cheaper non-point node exists, so it can cost more energy per item than Today.

#### Scenario: Few goals

- **GIVEN** a row served by two goals
- **THEN** two unit icons are shown, with an accessible name naming both goals

#### Scenario: Overflow

- **GIVEN** a row served by six goals
- **THEN** four icons and "+2" are shown, and the accessible name/tooltip lists all six goals

#### Scenario: Totals

- **GIVEN** shown rows of 36 points / 30 energy and 12 points / 20 energy
- **THEN** the badges show 48 points and 50 energy

### Requirement: The farm list handles empty cases

When the farm list has no rows it SHALL say why: no active goals in scope; no energy budget (the daily energy is 0 or all of it is spent, also when less energy is left than any candidate costs); nothing contributes (no point-earning, unlocked location with attempts left drops a resource the goals need), with a pointer to the top-10 lists below; or, when Raids Filters are active and candidates exist without them, that no location matches the Raids Filters, with a Reset action. The status line and both top-10 lists SHALL still render in every case.

#### Scenario: No active goals

- **GIVEN** the project selection has no Active goal
- **THEN** the farm list says there are no active goals

#### Scenario: No energy

- **GIVEN** the planning-settings daily energy is fully spent today
- **THEN** the farm list says there is no energy left

#### Scenario: Nothing contributes

- **GIVEN** no point-earning location drops a resource the goals need
- **THEN** the farm list says so and points to the best locations below

#### Scenario: Filtered empty

- **GIVEN** a Raids Filter leaves no candidate that would exist without it
- **THEN** the farm list says no location matches the Raids Filters and offers Reset

### Requirement: The HSE tab header offers project, filters and planning settings

While a rule-bearing HSE is active or previewed, the HSE tab header SHALL show the Dailies project selector (the same selection as Raids and Shops, "all goals" by default), the Raids Filters action and the Planning Settings action opening the same dialog as Today. They SHALL be hidden when there is no event to list for (none running or upcoming with a rule, or an event without a rule).

#### Scenario: Project selection narrows the farm list

- **GIVEN** a project is selected
- **THEN** the farm list considers only that project's active goals

#### Scenario: Planning settings from the HSE tab

- **WHEN** the player activates the Planning Settings action
- **THEN** the planning settings dialog opens, and saved changes apply to the farm list

#### Scenario: Hidden without a rule-bearing event

- **GIVEN** no HSE is active and the next one has no raid-point rule, or nothing is scheduled
- **THEN** none of the three header controls is shown

### Requirement: Farm rows show the item's stock against its total target

Beside the drop icon of each farm row the list SHALL show "X/Y": X is the number of the dropped item the player holds (an upgrade material's inventory count, uncapped; for a shard drop the unit's shard count) and Y is the item's total target over the active goals in scope (the sum of the goals' targets for an upgrade material; for a shard drop the highest shard target of the goals on that unit, since shard targets are absolute). The figure SHALL come from the same have/need data as Today and Raids, aggregated over the same goal scope as the list, SHALL use tabular numerals, SHALL NOT break inside itself on a narrow screen, and SHALL carry an accessible name stating the held and target counts. A row whose drop has no goal target SHALL show nothing extra.

#### Scenario: Upgrade material across goals

- **GIVEN** two goals in scope target 100 and 40 of a material and the player holds 55
- **THEN** the row shows "55/140"

#### Scenario: Shard drop

- **GIVEN** two goals on one unit target 50 and 80 shards and the player holds 20
- **THEN** the row shows "20/80"

#### Scenario: Held above the target

- **GIVEN** the player holds 120 of a material whose total target is 10
- **THEN** the row shows "120/10"

#### Scenario: No goal target

- **GIVEN** a row whose drop no goal in scope targets
- **THEN** no stock figure is shown

### Requirement: The HSE tab previews the next event

While no HSE is running and the next upcoming HSE has a raid-point rule, the HSE tab SHALL show the farm list and the top-10 lists (and the project selector, Raids Filters and Planning Settings actions) computed with that upcoming event's rule, SHALL label them as a preview (the event's name, that it is not live, when it starts, and that the lists use the energy left today), and SHALL keep the status line's countdown. A running event always wins over a preview. A preview SHALL NOT be shown for an upcoming event without a rule (even if a later event has one) nor when nothing is scheduled; those keep their existing states. The energy budget SHALL keep its meaning (planning-settings daily energy minus energy really spent today). A preview SHALL NOT change Today, Bonus Raids, Home or the Plan.

#### Scenario: Preview of the next event

- **GIVEN** no HSE is running and Warp Surge starts in 30 hours
- **THEN** the tab shows the status line countdown for Warp Surge, a banner saying it is a preview and not live, the farm list and both top-10 lists computed for Warp Surge's rule, and the header actions

#### Scenario: Live event wins

- **GIVEN** Machine Hunt is running and Warp Surge is upcoming
- **THEN** the lists are computed for Machine Hunt and no preview banner is shown

#### Scenario: Next event without a rule

- **GIVEN** no HSE is running and the next one is Faction Boost, followed later by Warp Surge
- **THEN** no lists or preview are shown, only the countdown for Faction Boost

#### Scenario: Nothing scheduled

- **GIVEN** no running or upcoming HSE
- **THEN** the tab says no event is scheduled
