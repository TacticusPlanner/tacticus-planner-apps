# event-shop-planner Specification

## Purpose

The Dailies › Event shop page: lets a signed-in player browse a seasonal event shop day by day, plan and track purchases, see milestones and missions, search everything the shop sells and see on which days, and see how the plan covers their goals' needs.

## Requirements

### Requirement: Event shop is a signed-in Dailies page

The page SHALL live at `/dailies/event-shop` and `/dailies/event-shop/:eventId` inside the protected Dailies section, with a Dailies nav child "Event shop". `/dailies/event-shop` SHALL redirect (replace) to the default event: the running event; else the next upcoming one; else the most recently started one. An unknown `:eventId` SHALL redirect to the default event and show a notice that the event was not found.

#### Scenario: Default event is the running one

- **WHEN** the catalog has `june-2026`, `august-2026` and `october-2026`, and today is 2026-10-29
- **THEN** `/dailies/event-shop` opens `/dailies/event-shop/october-2026`

#### Scenario: Unknown event id

- **WHEN** the user opens `/dailies/event-shop/may-2025`
- **THEN** the page replaces the URL with the default event and shows "That event shop isn't available"

### Requirement: Page states are distinct

The page SHALL distinguish: catalog loading (skeleton); catalog load failure (error with retry); `event-shops` absent from the catalog or present but empty (an empty state "No event shops yet"); plan loading (shop content shown, cart controls disabled); plan load or save failure (shop content shown, an inline error with retry, cart controls disabled until the plan loads); no synced player data (a notice "Sync your account to see offers for your roster"); an empty cart (a shopping-list empty state pointing at the slots); no Active goals (see Coverage).

#### Scenario: No events

- **WHEN** the `event-shops` dataset is present with zero events
- **THEN** the page shows "No event shops yet" and no event picker

#### Scenario: Plan fails to load

- **WHEN** the catalog is ready but `GET /event-shop-plans/{eventId}` fails
- **THEN** the day's slots are visible, add-to-cart and mark-bought are disabled, and an error with Retry is shown

### Requirement: The header names the event and its timing

The header SHALL show an event picker labelled with the event's name — its calendar `definitionId` through the existing `events` i18n names, followed by its start month and year in the user's locale ("Armageddon Shop · October 2026") — that lists every catalog event, newest first, with its date range. Beside it the header SHALL show a status badge (`Starts in N days` · `Running` · `Ended`), the date range and day count, the daily shop reset in the user's time zone ("shop resets 01:00 your time", the local time of 00:00 UTC), and when the player data was last synced ("Synced 2 h ago"; "Not synced" without player data). When the selected day's week has `estimatedWeeklyIncome`, the header SHALL show "≈ {free} free + {bonusShipment} bonus shipment this week" in the event currency; otherwise nothing.

#### Scenario: Event name

- **WHEN** the event has `definitionId` `armageddon-shop` and starts 2026-10-26
- **THEN** the picker shows "Armageddon Shop · October 2026"

#### Scenario: Reset time follows the user's time zone

- **WHEN** the user's time zone is Europe/Prague on 2026-10-29 (UTC+1)
- **THEN** the header says "shop resets 01:00 your time"

#### Scenario: Income for the selected week

- **WHEN** week 1 of `august-2026` has income 750 / 1000 and the selected day is in week 1
- **THEN** the header shows "≈ 750 free + 1,000 bonus shipment this week"

### Requirement: Day selection lives in the Shop tab

The selected day SHALL be held in the URL as `?day=<index>` (0-based event day); without it, or with an out-of-range value, the page SHALL use the event's default day (see `game-event-shops-catalog`). The day picker SHALL appear only on the Shop tab. Every day SHALL show its weekday and date, Today SHALL be marked, and past days SHALL look quieter but stay selectable. Each day SHALL show the state of what is planned on it: bought, to buy, or needs review (see `event-shop-shopping-list`). Changing the event SHALL drop `day` and keep the tab.

#### Scenario: Day survives reload

- **WHEN** the user selects week 2 Thursday of `august-2026` and reloads
- **THEN** `?day=8` is in the URL and the same day is selected

#### Scenario: On desktop and tablet the day picker is a week calendar

- **WHEN** the viewport is at least 768px wide and the Shop tab is open
- **THEN** a week calendar under the tabs shows the week's dates, a legend (bought · to buy · needs review) and seven day columns, each listing its planned items as small reward icons coloured by state; previous and next week controls appear for events longer than a week; clicking a column selects that day

#### Scenario: On phone the day picker is a row of day chips

- **WHEN** the viewport is below 768px and the Shop tab is open
- **THEN** the week's seven days show as chips (weekday, day number) with a dot coloured by the day's planned state (none, bought, to buy, needs review), and the selected day's label ("Thu 29 Oct · Today") shows under them

#### Scenario: The calendar is hidden on other tabs

- **WHEN** the Milestones, Missions or Rewards tab is open
- **THEN** no day picker is shown

### Requirement: The Shop tab lists the selected day's slots

The Shop tab SHALL show every slot available on the selected day (from the event day helper), in the game's slot order, each with its reward icon and name, pack quantity, free bundled offer, cost in the event currency and per-day cap. Locks and power-level bounds SHALL be resolved from the synced roster, so a slot SHALL show the one offer the player gets; when the cart plans a reward of that slot and day that the roster no longer resolves to (e.g. shards after the unit reached max legendary), the slot SHALL show the planned reward instead, so it shows what its cart controls act on. A slot resolved by the player's tier SHALL say so ("Your tier: High"), with the tier rule in a tooltip (Low: power level below 20; Mid: 20 or more; High: 20 or more with a character or Machine of War at Legendary one blue star or above). A shard slot resolved by unit progress SHALL say what follows ("Then mythic shards at max legendary"). Without synced player data, a slot SHALL list every option it may show, under "Depends on your tier" or "Depends on unit progress". Display strings and icons SHALL be resolved from ids through the shared shop reward display.

Assumptions:

- Each variant's `maxPurchasesPerDay` is the number of packs buyable on that day.
- A free bundled offer is granted with each purchase of the slot and costs nothing extra.
- No current event shop has randomized slots; every slot with several variants is gated by tier or unit progress.

#### Scenario: Roster resolves a shard lock

- **WHEN** the synced roster has Yarrick below max legendary
- **THEN** the slot offers `shards_astraYarrick` and not `mythicShards_astraYarrick`, with "Then mythic shards at max legendary"

#### Scenario: A planned reward the roster no longer resolves to stays on its slot

- **WHEN** the cart plans `mythicShards_astraYarrick` in the Yarrick slot and the synced roster now resolves that slot to `shards_astraYarrick`
- **THEN** the slot shows the planned mythic shards, and its cart controls act on that entry

#### Scenario: Tier resolves an orb slot

- **WHEN** the player's power level is 50 with a unit at Legendary one blue star, on Thu 29 Oct of `october-2026`
- **THEN** slot 7 offers Mythic Imperial ascension orbs ×5 for 225 and shows "Your tier: High"

#### Scenario: Unsynced slot lists its options

- **WHEN** the player has no synced data
- **THEN** slot 7 lists the epic, legendary and mythic orb offers under "Depends on your tier", and the sync notice is shown

#### Scenario: On desktop and tablet a slot is a card

- **WHEN** the viewport is at least 768px wide
- **THEN** slots are cards in a three-column grid, three a row like the in-game shop, showing icon, name, pack, slot number, cost, "max N a day", the free bonus as a badge and any lock note; a card in the cart keeps the size of the other cards in its row: it is outlined, its price line reads "N × cost = total", and in place of "Add to cart" one row holds a slider from 1 to the cap (none when the cap is 1), "N/cap", a tick that marks every planned pack bought (and unmarks them) and a remove button; a bought card turns green

#### Scenario: On phone a slot is a tile

- **WHEN** the viewport is below 768px
- **THEN** slots are tiles in a three-column grid showing icon with pack size, name, cost and cap; a tile in the cart is outlined, shows its planned count and a tick box in its corner that marks all planned packs bought (and unticks back to 0 bought); tapping a tile opens the slot sheet

### Requirement: Cart and purchase tracking

For a slot offer on the selected day, the user SHALL be able to add it to the cart, which plans the offer's per-day cap (most players buy every pack), set its quantity from 1 to that cap without stepping one pack at a time, remove it, mark all planned packs bought in one action (a tick on the card or tile, "Bought" in the slot sheet, "Mark N bought" on a list row), and record buying fewer packs than planned by lowering the packs first and then marking them bought. A slot SHALL hold at most one cart entry per day; choosing another option of the same slot (possible only without synced data) replaces it after confirmation. A `draft_*` reward SHALL require choosing an alliance (Imperial, Xenos, Chaos) before it is added, and the chosen alliance SHALL be shown and changeable. Each change SHALL update the UI immediately and be saved to `/event-shop-plans/{eventId}` as the whole entry set; saves SHALL be debounced to at most one in flight. A 409 `eventShopPlanStale` SHALL reload the server plan, discard the local edit and show "Your cart was changed elsewhere and has been reloaded". Before writing, entries that no longer resolve against the catalog (missing week, slot, day or reward) SHALL be dropped and the user told how many were removed.

#### Scenario: The daily freebie is not planned

- **WHEN** a slot sells gold ×1 for 1 event currency with 5 event currency back (it pays back more of the event currency than it costs)
- **THEN** its card, tile and sheet show it as the game does, the event currency ×5 marked "Free every day" with no price, and "Claim it in game every day; nothing to plan"; it offers no way to add it to the cart, never counts in the cart totals or Needs review, and is left out of shop search and Coverage; the freebie is recognised by these terms, not by its slot, since it moves between slots and weeks

#### Scenario: Quantity is capped

- **WHEN** an offer's per-day cap is 5 and its cart quantity is 5
- **THEN** the slider is at its end and the Max shortcut is disabled

#### Scenario: Draft reward needs an alliance

- **WHEN** the user adds a `draft_abilityTokensLegendary` offer
- **THEN** an alliance choice opens, and the entry is saved with the chosen `draftAlliance`

#### Scenario: Stale save reloads

- **WHEN** a save returns 409 `eventShopPlanStale`
- **THEN** the cart shows the plan from the response and the reload notice is shown

#### Scenario: Phone sheet for an unplanned slot

- **WHEN** the user taps a tile that is not in the cart on a phone
- **THEN** the slot sheet opens with the packs slider at the day's max, "N × cost = total" and "Add N to cart"; adding plans that many packs and closes the sheet, and the tile then shows its planned count and its tick box for marking it bought

#### Scenario: Phone slot sheet

- **WHEN** the user taps the planned Yarrick tile on a phone
- **THEN** a bottom sheet shows the reward, "Slot 2 · Thu 29 Oct · Today", "45 a pack · max 5 a day", the other days it is sold ("Also Sun 1 Nov"), a planned-packs slider ("2 / 5", from 1 to "5 max") with "2 × 45 = 90", a primary "Bought" button and a "Remove from cart" action

### Requirement: Rewards are read-only references

The Milestones and Missions content SHALL say "Reference only. The planner doesn't know your event progress." Milestones (canvas M2) SHALL show the event's ladder and the selected week's progress-chest ladder as dense tiles, every tier shown: each tile with its required points, its main reward with icon and amount (large amounts compact, "22.5k"), and any other rewards under it ("+5"); a single item is shown by name. A tier carrying a reward most tiers of its ladder don't (a token, stamina, a profile theme) SHALL be highlighted and wider. A ladder SHALL show the event currency it pays in total ("450 Event currency in total") and, when a ranged reward is the same percent above its minimum on every tier, note it once ("Gold rolls up to +10%") and show the minimum on the tiles; other ranges show as `min–max`. Missions (canvas Mi1) SHALL show the selected week's daily missions as tiles in the game's task text (target and parameters filled in) with their rewards, under "Daily · 6 a day" and what they pay a day; and each free or premium chain as one card: "Free chain · 20", what the whole chain pays, its task without a target ("Deal Damage using Abilities"), a bar per mission scaled by its target with the first and last target ("1: 7,500" … "20: 105,000"), and the reward each mission pays when they all pay the same ("90 Event points each"); every mission's text SHALL stay available to assistive technology. Empty ladders or mission groups SHALL show "None this week". For an event longer than a week, Milestones and Missions SHALL have a week picker, since the Shop tab's day picker is not shown there; picking a week selects its first day. Desktop and tablet SHALL show them as the Milestones and Missions tabs; phone SHALL show them in one Rewards tab with a Milestones | Missions switch.

#### Scenario: Range reward

- **WHEN** every progress chest of a week grants gold from its minimum to 10% more (600–660, 800–880, …)
- **THEN** the chests read "Gold rolls up to +10%" once and the tiles show 600, 800, …

#### Scenario: Highlighted tier

- **WHEN** the October 2026 milestone 4,020 grants a Blessed Requisition Order while the other tiers grant event currency
- **THEN** that tile is highlighted and names the Blessed Requisition Order

#### Scenario: Game mission text

- **WHEN** the October 2026 week 1 daily missions are shown
- **THEN** the first reads "Traverse 150 hexes with your characters" with its Event points reward

#### Scenario: Chain card

- **WHEN** the October 2026 week 1 premium chain is shown
- **THEN** its card reads "Premium chain · 10", "900 Event points + 500 Event currency", "Defeat enemies", bars from "1: 45" to "10: 180" and "90 Event points + 50 Event currency each"

#### Scenario: Another week's missions

- **WHEN** the user opens Missions on week 1 of `august-2026` and picks Week 2
- **THEN** the URL selects day 7 and the tab shows week 2's missions

### Requirement: Shop search across the event

A text field ("Search the shop") SHALL search every reward the event sells, not only units: as the user types, the matches SHALL list each matching reward with every event day it is on sale (date, pack size and cost), days already past marked past and today marked. A reward SHALL match by its name in the user's language and, for shards and mythic shards, also by the unit's other names, as the unit pickers match them; names that start with the query SHALL come first. Selecting a day SHALL open the Shop tab on that day. On desktop and tablet the field sits in the tab bar with the matches under it; on phone a header icon opens it in a dialog. Without synced player data every option of each slot is searched.

#### Scenario: Yarrick shard days

- **WHEN** the user types "yarr" in `october-2026`
- **THEN** the matches show Yarrick shards on Mon 26 Oct (past, if today is later), Thu 29 Oct and Sun 1 Nov, each "×25 · 45"

#### Scenario: Not only units

- **WHEN** the user types "orb"
- **THEN** the matches list the event's ascension orb rewards with the days each is sold

### Requirement: Coverage of goal needs

A Coverage section SHALL compare the outstanding needs of the player's Active goals — all goals by default, optionally filtered to one project, like Dailies' shop recommendations — with what the event can still supply. It SHALL cover every resource type the event sells for which V2 derives a need: character shards and mythic shards and uncraftable Mythic upgrade materials (from the shop need aggregation), ability badges and ascension orbs per alliance and rarity, forge badges per rarity, MoW components per alliance, XP (as books of the user's selected XP-book rarity) and gold (from the plan's missing-resources totals). `draft_*` rewards SHALL count toward the resource of their chosen alliance. For each resource with a positive need a row SHALL show the resource, "need N · planned P", the still needed amount = max(0, need − planned), and the estimated cost to buy the whole still needed amount with the cheapest offer. When the still needed amount exceeds the maximum still buyable in this event, the row SHALL also show how many are short ("100 short") and a note "only M left to buy in this event". The common unit of every estimated cost SHALL be the event currency. No row SHALL be highlighted. Rows SHALL be sorted gold, XP, badges, orbs, MoW components, forge badges, Mythic materials, shards. A hint SHALL say "Bought packs count after the next sync". Once the event has ended, Coverage SHALL say so instead of listing rows, since nothing is left to buy.

Assumptions:

- Needs are already net of owned inventory, so bought packs (now in inventory after the next sync) are not counted again as planned supply.
- Between buying in game and the next sync, a bought pack is in neither inventory nor planned supply, so the still needed amount is temporarily overstated.
- Cheapest offer = the event offer with the lowest cost per unit of that resource across all days still to come.
- The planner does not know the player's currency balance, so the cost is the full price of the still needed amount, not capped to what is buyable or affordable.

Estimate:

- packs needed = ceil(still needed / qty per pack of the cheapest offer)
- estimated cost = packs needed × cost per pack
- max still buyable = Σ over today and future days of (per-day cap − packs already in the cart that day) × qty per pack, over every offer selling the resource

#### Scenario: Worked example — Yarrick shards in October 2026

- **WHEN** today is Thu 2026-10-29 in `october-2026` (start Mon 2026-10-26, 1 week); Yarrick's goals still need 110 shards; the slot offering `shards_astraYarrick:25` for 45 with cap 5 on MON/THU/SUN has cart entries Mon qty 2 (bought 2), Thu qty 1 (bought 0), Sun qty 1 (bought 0)
- **THEN** planned = Thu 25 + Sun 25 = 50 (Mon is bought and excluded); still needed = 110 − 50 = 60; packs needed = ceil(60 / 25) = 3; estimated cost = 3 × 45 = 135 event currency; max still buyable = (5 − 1) × 25 on Thu + (5 − 1) × 25 on Sun = 200 shards, so the row is not short

#### Scenario: Worked example — need beyond the event

- **WHEN** today is Thu 2026-10-29 in `october-2026`; the goals still need 300 Imperial uncommon ability badges; nothing is planned; the only offer is `abilityTokenUncommon_Imperial:10` for 15 with cap 5 every day
- **THEN** still needed = 300; max still buyable = 4 days (Thu–Sun) × 5 packs × 10 = 200; the row shows "100 short" and "only 200 left to buy in this event"; packs needed = ceil(300 / 10) = 30; estimated cost = 30 × 15 = 450 event currency

#### Scenario: No goals

- **WHEN** the player has no Active goals in the selected scope
- **THEN** Coverage shows "No goal needs this shop can cover" with a link to Goals

### Requirement: Desktop, tablet and phone layouts differ

The page SHALL have three forms. On desktop (≥ 1024px) the Shop · Milestones · Missions tabs and their content SHALL sit on the left and a side column with the shopping list and Coverage SHALL stay visible beside them while the day changes. On tablet (768–1023px) the tabs and slot cards SHALL use the full width, and a sticky bottom button "Shopping list · {still to buy} to buy · {n} to review" SHALL open the shopping list and Coverage in a drawer from the right. On phone (< 768px) the page SHALL have three tabs — Shop, Plan (the shopping list and Coverage, with a badge counting Needs review entries) and Rewards (milestones, progress chests and missions) — and on Shop a sticky bottom bar "Still to buy {n}" with "{n} to review" that opens Plan. Once the event has ended, the bar and the tablet button SHALL lead with what is left to review and SHALL be hidden when nothing is. `?tab=` SHALL accept `shop`, `milestones`, `missions`, `plan` and `rewards`; a value that the current form lacks SHALL map to its nearest tab (`plan` → `shop` on desktop and tablet; `milestones` and `missions` → `rewards` on phone; `rewards` → `milestones` on desktop and tablet). There SHALL be no cards/rows display switch.

#### Scenario: Desktop side column

- **WHEN** the viewport is 1280px and the Shop tab is open
- **THEN** the shopping list and Coverage are visible next to the slot cards

#### Scenario: Tablet drawer

- **WHEN** the viewport is 900px and the user activates the "Shopping list" button
- **THEN** a drawer opens from the right with the shopping list and Coverage, and closing it returns focus to the button

#### Scenario: Phone Plan tab

- **WHEN** the viewport is 390px and the user opens `?tab=plan`
- **THEN** the shopping list and Coverage fill the page, and the Plan tab shows a badge with the number of Needs review entries

### Requirement: An ended event stays usable

An ended event SHALL keep the same page with an "Ended" badge, its last day selected, and every control working, so a player can still record purchases. The shopping list SHALL act as the event's recap (see `event-shop-shopping-list`).

#### Scenario: Ended event opens on its last day

- **WHEN** the user opens `october-2026` on 2026-11-09
- **THEN** the header shows "Ended", Sun 1 Nov is selected and the slots and cart controls still work

### Requirement: The page has an onboarding tour

The page SHALL register a tour with desktop, tablet and phone steps covering the event picker, the day picker, a slot card or tile and adding to cart, marking bought, the shopping list (side column, drawer button or Plan tab), Coverage, and the reward tabs, with all titles and texts from i18n.

#### Scenario: Phone tour targets phone controls

- **WHEN** the tour runs below 768px
- **THEN** its steps target the day chips, a tile's tick box, the Plan tab and the bottom bar, not the desktop side column

### Requirement: All copy is translated

Every user-facing string on the page SHALL come from the `eventShops` i18n namespace or the existing shared and game-name namespaces, with English, German, Spanish and French translations. Reward, unit, item and upgrade names SHALL use the planner's existing labels and generated game names; mission texts and chain names SHALL use the game's own text from the generated game-text namespaces. Layouts SHALL hold German strings about 30% longer than English: buttons and chips may wrap to two lines or shorten (e.g. "Gekauft (2)"), card subtitles truncate with an ellipsis and show in full in the slot sheet.

#### Scenario: German UI

- **WHEN** the language is German
- **THEN** no English text appears on the page apart from game proper names, and no button text is cut off
