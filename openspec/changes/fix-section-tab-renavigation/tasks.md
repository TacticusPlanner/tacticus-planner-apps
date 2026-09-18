## 1. Declare which child pages have a landing page

- [ ] 1.1 Add an optional boolean to `NavSubItem` in `nav-items.ts` meaning the child's own path is a landing page, and verify `pnpm typecheck` passes with every existing child unchanged (the field is optional, so no other entry needs editing)
- [ ] 1.2 Set the flag on `/goals/projects` and `/library/raid-bosses` only, and verify a unit test asserts exactly those two children carry it — so adding a third becomes a deliberate, reviewed act
- [ ] 1.3 Document beside the field why it is opt-in, naming the two behaviors that make a tab path unreturnable (`use-library-route-selection`'s URL canonicalization and `/dailies/raids`'s index redirect), and verify by reading the field's comment back

## 2. Test-harness affordances

These come first because the behavioral tasks below cannot be asserted without them.

- [ ] 2.1 Extend `renderTabs` in `section-tabs.test.tsx` so a test can observe history depth — for example a control that calls `useNavigate()(-1)` — and verify a test can distinguish one pushed entry from two
- [ ] 2.2 Extend the harness so a test can mount a route tree containing an index redirect, and verify the probe reports the post-redirect pathname; if mounting the real section routes proves to drag in lazy page modules or `ProtectedRoute`, use a local stand-in route tree that reproduces the redirect shape and say so in the test's comment

## 3. Re-navigation from a nested route

- [ ] 3.1 Add a click handler on `TabsTrigger` in `section-tabs.tsx` that navigates to the tab's own path when the child carries the landing-page flag, the tab is the current value, and the pathname is not already exactly that path — leaving `onValueChange` in place for real value changes — and verify a test asserts navigation from `/goals/projects/p1` to `/goals/projects`
- [ ] 3.2 Verify the same for `/library/raid-bosses/b1` returning to `/library/raid-bosses`, with a test
- [ ] 3.3 Verify activating a _different_ tab still navigates exactly once, using the depth affordance from 2.1, with a test asserting one Back press returns to the starting route
- [ ] 3.4 Verify activating the tab of the exact current page performs no navigation, with a test asserting the pathname is unchanged
- [ ] 3.5 Verify the active-tab highlight still follows the prefix rule, with a test asserting the parent tab reports `data-state="active"` on a nested route
- [ ] 3.6 Verify keyboard activation still navigates via `onValueChange`, with a test driving arrow-key movement across the tab row

## 4. Unflagged tabs keep today's behavior

- [ ] 4.1 Verify a Library character detail route does not re-navigate when the Characters tab is activated, with a test asserting the pathname is unchanged — the collection path would canonicalize to the first entity
- [ ] 4.2 Verify the same for machines-of-war and npcs detail routes, with a test for each
- [ ] 4.3 Verify `/dailies/raids/today` and `/dailies/raids/plan` do not re-navigate when the Raids tab is activated, with a test for each asserting the pathname is unchanged and, using 2.1's affordance, that no history entry was pushed

## 5. Correct the component's stale documentation

- [ ] 5.1 Update `section-tabs.tsx`'s doc comment so it states the component is rendered by the mobile header only, and verify by confirming `grep -rn "SectionTabs" apps/web/src --include=*.tsx` reports no desktop call site

## 6. Manual verification

Required data states — prepare before starting this group: at least one project so a project detail route exists; a raid boss reachable by detail route; a character reachable by detail route; access to `/dailies/raids/plan`.

- [ ] 6.1 Start the full local stack from the workspace root through the Aspire AppHost and verify both `web` and `api` report healthy before testing
- [ ] 6.2 On a viewport below 768px, open a project's detail route, activate the Projects tab, and verify the all-projects screen is shown
- [ ] 6.3 On the same viewport, open a raid boss's detail route, activate the Raid Bosses tab, and verify the picker is shown rather than another boss's detail
- [ ] 6.4 On the same viewport, open a character's detail route, activate the Characters tab, and verify nothing happens — confirming the user is not thrown to the first character
- [ ] 6.5 On the same viewport, open `/dailies/raids/plan`, activate the Raids tab, and verify the user stays on Plan; repeat from `/dailies/raids/today` and verify one Back press leaves the Raids section rather than appearing dead
- [ ] 6.6 Activate a different tab from each of those pages and verify one navigation occurs and the browser Back button returns to the previous page in one press
- [ ] 6.7 At or above 768px, confirm no tab row is rendered in the header and that the sidebar flyout still returns from a project detail route to the all-projects screen, so the desktop path is unchanged by this change

## 7. Gates

- [ ] 7.1 Run `pnpm test:run` and verify it passes
- [ ] 7.2 Run `pnpm typecheck` and verify it passes
- [ ] 7.3 Run `pnpm lint` and verify it passes
- [ ] 7.4 Run `pnpm lint:fsd` and verify it passes
- [ ] 7.5 Run `git diff --check` and verify it reports no whitespace errors
