## Context

V2's Goals/Insights page already runs a day-by-day resource scheduler (`pages/goals/model/estimate/estimate.ts`, `estimate.domain.ts`) that is a faithful port of V1's `UpgradesService.generateDailyRaidsList`/`GoalsService.computeMaterialQuantityInfo`: cheapest-node-first energy spending, per-`battleId` daily-attempt caps, and priority-ordered shared-inventory allocation (`allocatePlanInventory`). It is fed by a need-derivation chain that turns a `GoalDetail` into farmable upgrade/shard needs — `goal-requirements.ts` (dispatches by goal type), `plan-insights-need.ts` (Rank/Ability need math), `progression-cost-calc.ts` (Ascension/Unlock need math), `farming-stages.ts` (staged targets) — all currently colocated under `pages/goals/model/*` because a `features/*` slice may not import another `features/*` slice (`features/rank-lookup`, which the need-derivation chain depends on), and this engine was a single-page consumer until now.

`estimatePlan`'s day loop already computes, internally, exactly the per-node raid counts Today needs — it just discards them, returning only aggregate `days`/`energyTotal`/`raidsTotal` per goal. "Today" is literally day 1 of that same loop, captured instead of thrown away. Raids Plan (V1's "Daily Raids" section) is the same loop's remaining days, captured the same way — see the day-1 breakdown decision below, extended. See `proposal.md` for why this change exists; this document covers only how the capabilities are built.

V1's `raidTicket` icon (`raids-day-view-stats.tsx`, `raids-plan.tsx`) is not a separate currency: `upgrades.service.ts` sets `raidsTotal = sum(day.raids.map(raid => raid.raidsTotal))`, itself `sum(raidsToPerform + raidsAlreadyPerformed)` — the same raid-attempt count our engine's `raidsPerformed` already tracks, just under a flavor icon. V1's "days unused" is also a specific threshold, not "any leftover energy": `freeEnergyDays = upgradesRaids.filter(x => settings.dailyEnergy - x.energyTotal > 60).length`. Both are ported as-is (see the whole-plan summary decision below).

## Goals / Non-Goals

**Goals:**

- Reuse the existing scheduling and need-derivation logic verbatim (same allocation order, same attempt-cap math) rather than reimplementing it for Dailies — the two call sites must never drift.
- Make the day-1 raid breakdown a first-class, tested output of the shared engine, not a Dailies-only side calculation.
- Keep the extraction backward-compatible for existing Goals/Insights callers: no change to `EstimateOutcome`'s existing shape or `estimatePlan`/`estimateGoal`'s existing call signatures.

**Non-Goals:**

- Not re-deriving or second-guessing V1's allocation/attempt-cap algorithm — it's ported, not redesigned.
- Not porting V1's live-tracked raid state (the "RAIDED" section, per-raid dialogs, character-filter click interaction) — Raids Plan is a read-only forward projection.
- Not porting V1's inventory/related-upgrades/in-progress/finished/blocked accordions — only "Daily Raids" itself.
- Not touching `pages/goals`' own Insights-specific aggregation (orb allocation, onslaught scoring, bottleneck ranking) — only the parts of that dependency graph Today/Raids Plan also need move.

## Decisions

### Extraction boundary: `features/goal-farming`

Move into a new `features/goal-farming` slice:

- `estimate.ts`, `estimate.domain.ts`, `estimate-blocked.ts` — the scheduling engine.
- `goal-requirements.ts` — per-goal-type need dispatch.
- `plan-insights-need.ts`'s `rankResourceNeed`, `rankSlotsRemaining`, `abilityResourceNeed`, `resourceLabel` — despite living under `model/insights/` today, this is need-math shared by both callers, not Insights-specific aggregation. Renamed to `goal-need.ts` in its new home to drop the misleading `insights` association.
- `progression-cost-calc.ts`, `farming-stages.ts`, and the smaller supporting calc files in `model/estimate/` (`mow-ability-calc.ts`, `rank-additional-target.ts`, `level-xp-cost.ts`, `shard-energy-estimate.ts`) — part of the same need-derivation graph; confirmed at implementation time and moved together, not split.

Left behind in `pages/goals`:

- `plan-insights-calc.ts` itself — Insights' own aggregation (orb allocation, onslaught-token scoring, bottleneck ranking, campaign/event insight labeling, potential-progress ratios) that only the Insights view needs.
- `orb-potential-allocation.ts`, `potential-progress.ts` — Insights-only.
- `per-project-estimate.ts` — the goal-creation-preview flow, specific to that page's composer UI, not something Today needs.

**Why this boundary and not just moving `estimate.ts`**: Today needs to go from "a project's active goals" to a schedule, which requires the need-derivation step, not just the scheduler. Moving only the scheduler would leave Dailies with no choice but to duplicate need-derivation (rank/ability/ascension/unlock upgrade-need math), which is exactly the drift risk this change exists to avoid. The line is drawn at "shared need + schedule math" vs. "Insights-view-only aggregation" — the latter has no reason to exist outside `pages/goals`.

**Alternative considered**: fork a Dailies-local copy of just the scheduling loop. Rejected — the two implementations would diverge silently over time (e.g. a future attempt-cap edge-case fix landing in one copy and not the other), which is the specific failure mode called out during discovery.

**FSD compliance**: `features/goal-farming` takes plain data in (`GoalDetail`, catalog maps, `dailyEnergy`) and returns plain data out; it does not import `features/rank-lookup` or any other feature. Each consuming page (`pages/goals`, `pages/dailies`) independently imports both `features/rank-lookup` and `features/goal-farming` and composes them — the same composition shape `pages/goals` already uses today, just duplicated at the page level instead of centralized in one page, per FSD's Strategy C/D for cross-page reuse.

### Day-1 breakdown: extend `spendDay`, don't fork it

`spendDay` (in `estimate.ts`) already computes `raidsToPerform` per node internally before discarding it into an aggregate. Extend its return type to also include a per-node breakdown (resource id, battle id, raids performed, energy spent, and the node's daily attempt cap), additive alongside the existing `{energySpent, raidsPerformed}` aggregate. `estimateGoal` and `estimatePlan` ignore the new field and keep their current behavior and return types exactly as-is — this is a non-breaking extension.

Because the attempt cap is shared across goals within a day (the fix above), "fully raided" cannot be read off a single breakdown entry's own `raidsPerformed` — two goals can each show 3/5 at a node whose combined 6 raids that day actually exceed... no, whose combined total (e.g. 5) hits the cap while neither entry alone does. The day-spend function (task 2.3) already builds the shared `attemptsUsedByBattle` map as its natural byproduct; expose it (battle id → total raids that day) alongside the per-goal breakdown entries, and have the UI derive "fully raided" for a given node by comparing that map's total to the node's cap, not the individual entry's count.

Factor `estimatePlan`'s per-day loop body (the "spend one combined day across all goals in priority order" logic, currently inline in its `while` loop) into a standalone function callable once. `estimatePlan` calls it repeatedly until every goal resolves (unchanged aggregate behavior); a new entry point calls it exactly once, over the selected project's in-scope goals, and returns the structured day-1 breakdown — this _is_ Today's schedule.

### Multi-day breakdown: the same day-spend function, called once per remaining day

Raids Plan needs exactly what Today needs, repeated: `estimatePlan`'s outer `while (pending.size > 0 ...)` loop (`estimate.ts`) already calls the day-spend function (task 2.3) once per day until every goal resolves. Extend `estimatePlan` to also collect that day's breakdown (task 2.4's structure) into an array, one entry per day, instead of only capturing it for a Today-only entry point. Today consumes index 0 (Day 1) of that array via the existing single-call `estimateTodaySchedule`; Raids Plan consumes the complete array from index 0 onward so the forward view is self-contained and begins with a card labeled "Today." This is additive to `estimatePlan`'s existing return shape, not a replacement — the existing `Map<string, EstimateOutcome>` callers (Insights) are unaffected.

Per-day energy/raid-attempt totals (for both Today's and each Plan day's own summary) are a simple sum over that day's breakdown entries' `energySpent`/`raidsPerformed` — no separate aggregate needs computing, they fall out of the same per-node breakdown data already being captured.

### Whole-plan summary stats: ported from V1's `upgrades.service.ts` formulas

- **Total days**: the loop's terminal `days` (already `estimatePlan`'s existing behavior, unchanged) — counted from Day 1, same as V1's `daysTotal = upgradesRaids.length`.
- **Total energy** / **total raid-attempt count**: sum of every day's breakdown totals (Today/Day 1 through the last day) — same as V1's `sum(upgradesRaids.map(day => day.energyTotal))` / `sum(...day.raidsTotal)`. The summary and rendered columns now cover the same complete range.
- **Days unused**: count of days where `dailyEnergy - dayEnergyTotal > 60`, the exact threshold V1 uses (`freeEnergyDays`) — ported as-is rather than redesigned to "any leftover energy," per this change's general policy of porting V1's algorithm verbatim.
- **Completion date**: `referenceDate + totalDays`, identical math to `estimateGoal`/`estimatePlan`'s existing `date` field.

### Pagination: reuse Bonus Raids' truncate-then-reveal pattern

Raids Plan renders only its first 3 day columns (Today, Day 2, Day 3) initially, with a "Show all days" control revealing the rest — deliberately the same UI pattern as Bonus Raids' top-3-then-"Show more" (not V1's own `upgradesPaging`/`allDaysExpanded` state shape, which this change doesn't port mechanically, just the resulting UX). The separate card-density (collapse/expand) toggle applies uniformly to every visible day column and has no effect on which days are paged in.

### Goal attribution in the day-1 breakdown

`estimatePlan`'s day loop already calls `spendDay` once per goal (each goal gets its own turn against the shared daily energy, in priority order), not once globally across every goal's combined need. This means the day-1 breakdown (task 2.1's per-node entries) can be tagged with the `goalId` of whichever call produced it at essentially no extra cost — the attribution already falls out of the existing per-goal call structure. Today's UI groups by this `goalId` (joined against the goal's unit/entity and target for the group header) rather than needing a second pass to reconstruct "which goal was this raid for." When the same upgrade is raided under two different goals' turns on the same day (both have uncovered need after inventory allocation), it legitimately produces two separate breakdown entries — one per goal — which is exactly the "appears once under each contributing goal" behavior the spec calls for, not a bug to dedupe.

### Fix: per-battle daily-attempt caps must be shared across goals within a day

`spendDay`'s `attemptsUsedByBattle` map is currently local to each call (`const attemptsUsedByBattle = new Map<string, number>()`, reset every invocation). Since `estimatePlan` calls `spendDay` once per goal per day, a battle node's attempt cap is today only enforced _within_ one goal's turn, not across every goal that turns to it on the same day — if two goals both want the same node on the same day, each gets its own fresh quota, silently exceeding the node's real cap in aggregate. This was invisible in Insights (which only ever showed multi-day aggregate totals, not exact per-node counts), but it becomes directly wrong once Today shows and groups exact per-node raid counts by goal.

Fix: give `spendDay` an optional `attemptsUsedByBattle` parameter, shared and threaded through every goal's call within the same simulated day; the caller creates one fresh map per day and passes it to each goal's turn that day, so a node's cap is actually enforced across every contributing goal before the next day resets it. `estimateGoal` (single-goal, no cross-goal contention possible) keeps letting each call default to a fresh map internally — behaviorally unchanged there. This also slightly tightens `estimatePlan`'s existing multi-day Insights estimates in the (likely rare) case where two goals contend for the same node on the same simulated day; the fix makes those estimates more accurate, not just Today's.

### Bonus Raids: same engine, called twice, diffed and re-sorted

Call the same single-day entry point twice: once at the real `planningSettings.dailyEnergy`, once at an effectively unlimited energy value (mirroring V1's `88_888_888` sentinel — magnitude chosen only to exceed any real plan's total need, not a meaningful constant). Bonus Raids is the unlimited run's breakdown entries whose resource id has zero raids in the real run's breakdown. Per the proposal, Bonus Raids is then sorted by the same goal-priority order the real schedule already uses (not the diff's incidental order, and not an independent efficiency ranking).

### i18n namespace

Add a dedicated `dailies` i18next namespace (`public/locales/en/dailies.json`), moving the placeholder strings currently inline in `common.json` (`dailies.title`, `dailies.description`) into it, following the established per-domain-namespace convention (`campaigns`, `progression`, etc.).

### Default project selection: Active, falling back to Default

`useProjects()` (moved to `entities/project`, see below) derives `activeProjectId` (the project whose `ProjectSummary.isActivePlan` is `true`) from the same project list query every other project-aware view in Goals uses, plus a new `defaultProjectId` (`ProjectSummary.isDefault`). Today's project selector defaults to `activeProjectId ?? defaultProjectId` on load — consistent with how the rest of the app already treats "the Active project" as the implicit default, not a Dailies-specific concept.

Every account has exactly one Default project, and `manage-projects-sheet.tsx` already prevents it from being deleted, so it is guaranteed to exist — `activeProjectId ?? defaultProjectId` therefore resolves to a real project in every normal case. The "no project available" empty state is reached only in the genuinely exceptional case of the project list failing to load or being empty, not as part of ordinary use.

### Extracting `entities/project`

`pages/goals` currently owns everything project-related, but Today needs a slice of it too — the same "reused by 2+ consumers with a stable boundary" test used for `features/goal-farming` above applies here, just one layer down (project is a business domain model, not a user action, so it belongs in `entities/`, not `features/`).

Move into `entities/project` (which already holds `ProjectSummary`'s type and CRUD API — this only adds the pieces genuinely shared beyond that):

- `use-projects.ts` (`pages/goals/model/projects/` → `entities/project/model/`) — the project-list query plus `activeProjectId`/`defaultProjectId` derivation. Both Goals and Today need "the list of projects, with which one is Active/Default" as the same read model; there is no reason for Dailies to duplicate this query.
- `ProjectColorDot` (`pages/goals/ui/shared/` → `entities/project/ui/`) — a project's color indicator, already documented as "the single visual shared by every place a project shows up"; Today showing a project selector is one more such place.
- `projectMarkerSuffix` (`pages/goals/model/projects/project-marker.ts` → `entities/project/model/`) — the "(Default, Active)" label suffix, pure formatting over `ProjectSummary`'s domain fields, not page-specific.
- A new `ProjectSelect` UI component (`entities/project/ui/project-select.tsx`), factored out of `ProjectToolbar`'s inline `<Select>` block: given `projects`, `projectId`, `onProjectIdChange`, renders the picker (color dot, name, Active marker, Archived filtered out) with no manage/bulk-action affordances. This is the actual reusable "project selector" — Today composes it directly; `ProjectToolbar` composes it too instead of inlining its own copy.

Left behind in `pages/goals`:

- `ProjectToolbar` — Goals-page-specific composition (the select plus manage/activate/pause-all/resume-all actions and `ManageProjectsSheet`), not something Today needs; it now imports `ProjectSelect` from `entities/project` instead of inlining a `<Select>`.
- `manage-projects-sheet.tsx`, `project-color-picker.tsx`, `use-project-actions.ts` — project create/edit/delete/activate/bulk-status management, exclusive to Goals' own UI.
- `use-project-goals.ts`, `use-goal-projects.ts`, `use-project-selection.ts`, `goal-projects-field.tsx` — goal-to-project membership and the Create Goal drawer's multi-project checklist, unrelated to "which single project is Today looking at."

**Why not extract more**: everything left behind is either page-specific orchestration (bulk actions, the manage sheet) or a different domain question entirely (goal-project membership) that Today never touches. Pulling those into `entities/project` too would be exactly the "excessive entities" anti-pattern the FSD guide warns against — extract what's actually reused, not everything with "project" in the name.

### Extracting `features/project-management` (a deliberate exception to "don't extract single-use code")

Move `use-project-actions.ts` (activate, bulk pause/resume, member reorder, create, save) and its `reorderedMemberIds` helper, plus `manage-projects-sheet.tsx`, `project-color-picker.tsx`, and `project-toolbar.tsx` (all currently under `pages/goals`) into a new `features/project-management` slice. Together these are one cohesive user action — "manage a project's identity, active/paused state, and membership order" — not a domain model, so `features/`, not `entities/`, is the right layer; `ProjectToolbar` composes `entities/project`'s `ProjectSelect` internally, same downward-only import direction as everywhere else in this change.

**Unlike the two extractions above, this one has no second consumer today** — Today is read-only and never activates, pauses, or edits a project, and nothing else in this change's scope does either. FSD's own guidance is explicit that single-use code extracted to `features/` is an anti-pattern (Steiger's `insignificant-slice` rule exists to catch exactly this), and normally this would stay in `pages/goals` under "pages first" until a real second consumer appeared.

This extraction happens anyway, at explicit user direction, as a deliberate exception rather than a discovered need — recorded here per FSD's own escape hatch ("if you must break a rule, document the reason"). Concretely: if Steiger flags the new slice as `insignificant-slice`, that flag should be treated as expected and left in place (or the rule locally suppressed for this slice with a comment pointing at this section), not treated as a signal to fold the code back into `pages/goals`.

### UI composition and routing

Reuse the `/progress` page's existing pattern exactly: shadcn `Tabs`/`TabsList`/`TabsTrigger` driven by route location, with a nested `RouteObject[]` (index redirect + one real route per tab, each `lazy`-imported) and `<Outlet/>` for tab content — `/progress/route.tsx` is the direct template (`{ index: true, element: <Navigate replace to=".../onslaught" /> }` plus one `{ path: ..., element: ... }` per tab). Every tab is consequently its own addressable route, not client-only tab state — applied twice, once for Dailies' 6 primary tabs and once for Raids' 2 sub-tabs:

```
/dailies                    → redirect to /dailies/raids
/dailies/raids              → redirect to /dailies/raids/today
/dailies/raids/today        → Today (implemented)
/dailies/raids/plan         → Raids Plan (implemented — V1's "Daily Raids" section only)
/dailies/shops              → placeholder
/dailies/onslaught          → placeholder
/dailies/salvage-run        → placeholder
/dailies/arena              → placeholder
/dailies/guild-raids        → placeholder
```

Raids' own sub-route file nests under the Dailies route the same way `/progress`'s children nest under `app/routes.tsx` — each level owns only its own tab bar and redirect, per FSD's rule that a page slice never reaches into another page's internals. Reuse the existing shared "Under Construction" placeholder component for the five unimplemented primary tabs rather than building new placeholder UI.

### Responsive composition and Joyride ownership

Desktop and mobile expose the same routes, controls, schedule information, truncation behavior, and empty states. Use `useIsMobile()` only where the presentation needs to recompose at the 768px breakpoint; a grid becoming a single column or a tab list becoming horizontally scrollable is responsive reflow, not a second product behavior. Keep the same semantic control names and stable `data-testid` targets across both layouts wherever the rendered element is the same.

Raids Plan's day cards retain the same ordered, truncate-then-reveal interaction on both layouts. Desktop may place the visible cards in a horizontal row while mobile stacks or scrolls them within the available width, but the first three visible days, "Show all days" action, and collapse/expand behavior remain identical. This avoids duplicating platform-specific scenarios where no behavioral difference exists.

The global Dailies destination is already covered by `shared/tour/general.tutorial.tsx` on desktop and mobile, and its selectors do not change when the placeholder route is replaced. Dailies' primary tabs and Raids' sub-tabs are local to the new pages, so Today and Raids Plan each get a co-located tutorial hook registered with `useTourPageSteps`; their steps include the relevant local navigation as well as page content. Each hook returns both desktop and mobile step arrays; reuse selectors and ordering when targets are shared, but provide platform-specific targets or ordering when responsive composition changes what is visible. Tutorial titles and content live in the `dailies` i18next namespace under `tour.<page>.steps.*`.

**Alternative considered**: one desktop-only tutorial reused blindly on mobile. Rejected because a target that is moved, collapsed, or unavailable at the mobile breakpoint can make the tour point at the wrong element or stall, even when the underlying page behavior is otherwise the same.

### Active event filtering and shared campaign-location presentation

The Dailies hook classifies event campaign groups from catalog definitions (`releaseType: event`) and filters the battle collection before it reaches the farming engine. Standing campaigns always survive; event battles survive only when their group id matches the single `live-progress.activeCampaignEventId`. This makes the rule apply identically to Today, Bonus Raids, and every Raids Plan day, rather than hiding inactive locations after calculations have already selected them.

The same filtered collection also supplies a battle-id-to-location view model built with `campaignDescriptor`, `useCampaignDisplay().shortLabel`, and `campaignIcon`. `RaidSchedule` renders those through the shared `LocationChips` component already used by Character Lookup, appending the raid count and retaining its secondary variant for a fully raided node. A raw battle id remains only as defensive fallback text when catalog metadata cannot be resolved.

## Risks / Trade-offs

### Icon-led density without duplicated responsive markup

The Dailies view model exposes visual identity, not rendered UI: each goal carries its unit id/type and each resource carries either upgrade metadata or a shard-unit id. `RaidSchedule` resolves those through the existing shared `EntityIcon`/`UpgradeIcon` components. The page keeps one semantic DOM for both breakpoints; Tailwind responsive classes compress padding, align headings and stats into rows on mobile, and switch the goal groups to an auto-fit grid on desktop. Auto-fitting the groups rather than each group's inner resource list prevents a one-resource goal from becoming one page-wide card. Summary metrics use decorative icons alongside translated labels, so icon recognition improves scanning without becoming the only accessible meaning.

For the common unlock/ascension case where a goal has exactly one scheduled resource and that resource is its own character shards, the shared schedule detects the matching shard/unit ids and folds the goal heading into the resource card. This is a presentation-only normalization over the same entry: the combined card keeps the unit/target heading semantics, a screen-reader-only shard label, raid total, and every node chip, while removing the duplicate portrait and visible “<unit> shards” identity. Goals with multiple resources keep their separate group heading.

Raids Plan uses an auto-fit outer day grid with a readable minimum column width. Its nested resource schedule remains a single-column compact list inside each day card, avoiding viewport-based nested grids that split an already narrow day column into three cramped columns. Today, which owns the full content width, uses an auto-fit resource grid.

- **[Risk]** The extraction touches code the live Goals/Insights page depends on today → **Mitigation**: the move is a relocation plus one additive field, not a rewrite; existing `estimate.test.ts` and friends move with their source files and must continue passing unchanged, plus new tests cover the day-1 breakdown and Bonus Raids diff specifically.
- **[Risk]** `spendDay`'s per-node breakdown could silently disagree with its own aggregate counts if the extension is implemented carelessly (e.g. breakdown entries not summing to `raidsPerformed`) → **Mitigation**: test the invariant directly (breakdown sums equal the aggregate) alongside the existing scheduling tests.
- **[Risk]** Moving `plan-insights-need.ts` out of `model/insights/` could be missed by an import left pointing at the old path → **Mitigation**: this is a mechanical move; rely on the compiler (TypeScript) to catch stale import paths rather than a manual audit.
- **[Risk]** Sharing `attemptsUsedByBattle` across goals within a day (the cap fix above) changes existing `estimatePlan` output, not just new code — any existing Insights test asserting a specific multi-day estimate that happens to involve two goals contending for one node on one simulated day could see its expected numbers shift slightly → **Mitigation**: this is a correctness fix, not a behavior choice, so an affected existing test should have its expected value corrected, not the fix reverted; call this out explicitly in the PR/test-update if it surfaces during 1.5's test run.
- **[Risk]** Extracting `entities/project` touches `ProjectToolbar`, a component the live Goals page depends on for its own project filter/manage/bulk-actions UI → **Mitigation**: `ProjectToolbar` keeps its own behavior and props unchanged, only swapping its inline `<Select>` for the extracted `ProjectSelect`; existing `project-toolbar.test.tsx`/`manage-projects-sheet.test.tsx` move/adapt with the source and must continue passing unchanged (task 1.12).
- **[Risk]** `features/project-management` is extracted with no current second consumer, which is itself a deviation from this project's normal extraction bar → **Mitigation**: treated explicitly as a deliberate, user-directed exception (see decision above), not a discovered-reuse extraction; if it turns out to need a second consumer to justify itself long-term, that's a call for a later change, not a reason to block this one.
- **[Risk]** `estimatePlan`'s day loop can run up to `MAX_DAYS` (1000) before giving up — collecting a full per-day breakdown array for that many days (rather than just aggregate counters) is a larger, longer-lived allocation than today's behavior → **Mitigation**: real plans resolve in single/low-double-digit days in practice (`MAX_DAYS` exists only as a non-terminating-farm guard); no special-casing needed unless profiling surfaces an actual problem, per this project's "don't build for hypotheticals" norm.
- **[Risk]** Today appears both on its focused tab and as the first Raids Plan column, so future changes could accidentally derive the two views independently → **Mitigation**: both views consume Day 1 from the same shared schedule engine and tests assert the Plan begins with that day labeled "Today."
