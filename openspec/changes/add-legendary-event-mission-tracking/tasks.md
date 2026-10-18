# Tasks

## 0. Prerequisite

- [ ] 0.1 Companion `tacticus-planner-api` change `add-legendary-event-mission-tracking` merged (typed missions, run inputs ticks); regenerate the web API client

## 1. Entities

- [ ] 1.1 Mission types and `formatMissionLabel` with i18n keys per kind; fallback to `text`
- [ ] 1.2 `tokenProgressesMission(token, team, battle, mission, catalog)` with the D3 rules; tests per kind, reserve exclusion, damage-type exclusions

## 2. Run inputs drawer

- [ ] 2.1 Checklist per run (Now expanded), Plan to complete floor, tick raises count; patches carry ticks; tests for the scenarios
- [ ] 2.2 Mobile touch targets

## 3. Next token card

- [ ] 3.1 Progresses line and For missions alternative selection; tests for the three scenarios
- [ ] 3.2 Alternative carries Partly cleared / Couldn't clear

## 4. i18n and tour

- [ ] 4.1 Mission kind labels and drawer/card copy in en/de/es/fr
- [ ] 4.2 Tour step copy for Run inputs mentions the checklist

## 5. Verification

- [ ] 5.1 `pnpm --filter web lint`, `typecheck`, `vitest run`
- [ ] 5.2 Desktop and mobile check through the Aspire stack (drawer ticks persist, card alternative)
