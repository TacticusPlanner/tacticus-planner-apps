## 1. Settle the energy model

- [x] 1.1 Take the Decision 1 outcome (Option A keep-and-communicate, or Option B
      per-goal budget) to the team and record it in `design.md` Decision 1 with
      the date and who decided. Verify: `design.md` no longer says OPEN, and
      "Open Questions" is empty. **Nothing below starts before this.**
- [x] 1.2 **N/A — Option A was chosen, so no re-scope is needed.** (If Option B
      had been chosen: stop and re-scope: replace
      `specs/goal-farming-estimates/spec.md` with the per-goal-budget
      requirement, add a `daily-raids-plan` delta for the changed meaning of
      `summary.totalEnergy` / `daysWithUnusedEnergy` / the day columns, and
      rewrite §2 as an engine change. §3-§5 are unaffected either way.)

## 2. Pin the contention model (Option A)

- [x] 2.1 Add a `runPlanSchedule` contention test to
      `apps/web/src/fsd/features/goal-farming/lib/estimate-plan.test.ts`, built
      on the spec's worked example: `dailyEnergy` 100, a 10-energy node with no
      binding attempt cap, Trajann needing 25 raids at priority 1 and Aesoth
      needing 10 raids at priority 2. Verify Trajann's outcome is 3 days and
      Aesoth's is 4, and that Aesoth alone (same inputs, no Trajann) is 1 day —
      the divergence V1 reports.
- [x] 2.2 Add the reordering case to the same test: move Aesoth to priority 1 and
      verify the outcomes become Aesoth 1 day and Trajann 4 days (not a mirror of
      the 3/4 base case — Aesoth alone finishes in one day, and Trajann then
      farms on the remainder). The pair of cases is what pins priority-order
      contention rather than two magic numbers.
- [x] 2.3 Add a flat-supplier case: give Aesoth a supplier covering its whole
      need and verify it completes on day 1 despite Trajann draining the pool —
      pinning the deliberate energy-free path at `estimate-plan.ts:147-177`.
      Verify `pnpm --filter web exec vitest run src/fsd/features/goal-farming/lib/estimate-plan.test.ts` passes.

## 3. Show a date in the goal-detail estimate

- [x] 3.1 Render `EstimateCell` (already exported from
      `apps/web/src/fsd/pages/goals/ui/goals-board/goal-row-shared.tsx`) from
      `goal-estimate-section.tsx` for the non-blocked, estimate-present case,
      keeping that section's existing `goals.estimate.blocked.*` and
      `goals.detail.unavailable` text for the other two. Verify the section shows
      the same "📅 Oct 11 · in 22 days" content the Goals list row shows for the
      same goal.
- [x] 3.2 Move the framing labels inside the estimate-present branch. Today
      `goal-estimate-section.tsx:23` renders the `goals.detail.isolatedEstimate`
      badge unconditionally, above the blocked/unavailable text — so a Blocked
      goal shows "Isolated estimate" with no estimate beneath it. Render the
      badge when `isolated` and a date is shown, the new
      `goals.detail.planAwareEstimate` caption when `!isolated` and a date is
      shown, and neither otherwise. Verify in the test from 3.4: isolated renders
      the badge and no caption, plan-aware renders the caption and no badge, and
      a blocked estimate renders neither.
- [x] 3.3 Add `goals.detail.planAwareEstimate` to
      `apps/web/public/locales/en/common.json` and real de/es/fr translations in
      the three sibling files, at the quality of the surrounding `goals.detail.*`
      keys. Verify by opening all four files and confirming the key is present
      and genuinely translated — **no existing test covers `goals.*` key
      parity** (`*-translations.test.ts` covers only dailies, shops, team,
      events, and library), and `pnpm typecheck` catches only a missing **en**
      key via `i18next.d.ts`. Run `pnpm --filter web typecheck` as the en-side
      check.
- [x] 3.4 **Create** `goal-estimate-section.test.tsx` in
      `apps/web/src/fsd/pages/goals/ui/goal-detail/` (the directory has
      `goal-detail-sheet.test.tsx` and `goal-detail-view.test.tsx` but no
      per-section test). Cover: estimated + isolated, estimated + plan-aware,
      Blocked (reason text, no date, no framing label), and no estimate
      (`goals.detail.unavailable`, no date, no framing label). Verify
      `pnpm --filter web exec vitest run src/fsd/pages/goals/ui/goal-detail/goal-estimate-section.test.tsx` passes — it currently
      matches zero files and exits non-zero.

## 4. Gates

- [x] 4.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`,
      and `git diff --check`. All green.

## 5. Manual verification

Required data states: a signed-in account with a project holding **at least three
Active goals at different priorities**, all estimable (not Blocked), and **one
Blocked goal**. If the account has no Blocked goal, deselect every acquisition
source on one Unlock goal to produce one. No "goal in no project" is needed —
the isolated case is reached by opening a project goal from the cross-project
Goals page (see 5.3).

- [x] 5.1 On the full Aspire stack (workspace root, wait for `web` and `api`
      healthy), open the **project detail** page and note the lowest-priority
      goal's Done By date. Open that goal's detail sheet from there: the Estimate
      section shows the same localized date and day count, plus the plan-aware
      caption and no isolated badge.
- [x] 5.3 Open **the same goal** from the cross-project Goals page. That surface
      estimates goals one at a time (`goals-page.tsx:381` passes `isolated`), so
      the sheet shows the isolated badge, no plan-aware caption, and a date that
      may differ from 5.1's. Confirm both readings are present and labeled —
      this is the case a goal's project membership alone cannot distinguish.
      **Verified 2026-09-21**: Z'Kar showed "Sep 22 · in 2 days" with the
      isolated badge on All Goals and the plan-aware caption on the project
      page, while belonging to "My Goals · Current plan".

## 6. Deferred / out-of-session

Skipped by the repository owner on 2026-09-21 rather than mutating a live
profile or chasing a broken tool. Each is covered by automated tests; none
gates the specified behavior, which was verified live in 5.1 and 5.3.

Tracking issue: **not yet filed** — open one in `TacticusPlanner/tacticus-planner-apps`
referencing this change before relying on these being picked up.

- [ ] 6.1 (was 5.2) Reprioritize a goal to the top of its project and confirm its
      date moves earlier. **Deferred**: reorders goals in the owner's real
      "My Goals" project through the live API, and a failed drag leaves the
      ordering wrong. The behavior itself is pinned by task 2.2's automated
      reordering case (Trajann 3d/Aesoth 4d becomes Aesoth 1d/Trajann 4d).
- [ ] 6.2 (was 5.4) Open a goal whose **estimate** is Blocked and confirm the
      blocked reason renders with no date and neither framing label.
      **Deferred — required data state unavailable**: the account has no
      estimate-Blocked goal (its 10 "blocked" goals are dependency blockers, a
      different concept), and producing one means stripping every acquisition
      source from one of the owner's Unlock goals. The sibling
      no-estimate case _was_ verified live (Bellator rendered "Unavailable" with
      no stray badge — the defect this change fixes), and the Blocked branch is
      covered by `goal-estimate-section.test.tsx`.
- [ ] 6.3 (was 5.5) Repeat 5.1 below 768px. **Deferred**: the Spanish
      text-expansion half was verified at desktop width ("22 sept · en 2 días"
      with the caption wrapping cleanly, no truncation), but `resize_window`
      reported success without changing the viewport, so the sub-768px check
      never actually ran. The detail sheet is one component on both platforms.
