## Context

`computePlanInsights` already estimates any list of goals with given priorities. `estimateNewGoalsForProject` (`features/goal-planning/model/estimate/per-project-estimate.ts`) uses it for the create preview. The scoped Goals page shows each goal's Done By from the global run.

## Decisions

1. **Owning slice.** `features/goal-planning/model/estimate/use-project-alone-estimates.ts` exposes `useProjectAloneEstimates(projectId, enabled)`. It returns the same `Map<goalId, EstimateOutcome>` shape as the global run, so the Done By cell and `deadlineFit` consume either map unchanged. It is exported from `features/goal-planning/index.ts`.
2. **Same engine, filtered input.** The run takes the project's Active goals with their global priorities, so their relative order is kept, and the same player, inventory, energy and Onslaught inputs as the global run. No second calculation path.
3. **Lazy.** The run is computed only while the toggle is on and the scope is a project, and it is memoized on the project's goal ids, their order and the planning inputs.
4. **State.** `usePersistedSelection("goals.overview.fitBasis", "fullPlan")` in `pages/goals`. It is one value for every project scope, and it is ignored on the unscoped page.
5. **Desktop and mobile.** Desktop puts the control at the right of the deadline header or scope bar. Mobile puts it as a full-width two-segment control under the header, above the cards. The Goals tour step `fitBasis` targets `[data-testid="goals-fit-basis"]` on both.

## Risks / Trade-offs

- A large project doubles the scoped page's estimate work while the toggle is on. It is accepted because the run is opt-in and memoized.
