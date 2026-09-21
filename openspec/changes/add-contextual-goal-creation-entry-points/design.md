## Context

See `proposal.md` - Why. Relevant existing shape, confirmed by reading the
code:

- `useCreateGoalLauncher()` (`create-goal-launcher-context.ts`) is a portable
  hook backed by a single `CreateGoalLauncherProvider` mounted in
  `app-shell.tsx`. Any component under the shell can call it; today only the
  global shell chrome and `goal-detail-sheet.tsx` do.
- `LaunchCreateGoal = (prefill?: CreateGoalPrefill) => void` — `prefill` is
  already optional, so a bare `launchCreateGoal()` call (no prefill) already
  opens a blank sheet. This is what makes the Overview toolbar button (no
  entity/project context to carry) pure UI wiring with zero new plumbing.
- `CreateGoalPrefill` is a discriminated union of three variants
  (`Level`/`Ascension`/`Unlock`), and **every** variant requires
  `entityType`/`entityId` alongside `projectIds`. There is no way to express
  "preselect this project, no entity chosen yet" with the current type — this
  is the actual gap GP-07/GP-08 need closed, not missing UI.
- `useProjectSelection` (`use-project-selection.ts`) already falls back to
  the user's default project whenever `selectedProjectIds` is empty and the
  sheet is open. This is the literal mechanism of GP-07's bug: opening the
  sheet with no prefill from a non-default project's context silently lands
  on the default project, because nothing ever calls `selectProjects` with
  the viewed project's id.
- The Project Detail empty-state copy (`goals.project.emptyProjectDescription`,
  already shipped) reads _"Use Add goals to put existing goals into it, or
  Create goal to make a new one."_ — it already names a "Create goal" action
  that does not exist on this page today. This independently corroborates
  GP-08's root cause: the gap is a missing button, not an unclear need. The
  new button's label is chosen to match this existing copy exactly.
- `goals-navigation`'s toolbar-row requirements already enumerate every
  control in Overview's filter row (Type/Sort/Group, project-membership
  filter, Planning Settings) and already specify that they compress to
  icon-only on mobile via `{isMobile ? null : t(...)}` (see
  `planningSettingsButton` in `goals-page.tsx` for the exact pattern). This
  row already renders on both breakpoints, so a button added to it
  automatically satisfies both CREATE-02 ("near filtering and sorting
  controls") and CREATE-03 ("mobile-reachable from Goals") — it is the same
  UI element, not two.

## Goals / Non-Goals

**Goals:**

- Two new UI entry points (Overview toolbar, Project Detail) wired to the
  existing launcher, on both breakpoints.
- Widen `CreateGoalPrefill` so a project can be preselected independently of
  an entity/goal-type prefill, without changing the meaning or shape of the
  three existing entity-based variants.

**Non-Goals:**

- No change to the creation sheet's internal form behavior (`goal-creation`
  capability) — this change only affects how the sheet is _launched_ and
  what it's pre-populated with on open.
- No change to `AddGoalsToProjectSheet` or the existing-goal assembly flow —
  it keeps its current meaning and is unaffected.
- No backend/API change. Project selection, the launcher, and the prefill
  mechanism are all client-side/IndexedDB-backed already.

## Decisions

**Widen `CreateGoalPrefill` with a fourth, project-only variant** rather
than making `entityId`/`entityType` optional on the existing three variants.

```ts
export type CreateGoalPrefill =
  | {
      entityType: "Character"
      entityId: UnitId
      goalType: "Level"
      requiredLevel: number
      projectIds: string[]
    }
  | {
      entityType: "Character" | "Mow"
      entityId: UnitId
      goalType: "Ascension"
      requiredProgression: Progression
      projectIds: string[]
    }
  | {
      entityType: "Character" | "Mow"
      entityId: UnitId
      goalType: "Unlock"
      projectIds: string[]
    }
  | { projectIds: string[] } // new: project-only, no entity/goal-type chosen yet
```

Alternative considered: make `entityType`/`entityId`/`goalType` optional
across the board. Rejected — it would let every existing call site
(`goal-detail-sheet.tsx`, `prerequisite-prefill.ts`) construct a
partially-specified prefill that `useCreateGoalPrefill`'s effects don't
actually support (they assume a concrete entity once `prefill.entityId` is
read), silently weakening type-checking for callers that have nothing to do
with this change. A discriminated fourth variant keeps every existing call
site exactly as strict as it is today and only adds a new state:
"project chosen, nothing else."

**Apply the project-only prefill in `useCreateGoalPrefill`'s existing
selection effect**, not the target effect. The existing selection effect
already calls `selectProjects(prefill.projectIds)` for every variant
(`use-create-goal-prefill.ts:41-49`); extend its guard to also run for the
new variant (skipping the entity/goal-type lines, which don't apply). The
second effect (target prefill: level/progression) stays gated on
`prefill.entityId` and is simply never reached for the project-only variant,
since it never becomes truthy for that shape.

**One button, added to the existing Overview toolbar row, not a separate
mobile-only affordance.** Considered a dedicated mobile FAB (matching the
global mobile-nav button's pill style) for CREATE-03. Rejected: the toolbar
row already renders on mobile (compressed to icon-only, per
`goals-navigation`), so a second, mobile-specific control would be a
redundant third entry point on that one screen (global nav button + toolbar
button + FAB) with no behavioral difference from the toolbar button. Follows
the same reasoning the cluster write-up already reached.

**Project Detail's Create Goal action lives beside Add Goals in the header's
action row** (`project-detail-header.tsx`, next to the existing
`data-testid="project-add-goals"` button), not inside the browsing-controls
row (project switcher/status filter/Group). It's a mutating action, not a
browsing control — same category as Add Goals, which it's placed next to.

## Risks / Trade-offs

- [Widening `CreateGoalPrefill` touches a type consumed by three existing
  call sites] → Mitigation: purely additive (new union member); existing
  variants and their field requirements are untouched, so existing call
  sites need no changes. Covered by existing + new unit tests on
  `use-create-goal-prefill.test.tsx`.
- [A user could read "Create goal" on both Overview and Project Detail and
  wonder which one to use when viewing a project] → Mitigation: this is the
  intended contextual behavior (GP-07/GP-08's whole ask) — Project Detail's
  action preselects that project; Overview's stays context-free. No new
  ambiguity beyond what "Add goals" already has on the same page.
