# Tasks

## 0. Prerequisites

- [x] 0.1 `add-legendary-event-roster-potential-map`, `split-legendary-event-token-plan-by-run`, `add-legendary-event-mission-tracking` and `add-project-event-target` merged

## 1. Generation model

- [x] 1.1 Run gap and estimated run starts / deadline; tests for Uthar, Bile and no history
- [x] 1.2 Points target for any step (generalised reward projection); tests reproduce today's projection for the next step and the Unlock example
- [x] 1.3 Team generation per lane and run on a projected roster; tests for keep / replace and per-run depth
- [x] 1.4 Ceiling and verdicts; tests for Reachable now, Needs upgrades and Too ambitious with best step
- [x] 1.5 Greedy upgrade recommendations with deadline filter, reuse of existing goals, tie-breaks and the 12-goal cap; tests per scenario

## 2. Wizard page

- [x] 2.1 Route `/legendary-events/:eventId/plan`, draft state, stepper / mobile header, Back / Next, leave confirmation
- [x] 2.2 Target step
- [x] 2.3 Upgrades step with ticks and live verdict (target edits deferred, see design)
- [x] 2.4 Teams step with keep/replace, remove and restore (edit and add suggestion deferred, see design)
- [x] 2.5 Runs and tokens step reusing the split token plan, forecast and run inputs controls on the draft
- [x] 2.6 Review and create: destination picker, ordered creation, per-item status, Retry failed, toast

## 3. Entry points

- [x] 3.1 Plan this event on Overview; Plan all lanes for a goal in Suggest teams

## 4. i18n, tour, analytics

- [x] 4.1 `legendaryEvents` keys in en/de/es/fr
- [x] 4.2 Wizard tour (desktop and mobile)
- [x] 4.3 Analytics events

## 5. Verification

- [x] 5.1 `pnpm --filter web lint`, `typecheck`, `vitest run`
- [ ] 5.2 Desktop and mobile walk-through on the Aspire stack: create a plan into a new project, retry a failed item, confirm teams, goals, project target and run inputs appear on their pages (left for review)
