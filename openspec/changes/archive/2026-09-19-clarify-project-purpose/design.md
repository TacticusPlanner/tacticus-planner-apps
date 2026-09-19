## Context

See `proposal.md` — Why. The constraints that shape the approach, all verified
against current source:

- **The creation sheet always submits the combined endpoint.**
  `use-goal-submit.ts` calls `createCombinedGoals` even for a single goal, and
  `entities/goal`'s single `createGoal` is exported with no production caller.
  So only `CreateCombinedGoalsRequest` needs the new field on this side.
- **The dashboard has no explanatory copy at all.** `projects-list-page.tsx`
  renders a bare `<h2>{t("goals.project.currentPlan")}</h2>` above the Current
  plan list. `project-management` has required an explanation since it was
  written; it was never implemented. The empty state has one thin sentence,
  `goals.project.noProjectDescription`.
- **Goal-side membership visibility already exists.** `GoalProjectBadges` renders
  a goal's memberships on desktop rows (`goals-list.tsx:150`), mobile cards
  (`goals-mobile-cards.tsx:118`), the detail sheet, and the detail view. `GP-28`'s
  goal-side half is already served; the missing half is on the project side.
- **The account-wide goal list is reachable anywhere** through `goalQueries` in
  `entities/goal`, which `AddGoalsToProjectSheet` already uses. Project detail
  itself already consumes `useGoalCatalog` and the project's own member list.
- **There is a precedent for a form-level checkbox**: the "Create another"
  `Checkbox` + `Field`/`FieldLabel` pair in `create-goal-sheet.tsx`'s
  `SheetFooter`.
- **Both project pages already have tours** — `projects-list-page.tutorial.tsx`
  and `project-detail-page.tutorial.tsx` — whose copy describes mechanics
  ("compare your Current plan with other projects") but never what a project is
  for.

## Goals / Non-Goals

**Goals:**

- Answer `GP-27`'s question where it is asked — on the Projects surfaces, in
  copy that is on screen when the user arrives.
- Give the removed switch behavior an explicit replacement the user chooses,
  rather than leaving "create it but don't plan it yet" unexpressible.
- Keep the whole change to copy, one checkbox, and one count.

**Non-Goals (design-level, beyond the proposal's scope statement):**

- No onboarding dialog, dedicated "what are Projects" page, or new tour steps —
  including in the goal-creation tour, whose single existing step is about
  acquisition sources and is left alone.
- No change to `GoalProjectBadges` or to where memberships are shown on goals —
  that half already works.
- No bulk pause/resume control. The API has a project-wide goal-status endpoint
  (`POST /me/projects/{id}/goals/status`), but exposing it is `GP-22` in
  Cluster 6, not this change.
- No change to which project Dailies and Insights operate on.

## Decisions

### Start-paused is a checkbox in the form body, not in the sheet footer

The control renders in `unit-goal-form-fields.tsx` directly below
`GoalProjectsField`, reusing the `Checkbox` + `Field`/`FieldLabel` pattern the
footer's "Create another" already establishes.

_Why not the footer, next to "Create another":_ the two look alike and mean
opposite kinds of thing. "Create another" configures the _form's_ behavior after
submit and is correctly transient; start-paused configures the _goal being
created_. Grouping it with membership keeps every "where does this goal go and is
it live" decision in one place, which is also where the reader is most likely to
be carrying the old assumption that the project choice decided it.

_Alternative considered:_ a two-way Active/Paused select. Rejected — it presents
a status choice as if more values were reachable, and an unchecked checkbox
already reads as "normal creation".

_The precedent is visual only — the state must not follow it._ `createAnother`
lives inside `useGoalSubmit`, which `use-create-goal-form.ts` constructs at line
332, _after_ `useGoalFormReset` at line 194; `resetForm` is passed _into_ the
submission hook, so nothing declared beside `createAnother` can be cleared by it.
That placement is correct for `createAnother`, which deliberately survives a
reset, and wrong for start-paused, which must not. The flag is therefore declared
with the other creation-form fields above line 194 and cleared inside
`useGoalFormReset` like any other field. The spec states the reset behavior
explicitly for this reason.

### The client sends `startPaused` only on the combined request

`CreateCombinedGoalsRequest` in `entities/goal/model/types.ts` gains an optional
`startPaused?: boolean`, and `use-goal-submit.ts` passes the form's value. The
single-goal `CreateGoalRequest` type is updated to match the API contract for
completeness, but nothing in the app sends it, so no call site changes.

Omitting the field entirely when the box is unchecked keeps the request body
identical to today's for the default path, which matters because the API's
default is what produces the Active goal.

### The explanation is static page copy, and the tours are updated to match

`GP-27`'s acceptance criteria rule out hover-only and hidden affordances, and a
Joyride tour is by definition something the user has to start. So the requirement
is satisfied by copy rendered on the dashboard itself; the tour copy is corrected
in the same change so the two do not say different things.

Placement: one short lead paragraph under the dashboard's own content area
describing what a project is and why more than one, and one line in the Current
plan section stating that Current plan is what Dailies and Insights use by
default. The dashboard has no page heading of its own (`project-management`
forbids one), so the lead paragraph is the first thing in the content area.

_Alternative considered:_ a dismissible info callout. Rejected — it adds
persisted per-user dismissal state for two sentences, and a dismissed callout
stops answering the question for exactly the users who dismissed it before they
had it.

### Desktop and mobile are not split

The explanations are prose in an already-stacking layout, and the start-paused
control is a checkbox in a Sheet that both breakpoints already render. Nothing
here diverges in behavior or interaction, so per the project's spec rules no
platform-specific scenarios are written. The only breakpoint concern is that the
dashboard copy must not push the first project card below the fold on a phone,
which is a length constraint on the copy rather than a layout split — hence
"short lead paragraph".

### "12 of 40 goals" counts non-archived goals on both sides

The two numbers come from different sources and would otherwise count different
sets — the defect that makes the ratio incoherent:

- The account total comes from `goalQueries.list(false)`, the same query
  `AddGoalsToProjectSheet` uses (so it is usually already warm when the user
  reaches project detail). `archived: false` means it **excludes** archived
  goals.
- The project's own number is today's `unitGoalSummary` count, `allRows.length`
  at `project-detail-page.tsx:315`, which is built from `projectGoals.goals` and
  **includes** archived members — `project-detail-page.tsx:101` filters them into
  `nonArchivedRows` separately precisely because they are there.

Left as-is, a project holding archived goals reports "14 of your 40" where the 14
counts rows the 40 does not, and a mostly-archived project can report more goals
than the account has.

**Decision: both sides count non-archived goals.** The project side switches from
`allRows.length` to `nonArchivedRows.length`, which is already computed on the
page. This deliberately changes the existing summary number for any project
containing archived goals — accepted, because a count paired with an account
total has to mean the same thing on both sides, and archived goals remain
reachable and counted by the Archived status filter, which has its own count.

_Alternative considered:_ requesting archived goals as well and comparing full
totals. Rejected — it adds a second account-wide query to every project detail
view to make a summary line include goals the user archived, and the page already
treats archived members as outside the working set everywhere else.

_Out of scope:_ the dashboard's per-card summaries (`projects-list-page.tsx`)
still count all members. They show no ratio, so nothing there is incoherent; making
the two surfaces agree is worth doing but is not this change's question.

The account total is a separate async source from the project's members, so the
summary must render correctly while it is pending. The spec forbids showing a
zero or guessed total; the implementation therefore falls back to the plain
`goals.project.unitGoalSummary` wording until the total resolves, rather than
rendering "12 of 0".

_Alternative considered:_ having the API return an account goal total on the
project response. Rejected — it is a contract change for a number the client
already has, and it would put a second source of truth for "how many goals do I
have" beside the list.

### Copy states the negative explicitly

Several scenarios require copy that says what membership does _not_ do. This is
deliberate: the users who reported `GP-27`/`GP-28` had already formed the
opposite belief, and behavior that silently stops happening does not correct a
belief someone already holds. The membership field's helper line and the
dashboard's Current plan line both name the boundary — membership organizes,
pause/resume activates.

### i18n

New keys live in the existing namespaces beside the copy they replace:
`goals.project.*` for the dashboard and project-detail strings,
`goals.create.*` for the start-paused label and its explanation, and
`tour.projectsList.*` / `tour.projectDetail.*` for the reworded steps.
`tour.createGoal.*` is untouched. No new namespace. All four locales (en, de, es, fr) are written
in the same task as the English copy.

## Risks / Trade-offs

- **Explanatory copy pushes project cards down, worst on a phone.** → The
  dashboard lead is one short paragraph and the Current plan line is one
  sentence; mobile verification at a sub-768px viewport checks that the first
  card is still reachable without meaningful scrolling.
- **Copy that explains a product decision ages badly if the decision changes.**
  → The decision is now spec'd in three capabilities across both repos, so a
  future reversal has to confront the requirements rather than only the strings.
- **A start-paused checkbox invites the reading that paused goals are somehow
  incomplete.** → Its helper text says the goal is created normally and simply
  left out of daily planning until resumed.
- **Applying this before the API half would ship a checkbox the server ignores**,
  silently creating Active goals. → The companion `clarify-project-purpose` in
  `tacticus-planner-api` applies first; the tasks make that ordering explicit and
  the manual verification covers the paused path end to end.
- **The account total can be stale relative to the project's members** if goals
  were created in another tab. → It is a proportional statement ("12 of 40"), not
  an invariant; both sources are TanStack Query caches that refetch on focus.

## Migration Plan

Frontend only: no persisted state, no stored preference, no data migration.
Rollback is a revert; goals created with `startPaused` remain Paused and are
resumable through the normal per-goal action, so a revert leaves no unreachable
state.

Apply the `tacticus-planner-api` companion first.

## Open Questions

- Whether the dashboard's lead paragraph should also name the Overview project
  filter as the "see one project's goals without leaving Overview" path.
  Deferrable: a sentence-level copy choice inside a requirement that is satisfied
  either way.
