# Design

## Context

`run-forecast.ts` already spends the token plan across the runs that are not Done, each up to its supply. The list renders the plan without that split.

## Decisions

### D1. One spending rule

Extract the forecast's spending loop into `splitPlanByRun(plan, supply)` returning `{ run, state, available, tokens[] }[]` plus the overflow tokens. The forecast and the list both call it, so the list can never disagree with the forecast.

### D2. Done runs are not shown

Done runs supply nothing and have no planned tokens; the forecast still shows them as "Finished". The list shows only runs that can take tokens.

### D3. Sections are headers, not nested collapsibles

One collapsible (the existing one) holds every section; the sections are plain headers. Nested disclosure hides the current run's tokens behind an extra tap on mobile.

## Risks / Trade-offs

- The split assumes tokens are played in plan order across runs; that is already the forecast's assumption.
