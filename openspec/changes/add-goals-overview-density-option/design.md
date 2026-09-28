## Context

See `proposal.md` - Why. Relevant existing shape, confirmed by reading the
code on `feat/global-goal-priority`:

- `GoalsList` (`goals-list.tsx`) switches between `GoalsTable` (desktop) and
  `GoalsMobileCards` (mobile) via `useIsMobile()`, and is shared between the
  Goals page and Project Detail (`project-detail-goals.tsx` imports it
  directly).
- The Goals page (`goals-page.tsx`, `/plan/goals`) is one priority-ordered
  list: there is no Sort control, Active/Paused rows carry a leading drag
  handle (`goal-row-drag-handle`) on desktop, and mobile has a reorder mode
  (`goals-mobile-reorder-toggle`) that swaps the list for collapsed
  drag-only cards (`goals-list-reorder-cards`).
- Desktop rows are a fixed `h-14`; Rank/Ability rows below their required
  level nest level-requirement sub-lines inside the Goal, Progress and
  Remaining cells (`integrate-level-progression-into-rank-goals`).
- `goal-list-layout` already commits to one fixed row height/card structure
  per platform, i.e. exactly one density today, not a toggle. This change
  adds a second, denser option alongside it rather than replacing the
  default.
- The page already has one precedent for a persisted, per-browser view
  preference: `group` (`goals.overview.group`, via `usePersistedSelection`
  from `@/shared/lib`), typed with a `GoalGroupValue` union and an
  `isGoalGroupValue` guard exported from `@/entities/goal`. The storage key
  prefix stays `goals.overview.*`: it is an internal key, and renaming it
  would reset users' saved Group choice.
- `GoalsListProps` (`goal-row-utils.ts`) is already an options bag with
  several optional, page-vs-project conditional fields (`reorderEnabled`,
  `mobileReorderActive`, `project`) — a new optional `density` field fits
  the same shape.

## Goals / Non-Goals

**Goals:**

- A single new optional `density` prop threaded through `GoalsList` →
  `GoalsTable`/`GoalsMobileCards`, defaulting to the existing presentation
  when omitted, so Project Detail needs zero changes.
- Reuse the existing persisted-preference pattern (`usePersistedSelection`)
  rather than introducing a new persistence mechanism.

**Non-Goals:**

- No change to what data each row/card computes or fetches — density only
  changes which already-computed pieces render.
- No third density level. Two values (Comfortable/Compact) match what
  `GUI-01`'s acceptance criteria and the confirmed gap actually ask for.
- No change to `goal-list-estimate-display` or `goal-progress-display` —
  Compact retains the mobile progress explanation and remaining text those
  capabilities require; desktop omits only the secondary Done-by line.
- No change to ordering, filtering, grouping or reorder behavior.

## Decisions

**`density?: "comfortable" | "compact"` as a new optional field on
`GoalsListProps`**, defaulting to `"comfortable"` inside `GoalsTable`/
`GoalsMobileCards` when absent. A context provider was rejected: only the
top-level row/card wrapper and its two secondary-line/footer conditionals
need the value.

**`GoalDensityValue` union + `isGoalDensityValue` guard exported from
`@/entities/goal`**, mirroring `GoalGroupValue`/`isGoalGroupValue`, stored
under `goals.overview.density`.

**What Compact hides on desktop** keeps the six-column contract, the drag
handle and every column's primary content:

- The Character column's goal-type caption line and the "Status · Done by"
  column's Done-by line — the second line within already-two-line cells.
- The account-wide priority number (`consolidate-goals-into-plan-and-remove-active-project`, "In-flight rows show their account-wide priority position") stays visible in Compact: it lives in the leading cell beside the drag handle, so it adds no column and no row height.
- The row uses a shorter fixed height (implementation detail, roughly
  `h-10` against today's `h-14`), but never shorter than the drag handle's
  usable target: the handle stays a real pointer/touch target at both
  densities rather than shrinking with the row.

**Rows with level-requirement sub-lines keep the Comfortable height in
Compact.** The sub-lines (target "Lv 30 → 32", Potential-only bar, "N levels
· XP") are required progress content, so hiding them would trade required
information for density. Compact therefore has two fixed heights (short for
one-line rows, Comfortable for requirement rows) instead of one. Alternative
considered: a single Compact height that clips the sub-lines — rejected as
it hides required content. **Decided (confirmed by the user).**

**Mobile Compact** tightens card padding and vertical gaps (`p-3`/`gap-2`
today) while retaining the remaining-text/info footer (required by
`goal-progress-display`), project badges (membership has no other
representation on the card) and any level-requirement sub-lines. The
drag-only cards shown while reorder mode is on are already collapsed and
ignore density.

**Density toggle placed in the Goals control row**, next to Group and the
project filter, following the icon-with-hidden-label mobile pattern of
`planningSettingsButton` in `goals-page.tsx`. On mobile the row can now hold
Type, Group, project filter, the (conditional) reorder toggle, density,
Create Goal and Planning Settings; the row is allowed to wrap rather than
clip (see `goals-navigation` delta) and verified at 360px. **Decided (confirmed by the user):** wrap; moving density into Planning Settings is only a fallback if wrapping looks poor in review.

**Tour**: one new step targeting `goals-density-toggle`, added in
`goals-page.tutorial.tsx` next to the filters step; copy lives under
`tour.overview.steps.density.*` (the namespace the page tour actually uses).

## Risks / Trade-offs

- [Compact touches `goal-list-layout`, a spec already describing a
  deliberately-tuned single density] → additive per the delta — Comfortable
  scenarios are preserved; Compact is a second, explicit option.
- [Mixed row heights in Compact when some rows carry level requirements]
  → accepted; only the rows that need the room use it. Revisit if it reads
  as jumpy in review.
- [Control row crowding on 360px] → wrap rule plus a manual check; if
  wrapping looks poor, move the density control into the existing Planning
  Settings dialog in a follow-up rather than dropping a control.
- [Compact may provide less height reduction than hiding the footer] →
  measure against representative plans; retain the accessible explanation
  and let a separate screenshot presentation address `GUI-04` if needed.

## Open Questions

- Does Compact provide enough screenshot-friendly density for `GUI-04` on
  representative large plans? Validate at desktop and mobile capture sizes.
  If not, scope a separate presentation change rather than hiding required
  progress explanations or expanding this one implicitly.
- (Resolved) The consolidate change's `goals-navigation` delta now lists the
  mobile reorder toggle and the wrap rule; this change only adds the density
  control to that row.
