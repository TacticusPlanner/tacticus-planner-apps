## 1. Contextual project creation

- [ ] 1.1 In Goals Overview, host the existing `ManageProjectsSheet` in blank create mode using feature public APIs and a local open state; verify an Overview component test opens the blank form without navigation or filter reset.
- [ ] 1.2 Add a labeled Create project action to the quick-nav area on desktop and mobile, including the empty, loading, and project-list error branches; verify component tests at both breakpoints distinguish those states and retain the current list/retry behavior.
- [ ] 1.3 On successful creation, refresh the desktop chips/mobile widget and keep the route, membership filter, and Current plan unchanged; on failure, retain entered form fields for retry. Verify mutation and page tests for both outcomes with a populated and an empty project list.

## 2. Copy, tutorial, and verification

- [ ] 2.1 Add or reuse localized Create project copy in the existing `common` namespace for en/de/es/fr with real translations; verify locale completeness and rendered accessible labels at both breakpoints.
- [ ] 2.2 Update `goals-page.tutorial.tsx` for the new desktop/mobile creation affordance and add corresponding `tour.goalsOverview.steps.*` keys in all four locales alongside it; verify automated tour-selector/copy tests below and at/above 768px.
- [ ] 2.3 Manually verify through the authenticated Aspire stack below and at/above 768px with no projects, multiple projects, a project-list failure, and a create failure: open the sheet from Overview, create a project, retain the current Goals filter/route/Current plan, confirm the Projects dashboard's own action still works, and run the Goals Overview tour at both widths.
- [ ] 2.4 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass for the completed change.
