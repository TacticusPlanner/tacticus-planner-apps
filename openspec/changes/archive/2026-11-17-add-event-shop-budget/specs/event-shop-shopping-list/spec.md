## ADDED Requirements

### Requirement: A budget compares the plan's spend with the event's income

When every week of the event has an estimated income (served `estimatedWeeklyIncome`), the list SHALL show a Budget block under its totals: what the plan spends, Bought + Still to buy (Missed packs were never paid for), and two lines comparing it with the event's estimated income summed over all weeks — the free income, and the free income plus the bonus shipment — each showing the income and what is left, or how far over the plan goes, highlighted when over. When any week has no estimate the block SHALL NOT be shown, so a partial sum never reads as the event's budget.

#### Scenario: The plan fits the free income

- **WHEN** the event's two weeks each estimate 750 free and 1,000 bonus shipment, and the list has Bought 15 and Still to buy 30 (Missed 15)
- **THEN** the Budget block shows 45 spent, "≈ free income 1,500" with 1,455 left, and "≈ with bonus shipment 3,500" with 3,455 left

#### Scenario: The plan goes over

- **WHEN** the two weeks each estimate 10 free and 5 bonus shipment and the plan spends 45
- **THEN** the free line shows 25 over and the bonus line 15 over, both highlighted

#### Scenario: No estimate, no budget

- **WHEN** one week of the event has no estimated income
- **THEN** no Budget block is shown
