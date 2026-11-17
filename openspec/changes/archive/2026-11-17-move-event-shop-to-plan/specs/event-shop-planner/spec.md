## RENAMED Requirements

- FROM: `### Requirement: Event shop is a signed-in Dailies page`
- TO: `### Requirement: Event shop is a signed-in Plan page`

## MODIFIED Requirements

### Requirement: Event shop is a signed-in Plan page

The page SHALL live at `/plan/event-shop` and `/plan/event-shop/:eventId` inside the protected Plan section, with a Plan nav child "Event shop" after Schedule. The former `/dailies/event-shop` and `/dailies/event-shop/:eventId` SHALL redirect (replace) to the matching Plan path, keeping the query (`?day=`, `?tab=`), so earlier links and bookmarks still open the same event, day and tab. `/plan/event-shop` SHALL redirect (replace) to the default event: the running event; else the next upcoming one; else the most recently started one. An unknown `:eventId` SHALL redirect to the default event and show a notice that the event was not found.

#### Scenario: Default event is the running one

- **WHEN** the catalog has `june-2026`, `august-2026` and `october-2026`, and today is 2026-10-29
- **THEN** `/plan/event-shop` opens `/plan/event-shop/october-2026`

#### Scenario: Unknown event id

- **WHEN** the user opens `/plan/event-shop/may-2025`
- **THEN** the page replaces the URL with the default event and shows "That event shop isn't available"

#### Scenario: An old Dailies link opens the Plan page

- **WHEN** the user opens `/dailies/event-shop/november-2026?day=3&tab=plan`
- **THEN** the app replaces it with `/plan/event-shop/november-2026?day=3&tab=plan`

### Requirement: Cart and purchase tracking

For a slot offer on the selected day, the user SHALL be able to add it to the cart, which plans the offer's per-day cap (most players buy every pack), set its quantity from 1 to that cap without stepping one pack at a time, remove it, mark all planned packs bought in one action (a tick on the card or tile, "Bought" in the slot sheet, "Mark N bought in game" on a list row), and record buying fewer packs than planned by lowering the packs first and then marking them bought. A slot SHALL hold at most one cart entry per day; choosing another option of the same slot (possible only without synced data) replaces it after confirmation. A `draft_*` reward SHALL require choosing an alliance (Imperial, Xenos, Chaos) before it is added, and the chosen alliance SHALL be shown and changeable. Each change SHALL update the UI immediately and be saved to `/event-shop-plans/{eventId}` as the whole entry set; saves SHALL be debounced to at most one in flight. A 409 `eventShopPlanStale` SHALL reload the server plan, discard the local edit and show "Your cart was changed elsewhere and has been reloaded". Before writing, entries that no longer resolve against the catalog (missing week, slot, day or reward) SHALL be dropped and the user told how many were removed.

The controls SHALL keep planning apart from buying: adding an offer reads "Plan to buy" (the legend and the totals call such packs "Planned"), and every action that records a purchase says it was bought in game ("Mark N bought in game", "Mark planned packs bought in game"). No control SHALL call the plan a cart.

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
- **THEN** the slot sheet opens with the packs slider at the day's max, "N × cost = total" and "Plan to buy N"; adding plans that many packs and closes the sheet, and the tile then shows its planned count and its tick box for marking it bought

#### Scenario: Phone slot sheet

- **WHEN** the user taps the planned Yarrick tile on a phone
- **THEN** a bottom sheet shows the reward, "Slot 2 · Thu 29 Oct · Today", "45 a pack · max 5 a day", the other days it is sold ("Also Sun 1 Nov"), a planned-packs slider ("2 / 5", from 1 to "5 max") with "2 × 45 = 90", a primary "Bought" button and a "Remove from plan" action

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
- **THEN** slots are cards in a three-column grid, three a row like the in-game shop, showing icon, name, pack, slot number, cost, "max N a day", the free bonus as a badge and any lock note; a card in the cart keeps the size of the other cards in its row: it is outlined, its price line reads "N × cost = total", and in place of "Plan to buy" one row holds a slider from 1 to the cap (none when the cap is 1), "N/cap", a tick that marks every planned pack bought (and unmarks them) and a remove button; a bought card turns green

#### Scenario: On phone a slot is a tile

- **WHEN** the viewport is below 768px
- **THEN** slots are tiles in a three-column grid showing icon with pack size, name, cost and cap; a tile in the cart is outlined, shows its planned count and a tick box in its corner that marks all planned packs bought (and unticks back to 0 bought); tapping a tile opens the slot sheet

### Requirement: Page states are distinct

The page SHALL distinguish: catalog loading (skeleton); catalog load failure (error with retry); `event-shops` absent from the catalog or present but empty (an empty state "No event shops yet"); plan loading (shop content shown, cart controls disabled); plan load or save failure (shop content shown, an inline error with retry, cart controls disabled until the plan loads); no synced player data (a notice "Sync your account to see offers for your roster"); an empty cart (a shopping-list empty state pointing at the slots); no Active goals (see Coverage).

#### Scenario: No events

- **WHEN** the `event-shops` dataset is present with zero events
- **THEN** the page shows "No event shops yet" and no event picker

#### Scenario: Plan fails to load

- **WHEN** the catalog is ready but `GET /event-shop-plans/{eventId}` fails
- **THEN** the day's slots are visible, plan-to-buy and mark-bought are disabled, and an error with Retry is shown

### Requirement: An event with no start date yet shows as Start date TBA

The event picker SHALL list an undated event (served `startUtc` null) above the dated ones, named by the game's own seasonal event name for its event key followed by the event key's month and year ("Machine Spirit Resurgent · December 2026"), with "Start date TBA" in place of its date range. Opening an undated event SHALL show the picker, a "Start date TBA" badge, its known number of weeks and its currency, and a notice that days and the cart open once the start date is announced; it SHALL show no day picker, slots or cart. The default event SHALL be chosen among dated events only, falling back to the first undated event when there is no dated one.

#### Scenario: Undated event in the picker

- **WHEN** the catalog has `october-2026` (dated) and `january-2027` (undated)
- **THEN** the picker lists `january-2027` first with "Start date TBA", and `/plan/event-shop` still opens the running `october-2026`

#### Scenario: Opening an undated event

- **WHEN** the user opens `/plan/event-shop/january-2027`
- **THEN** the page shows "Start date TBA", "2 weeks" and the notice, and no days or plan-to-buy controls
