# event-shop-shopping-list Specification

## Purpose

The event shop's shopping list: shows what is still to buy from today on, what was bought, and what was missed, with totals that answer "how much currency do I still need", and defines which cart entries count as planned supply for coverage (#508).

## Requirements

### Requirement: Every cart entry is classified by time and purchase

For the current instant, each cart entry SHALL split into parts: `bought` = `purchasedQuantity` packs; and the rest, `quantity − purchasedQuantity` packs, which is `toBuy` when the entry's day is today or later and `missed` when its day is before today. An entry is **done** when `purchasedQuantity = quantity`, **needs review** when it is past and not done, and **upcoming** when it is today or later and not done. An entry with bought packs on a day after today is **bought ahead**. Days are UTC event days (see `game-event-shops-catalog`). A page left open SHALL move on to the new day at the 00:00 UTC reset.

#### Scenario: Partial past entry

- **WHEN** a past entry has quantity 3 and 1 bought
- **THEN** it has 1 bought pack and 2 missed packs, and needs review

#### Scenario: Today counts as upcoming

- **WHEN** an entry is for today with 0 of 2 bought
- **THEN** both packs are to buy

### Requirement: Totals split the cart into still to buy, bought and missed

The list SHALL show three totals in the event currency — Still to buy (Σ `toBuy` packs × cost), Bought (Σ `bought` packs × cost) and Missed (Σ `missed` packs × cost) — and the cart total they add up to ("390 in cart"). All totals SHALL be derived from one per-entry classification result.

#### Scenario: Worked example — totals

- **WHEN** today is week 1 day 3 and the cart holds: (a) day 0, 2 packs at 45, 2 bought; (b) day 1, 3 packs at 30, 1 bought; (c) day 2, 1 pack at 100, 0 bought; (d) day 3, 2 packs at 45, 0 bought; (e) day 5, 1 pack at 20, 1 bought
- **THEN** Still to buy = (d) 2 × 45 = 90; Bought = (a) 90 + (b) 30 + (e) 20 = 140; Missed = (b) 2 × 30 + (c) 100 = 160; and 90 + 140 + 160 = 390 = the cart total shown as "390 in cart"

### Requirement: Upcoming view is the default

The list SHALL open in **Upcoming**: Needs review first (when any), then a Today group, then the remaining days of the event grouped by day, then Done. A toggle SHALL switch to **All**, showing every entry grouped by week and day including past days (marked Past) and done entries. The view choice SHALL NOT persist across visits. The Today group SHALL offer "All of today bought", which marks every entry of today bought; when the rest of the event has nothing to buy it SHALL say so ("Fri 30 Oct – Sun 1 Nov: nothing left to buy").

#### Scenario: Past days are hidden by default

- **WHEN** the list opens on week 2 day 1 with entries on week 1
- **THEN** week 1 entries do not appear in the Upcoming day groups, only in Needs review, Done or All

#### Scenario: All shows everything

- **WHEN** the user switches to All
- **THEN** every entry appears under its week and day, past days marked past

#### Scenario: All of today bought

- **WHEN** today has two entries with 0 of 2 and 1 of 3 bought and the user activates "All of today bought"
- **THEN** both entries are done and Still to buy drops by their unbought packs' cost

### Requirement: Every row shows its real date

Every list row and group header SHALL show the entry's weekday and calendar date (e.g. "Thu 29 Oct", localized), not only the weekday.

#### Scenario: Row date

- **WHEN** an entry is on day 3 of `october-2026`
- **THEN** its row shows Thursday 29 October in the user's locale

### Requirement: Needs review collects past unfinished entries

When any entry needs review, the list SHALL show a "Needs review (N)" group with the explanation of what it holds, listing each such entry with its date, reward, packs, bought/quantity and the cost of its unbought packs ("60 missed"), and two actions on its row: **Bought** (sets `purchasedQuantity` to `quantity`) and **Missed** (drops the unbought packs: `quantity` becomes `purchasedQuantity`, and an entry with nothing bought leaves the cart); **Bought some…** (sets `purchasedQuantity` to a chosen 0..quantity, then treats the rest as missed) SHALL be in the row's "⋯" menu. The group SHALL offer **Mark the rest missed**, which applies Missed to every entry it holds, and SHALL list the first 5 entries with "Show all N" for the rest. Resolving every entry SHALL hide the group. On phone, the Plan tab badge and the Shop bottom bar SHALL show the Needs review count.

#### Scenario: Mark the rest missed

- **WHEN** Needs review holds 12 entries and the user activates "Mark the rest missed"
- **THEN** every one keeps only its bought packs, entries with nothing bought leave the cart, and the group disappears

#### Scenario: Mark a missed item bought

- **WHEN** the user taps Bought on a past entry with 0 of 1 bought
- **THEN** the entry moves to Done, Missed drops by its cost and Bought rises by it

#### Scenario: Accept a partial miss

- **WHEN** the user taps Missed on a past entry with 1 of 3 bought at 30 a pack
- **THEN** the entry keeps 1 pack, bought, and moves to Done; Missed drops by 60 and the cart total by 60

#### Scenario: Accept a full miss

- **WHEN** the user taps Missed on a past entry with 0 of 1 bought
- **THEN** the entry leaves the cart and Missed drops by its cost

### Requirement: Done is collapsed

Done entries SHALL appear in a collapsed "Done" group showing their count and Bought total; expanding it lists them by date.

#### Scenario: Done is collapsed by default

- **WHEN** the cart has 12 done entries
- **THEN** a collapsed "Done (12)" group shows their Bought total

### Requirement: Bought ahead is flagged

An entry marked bought before its day SHALL show "Not on sale until {date}. Undo" on its row, where Undo sets its `purchasedQuantity` back to 0. The entry otherwise counts as bought; Done SHALL start expanded while it holds such an entry, so the note is seen.

#### Scenario: Bought ahead

- **WHEN** today is Thu 29 Oct and an entry for Sat 31 Oct is marked bought
- **THEN** its row says "Not on sale until Sat 31 Oct. Undo"

### Requirement: Rows act in place

Each upcoming row SHALL offer "Mark N bought" for its unbought packs, and every row SHALL have a "⋯" menu with **Go to the day** (opens the Shop tab on that day), **Undo bought** when packs are bought, and **Remove from cart**. Quantity changes happen on the slot card or sheet. Every change SHALL save with the same rules as the Shop tab.

#### Scenario: Go to the day

- **WHEN** the user chooses "Go to the day" on a Sun 1 Nov row
- **THEN** the Shop tab opens with Sun 1 Nov selected

### Requirement: Clear week removes everything not bought

The list SHALL end with "Clear week {w}…" for each week that has entries. After a confirmation that counts what will go ("1 item still to buy (90) leaves the cart", "2 items to review keep only their bought packs") and says "Every bought pack stays", it SHALL remove that week's to-buy entries and the unbought packs of its Needs review entries (`quantity` becomes `purchasedQuantity`; entries with nothing bought leave the cart). Done entries and every bought pack SHALL stay.

#### Scenario: Clear week keeps bought packs

- **WHEN** the user confirms Clear week on week 1 holding (a) done 2 of 2, (b) past 1 of 3 bought, (c) past 0 of 1, (d) today 0 of 2
- **THEN** (a) stays, (b) keeps 1 pack bought and becomes done, (c) and (d) leave the cart

### Requirement: An ended event's list is its recap

When the event has ended, Upcoming SHALL say "This event has ended" with the three totals still shown and a link to All; Needs review SHALL still list unmarked past entries so the player can finish recording.

#### Scenario: Ended event list

- **WHEN** `october-2026` has ended and two entries were never marked
- **THEN** the list shows "This event has ended", the totals, Needs review (2) and a link to All

### Requirement: Coverage counts only upcoming supply

The planned supply used by Coverage SHALL be, per resource, Σ over entries of `toBuy` packs × qty per pack (for `draft_*` entries, toward their chosen alliance's resource). `bought` and `missed` packs SHALL NOT count.

#### Scenario: Missed packs are not supply

- **WHEN** a past entry for 25 Yarrick shards was never bought
- **THEN** Coverage's planned Yarrick shards do not include those 25
