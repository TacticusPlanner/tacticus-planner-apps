# Tasks

## 0. Prerequisites

- [ ] 0.1 `add-legendary-event-roster-potential-map`, `split-legendary-event-token-plan-by-run`, `add-legendary-event-mission-tracking` and `add-project-event-target` merged

## 1. Generation model

- [ ] 1.1 Run gap and estimated run starts / deadline; tests for Uthar, Bile and no history
- [ ] 1.2 Points target for any step (generalised reward projection); tests reproduce today's projection for the next step and the Unlock example
- [ ] 1.3 Team generation per lane and run on a projected roster; tests for keep / replace and per-run depth
- [ ] 1.4 Ceiling and verdicts; tests for Reachable now, Needs upgrades and Too ambitious with best step
- [ ] 1.5 Greedy upgrade recommendations with deadline filter, reuse of existing goals, tie-breaks and the 12-goal cap; tests per scenario

## 2. Wizard page

- [ ] 2.1 Route `/legendary-events/:eventId/plan`, draft state, stepper / mobile header, Back / Next, leave confirmation
- [ ] 2.2 Target step
- [ ] 2.3 Upgrades step with ticks, target edits and live verdict
- [ ] 2.4 Teams step with keep/replace, remove, edit (draft-only team editor), add suggestion
- [ ] 2.5 Runs and tokens step reusing the split token plan, forecast and run inputs controls on the draft
- [ ] 2.6 Review and create: destination picker, ordered creation, per-item status, Retry failed, toast

## 3. Entry points

- [ ] 3.1 Plan this event on Overview; Plan all lanes for a goal in Suggest teams

## 4. i18n, tour, analytics

- [ ] 4.1 `legendaryEvents` keys in en/de/es/fr
- [ ] 4.2 Wizard tour (desktop and mobile)
- [ ] 4.3 Analytics events

## 5. Verification

- [ ] 5.1 `pnpm --filter web lint`, `typecheck`, `vitest run`
- [ ] 5.2 Desktop and mobile walk-through on the Aspire stack: create a plan into a new project, retry a failed item, confirm teams, goals, project target and run inputs appear on their pages
