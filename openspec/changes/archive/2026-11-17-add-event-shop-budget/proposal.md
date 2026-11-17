## Why

Staging feedback on the event shop planner (#508): testers wanted to see what they can buy within the event currency they expect to earn ("still to buy of X"), as V1 shows free and bonus-shipment totals. The page shows a week's estimated income in its header, but never compares it with the plan.

## What Changes

- The shopping list shows a Budget block under its totals: what the plan spends (bought + still to buy; missed packs were never paid for) against the event's estimated income, free and with the bonus shipment, each with what is left or how far over.
- The block appears only when every week of the event has an income estimate, so it never shows a partial sum as the event's budget.

## Capabilities

### Modified Capabilities

- `event-shop-shopping-list`: a budget compares the plan's spend with the event's estimated income.

## Impact

- `apps/web`: `features/shops/event-planner` `eventShopBudget`; the shopping list's Budget block; `eventShops` copy in four locales.
- Income comes from the served `estimatedWeeklyIncome`; the API curates it per shop week (companion API PR adds November 2026).
