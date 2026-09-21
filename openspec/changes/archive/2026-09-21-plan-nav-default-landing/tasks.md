## 1. Dynamic landing for bare `/goals`

- [x] 1.1 Create `DefaultGoalsLanding` (e.g. `apps/web/src/fsd/pages/goals/ui/default-goals-landing.tsx`): reads `useProjects()`; while `loading`, renders a minimal skeleton; once resolved, navigates (`<Navigate replace>`) to `/goals/projects/{activeProjectId ?? defaultProjectId}` when either id exists, else to `/goals/overview` (covers both the no-projects-yet case and a failed fetch). Unit test all four paths: Current plan present, no Current plan but Default present, no projects at all, fetch error.
- [x] 1.2 In `pages/goals/route.tsx`, replace the index route's `<Navigate replace to="/goals/overview" />` with `<DefaultGoalsLanding />`.
- [x] 1.3 Updated `route.test.tsx` (the only test exercising the index route's redirect) to mock `useProjects()` and cover the new dynamic behavior. `section-tabs.test.tsx` and `posthog-provider.test.tsx` matched on `/goals/overview` in ways unrelated to the index redirect (already-active-route tab switching, analytics path grouping) and needed no changes.

## 2. Relabel Plan and All Goals

- [x] 2.1 Change the translated value of `nav.goals` to "Plan" and `goals.tabs.overview` to "All Goals" across `en`/`de`/`es`/`fr` (keys unchanged). Validated JSON syntax on all 4 files.
- [x] 2.2 No test asserted the literal rendered text "Goals"/"Overview" for these entries — `mobile-layout.test.tsx` and `section-tabs.test.tsx` assert against the i18n _key_ (`nav.goals`) under a `t(key) => key` mock, not the translated value, so they needed no changes.

## 3. Verify

- [x] 3.1 Ran `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and the scoped test suite for fast iteration - all clean.
- [x] 3.2 Ran the full PR-validation set AGENTS.md requires: `pnpm test:run` (1889/1889; one unrelated pre-existing flaky test, `section-tabs.test.tsx`'s keyboard-activation case, failed in the full run and passed in isolation both before and after this change) and `pnpm build` - clean.
- [x] 3.3 Manually verified on the running dev server: sidebar shows "Plan"; visiting bare `/goals` redirects straight to Current plan's project detail route; breadcrumb reads "Plan › All Goals"/"Plan › Projects" as expected; visiting Projects first, then clicking the sidebar's Plan entry, correctly returns to Projects rather than redirecting to the project detail route (last-visited-child memory still wins, confirmed live).
