## Context

See `proposal.md` — Why. Three facts shape the approach:

- The grouping logic already exists, inline in `goals-page.tsx`: a `groupKey(row)`
  returning `entityType:entityId`, `goalType`, or `"all"`, and a `rowGroups`
  partition rendered as a `<section>` with an `<h2>` per group.
- `GoalFilters` (in `entities/goal`) already owns the control and its
  `GoalGroupValue = "none" | "unit" | "type"` type, and both routes already render
  it. Its header records a deliberate boundary: the control lives in the entity
  slice, while _applying_ filter/sort/group to rows "stays with that page
  (`GoalRow` is page-local)".
- `GoalsList` on project detail is already rendered with `reorderEnabled={false}`,
  so grouping cannot interact with row reordering on this route.

## Goals / Non-Goals

**Goals:**

- Make the Group control functional on project detail, with one implementation
  shared by both routes rather than a second copy.
- Change project detail's initial grouping to goal type.

**Non-Goals:**

- No change to Overview's initial grouping, which stays "none".
- No change to unit priority, the Reprioritize Units flow, or `projectUnitPlans`.
- No new grouping dimensions. Cluster 9's `GP-19`/`GP-20` may add view-level
  grouping features later; this change only makes the existing three work here.

## Decisions

### Grouping moves to a shared module inside the goals page slice

`groupKey`/`rowGroups` move to `pages/goals/model/shared/`, consumed by both
`goals-page.tsx` and `project-detail-page.tsx`. Both routes live in the same page
slice, so this is an intra-slice extraction with no FSD boundary crossed.

It deliberately does **not** move into `entities/goal` alongside `GoalFilters`,
even though that is where the control lives. `GoalFilters`' own header states the
reason: grouping operates on `GoalRow`, which is page-local, so the entity slice
would have to learn a page type to host it. The existing split — entity owns the
control, page owns the application — is kept.

_Alternative considered:_ mirroring the logic inside `project-detail-page.tsx`.
Rejected, and `use-goal-catalog.ts` is the precedent _for_ extracting rather than
against it: it is a single module in this same `model/shared/` directory that both
routes already import, and it mirrors `pages/library/.../use-character-lookup-catalog.ts`
— a different page slice — precisely because that would have been a cross-slice
import. Here there is no boundary to avoid.

### Group headings are rendered by each page, not by the shared module

The shared module partitions rows and reports each group's dimension and
identifying row; each page renders the heading itself. A unit heading needs
`getEntityName` from `useGoalCatalog` and a type heading needs `t`, both of which
each page already has. Returning labels from the shared module would make it own
translation and catalog lookup for no gain.

### Project detail's default lives in its own initial state, and persists across projects

The differing default is one `useState` initial value per route — `"type"` on
project detail, `"none"` on Overview — not a prop threaded through `GoalFilters`
or a per-route branch inside shared code.

That initial value applies when the detail route is first opened, not per project.
`projects/:projectId` is declared without a `key`, so switching projects through
the in-header `ProjectSelect` re-renders the same mounted component and every
filter's state survives — which is already true today for status, Type and Sort.
Group therefore persists too, deliberately: resetting only Group on each switch
would make it the one control that behaves differently from its three siblings,
and a user who chose unit grouping to compare two projects would lose it exactly
when they switched. `config.yaml` requires this to be stated rather than left to
the implementation, so it is now a requirement rather than an emergent behavior.

### Sort orders unit blocks, not their contents

The removed requirement guaranteed each unit block showed its goals "in automatic
execution order". `Goal order inside a unit is automatic` does not carry that
guarantee forward — it governs _canonical stored_ order ("WHEN canonical order is
produced"), not display — and project detail's default Sort is `"updated"`, so
without a rule a unit block would render newest-first and could show a Rank goal
above the Ascension it depends on.

So when grouped by unit, Sort orders the blocks and the goals inside each block
keep their dependency-first order. A dependency rendered below its dependent
misrepresents the plan, which is a correctness problem rather than a preference.
Under the other dimensions Sort behaves normally, because no such relationship
holds between the rows in a type group.

### Recorded consequence: unit order is no longer visible on arrival

Defaulting to goal type means units are distributed across type blocks, so the
route's unit-centric model — unit ordering, `projectUnitPlans`, and
`project-management`'s "Users prioritize units rather than goals" — is not
apparent when a project is opened. Reprioritize Units remains the surface that
shows and changes unit order, and the unit grouping dimension remains one
selection away. This was chosen deliberately over defaulting to unit grouping.

## Risks / Trade-offs

- **The removed requirement's unit blocks were also how "each unit appears once"
  was guaranteed.** → The replacement requirement keeps that behavior verbatim for
  the unit dimension; it is now conditional on selecting it rather than absent.
- **Two routes now share one grouping module, so a regression hits both.** → The
  extraction is behavior-preserving for Overview, and Overview's existing grouping
  tests are kept as the regression net for it.
- **A project with many goal types renders many small blocks.** → Same behavior
  Overview already has when grouped by type; no new presentation is introduced.

## Migration Plan

No data migration and no API involvement. Rollback is a frontend revert. The only
user-visible state that changes is the initial value of a client-side filter.
