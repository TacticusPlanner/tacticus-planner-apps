## Context

See `proposal.md` - Why. Relevant existing shape, confirmed by reading the
code:

- `GoalsList` (`goals-list.tsx`) switches between `GoalsTable` (desktop) and
  `GoalsMobileCards` (mobile) via `useIsMobile()`, and is shared verbatim
  between Goals Overview and Project Detail (`project-detail-goals.tsx`
  imports it directly).
- `goal-list-layout`'s main spec already commits to one fixed row
  height/card structure per platform — it explicitly calls today's shape "a
  substantial reduction from ... variable, content-driven row height,"
  i.e. there is exactly one density today, not a toggle. This change adds a
  second, denser option alongside it rather than replacing the default.
- Goals Overview already has one precedent for a persisted, per-browser view
  preference: `group` (`goals.overview.group`, via `usePersistedSelection`
  from `@/shared/lib`), typed with a `GoalGroupValue` string union and an
  `isGoalGroupValue` guard exported from `@/entities/goal`.
- `GoalsListProps` (`goal-row-utils.ts`) is already an options bag with
  several optional, Overview-vs-Project-Detail-conditional fields
  (`reorderEnabled`, `mobileReorderActive`, `project`) — a new optional
  `density` field fits the same shape.

## Goals / Non-Goals

**Goals:**

- A single new optional `density` prop threaded through `GoalsList` →
  `GoalsTable`/`GoalsMobileCards`, defaulting to the existing presentation
  when omitted, so every non-Overview caller (Project Detail) needs zero
  changes.
- Reuse the existing persisted-preference pattern (`usePersistedSelection`)
  rather than introducing a new persistence mechanism.

**Non-Goals:**

- No change to what data each row/card computes or fetches — density only
  changes which already-computed pieces render, not row content or any
  query.
- No third density level. Two values (Comfortable/Compact) match what
  `GUI-01`'s acceptance criteria and the confirmed gap actually ask for;
  add a third only if a future request specifically needs it.
- No change to `goal-list-estimate-display` or `goal-progress-display` —
  Compact retains the mobile progress explanation and remaining text those
  capabilities require; desktop omits only the secondary Done-By line.

## Decisions

**`density?: "comfortable" | "compact"` as a new optional field on
`GoalsListProps`**, defaulting to `"comfortable"` inside `GoalsTable`/
`GoalsMobileCards` when absent. Alternative considered: a context provider
so deeply nested cells could read density without prop-threading. Rejected
— only the top-level row/card wrapper and its two secondary-line/footer
conditionals need the value; a context adds indirection for two read sites
with no other benefit.

**`GoalDensityValue` union + `isGoalDensityValue` guard exported from
`@/entities/goal`**, mirroring `GoalGroupValue`/`isGoalGroupValue` exactly
(same file, same export shape) — keeps the density preference typed and
validated the same way every other persisted Overview preference already
is, rather than inventing a new validation shape.

**What Compact hides, chosen to keep both densities structurally
consistent with `goal-list-layout`'s existing six-column/one-card
contract, no column removed:**

- Desktop: the Character column's goal-type caption line and the
  "Status · Done by" column's Done-By line — the two lines that were
  already the _second_ line within an already-two-line cell, per the
  existing spec. Dropping only second lines keeps every column's primary
  content (name link, status label) identical across both densities, and
  lets the row shrink to its shortest realistic single-line height.
- Mobile: tighten card padding and vertical gaps while retaining the
  remaining-text/info footer. Removing that footer was considered, but
  rejected because `goal-progress-display` requires its Actual/Potential
  explanation to remain reachable on mobile. Keep project badges too:
  membership has no other representation on the card.

**Density toggle placed in the same Overview toolbar row as Group/Sort/Type
and the project filter**, following the existing icon-with-hidden-label
mobile pattern (see `planningSettingsButton` in `goals-page.tsx`), same
reasoning as every existing control in that row.

## Risks / Trade-offs

- [Compact density touches `goal-list-layout`, a spec already describing a
  deliberately-tuned single density] → Mitigation: additive per the delta
  — every existing scenario for the Comfortable density is preserved
  verbatim; Compact is described as a second, explicit option, not a
  replacement.
- [Compact may provide less height reduction than hiding the footer] →
  Mitigation: measure actual row/card density against representative plans;
  retain accessible explanation and let a separate screenshot presentation
  address `GUI-04` if needed.

## Open Questions

- Does Compact provide enough screenshot-friendly density for `GUI-04` on
  representative large plans? Validate at desktop and mobile capture sizes.
  If not, scope a separate presentation change rather than hiding required
  progress explanations or expanding this one implicitly.
