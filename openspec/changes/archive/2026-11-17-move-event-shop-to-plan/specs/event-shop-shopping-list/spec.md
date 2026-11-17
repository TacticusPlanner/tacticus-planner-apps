## MODIFIED Requirements

### Requirement: Totals split the cart into still to buy, bought and missed

The list SHALL show three totals in the event currency — Still to buy (Σ `toBuy` packs × cost), Bought (Σ `bought` packs × cost) and Missed (Σ `missed` packs × cost) — and the cart total they add up to ("390 planned"). All totals SHALL be derived from one per-entry classification result.

#### Scenario: Worked example — totals

- **WHEN** today is week 1 day 3 and the cart holds: (a) day 0, 2 packs at 45, 2 bought; (b) day 1, 3 packs at 30, 1 bought; (c) day 2, 1 pack at 100, 0 bought; (d) day 3, 2 packs at 45, 0 bought; (e) day 5, 1 pack at 20, 1 bought
- **THEN** Still to buy = (d) 2 × 45 = 90; Bought = (a) 90 + (b) 30 + (e) 20 = 140; Missed = (b) 2 × 30 + (c) 100 = 160; and 90 + 140 + 160 = 390 = the cart total shown as "390 planned"

### Requirement: Rows act in place

Each upcoming row SHALL offer "Mark N bought in game" for its unbought packs, and every row SHALL have a "⋯" menu with **Go to the day** (opens the Shop tab on that day), **Undo bought** when packs are bought, and **Remove**. Quantity changes happen on the slot card or sheet. Every change SHALL save with the same rules as the Shop tab.

#### Scenario: Go to the day

- **WHEN** the user chooses "Go to the day" on a Sun 1 Nov row
- **THEN** the Shop tab opens with Sun 1 Nov selected

### Requirement: Clear week removes everything not bought

The list SHALL end with "Clear week {w}…" for each week that has entries. After a confirmation that counts what will go ("1 item still to buy (90) leaves the plan", "2 items to review keep only their bought packs") and says "Every bought pack stays", it SHALL remove that week's to-buy entries and the unbought packs of its Needs review entries (`quantity` becomes `purchasedQuantity`; entries with nothing bought leave the cart). Done entries and every bought pack SHALL stay.

#### Scenario: Clear week keeps bought packs

- **WHEN** the user confirms Clear week on week 1 holding (a) done 2 of 2, (b) past 1 of 3 bought, (c) past 0 of 1, (d) today 0 of 2
- **THEN** (a) stays, (b) keeps 1 pack bought and becomes done, (c) and (d) leave the cart
