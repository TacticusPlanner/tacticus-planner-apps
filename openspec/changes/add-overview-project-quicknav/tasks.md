## 1. Build `OverviewProjectQuicknav`

- [x] 1.1 Extract `useHomeProjects`' inline "Current plan first, non-archived only" ordering (`current ? [current, ...others] : others`) into a small shared helper, e.g. `orderCurrentPlanFirst(projects)` in `features/project-management`, and have `useHomeProjects` call it instead of inlining it. Unit test the helper directly.
- [x] 1.2 Create `apps/web/src/fsd/pages/goals/ui/goals-board/overview-project-quicknav.tsx`. Mobile path (`useIsMobile()` true): `useHomeProjects(3)` rendered through `ProjectSummaryRow` inside a `Card`, mirroring `ProjectsWidget`'s loading/error/empty/populated states and its "+N more" link to `/goals/projects`. Add unit tests covering each state, mirroring `projects-widget.test.tsx`'s cases.
- [x] 1.3 Desktop path: sourced from the caller's already-fetched project list (see note below — not a second `useProjects()` call) plus `orderCurrentPlanFirst`, rendered as a horizontally-scrollable single row of chips (color swatch + name, Current plan first, archived excluded), a trailing "All projects" link chip to `/goals/projects`, a skeleton while loading, and nothing rendered on failure or on an empty project list. Unit tests cover populated/loading/failure/empty.
- [x] 1.4 Activating a chip or card navigates to `/goals/projects/{id}` without changing Current plan (reuse the same `navigate` pattern `ProjectsWidget` uses). Tested for both platforms.

## 2. Wire into Overview

- [x] 2.1 Render `OverviewProjectQuicknav` in `goals-page.tsx` above the existing control row (`GoalFilters`/status filter/Planning Settings). `goals-page.test.tsx` updated for the new element (and a `useNavigate` mock the new child needs); no tutorial step targets shifted — the new element only prepends, it doesn't reorder existing testids.

## 3. i18n

- [x] 3.1 Add strings for the desktop chip row's "All projects" link and any new `aria-label`s, across `en`/`de`/`es`/`fr`. Reuse `home.projects.*` keys where the copy is identical rather than duplicating them under a new namespace. Validated JSON syntax on all 4 files.

## 4. Verify

- [x] 4.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` (confirms no page-to-page import violation), and the scoped goals test suite (`pnpm exec vitest run src/fsd/pages/goals`) for fast iteration - all clean.
- [x] 4.2 Before calling this done, run the full PR-validation set AGENTS.md requires: `pnpm test:run` and `pnpm build` - all clean.
- [ ] 4.3 Manually verify on the running dev server, desktop and mobile: the quick-nav appears above Overview's controls, Current plan first, archived excluded, clicking an entry opens that project's detail route without changing Current plan, and mobile's widget matches the home page's Your Projects widget's behavior (cap, "+N more", empty/loading/error states). Left unchecked — this implementation ran in an isolated worktree with no dev server to verify against; needs a manual pass against a running stack before this change is considered fully done.
