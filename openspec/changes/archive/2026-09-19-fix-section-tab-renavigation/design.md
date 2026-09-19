## Context

See `proposal.md` — Why. The mechanism, in the current `section-tabs.tsx`:

```tsx
const active = children.find(
  (child) => pathname === child.path || pathname.startsWith(child.path + "/")
)?.path ?? children[0].path

<Tabs value={active} onValueChange={(value) => { void navigate(value) }}>
```

`value` is controlled and derived by prefix, so on a nested route the parent's tab
is already the selected value. Radix fires `onValueChange` only on a _change_, and
navigation hangs off that callback alone, so activating the selected tab is inert.
The prefix match is correct and worth keeping — it is what makes a nested route
show its parent tab as current — so the fix belongs on the activation side.

What the tab row cannot know on its own is whether a given tab's path is somewhere
a user can actually land. Three of the routes that look like they need this fix do
not have a landing page behind the tab:

- `use-library-route-selection.ts` canonicalizes the URL for characters, machines
  of war, and NPCs: on any non-canonical path it runs
  `navigate({pathname: \`${collectionPath}/${selectedId ?? firstId}\`}, {replace: true})`.
  Navigating to the collection path therefore bounces to the first entity.
- `/dailies/raids` is an index redirect to `/dailies/raids/today`, and Raids owns a
  third-level tab row that `app-navigation` already excludes from this requirement.

`/goals/projects` and `/library/raid-bosses` are the two that genuinely render a
landing screen — the latter redirects only when `entityId && !selectedUnit`, so
with no entity selected it renders its own picker.

## Goals / Non-Goals

**Goals:**

- Activating a tab returns to its own landing page from a nested route, for the
  tabs that have one.
- Leave every other tab's behavior byte-for-byte unchanged.
- Keyboard activation and the active-tab highlight unchanged.

**Non-Goals:**

- No change to which tab is shown as active, or to the prefix rule behind it.
- No change to the desktop header, sidebar flyout, or mobile drawer — all verified
  working (see `proposal.md` — Impact).
- No change to the Library collections' URL canonicalization or to Raids' index
  redirect. Those behaviors are why those tabs are excluded, not defects to fix
  here.

## Decisions

### An opt-in `NavSubItem` flag, not a generic rule

`NavSubItem` gains one optional boolean meaning "this path is a landing page of its
own", set on `/goals/projects` and `/library/raid-bosses`. The tab row re-navigates
only for a child carrying it.

Opt-in rather than opt-out, because the default has to be the safe one: a nav child
added later that happens to redirect or canonicalize would otherwise silently
inherit a navigation that throws the user somewhere useless. Declaring it also
makes the property reviewable in one file, instead of leaving it as an emergent
consequence of each page's own redirect logic — which is exactly what made the
original scope of this change wrong.

_Alternative considered:_ deriving it, e.g. treating a tab as returnable only when
the extra path segment is dynamic. Rejected — `/dailies/raids/today` has the same
shape as `/goals/projects/{id}`, one static-looking segment below the tab path, so
no structural heuristic separates them.

_Alternative considered:_ applying it to Goals only and ignoring the shared row.
Rejected — `/library/raid-bosses/{entityId}` has the identical dead tab, and a
Goals-local fix would leave the shared component still wrong for it.

### Navigate on activation of the already-selected tab, keeping `onValueChange`

`onValueChange` continues to handle every real value change; a click handler on
`TabsTrigger` covers only the case Radix will never report — activating a tab that
is already selected while the route sits below it.

**Both guard clauses are load-bearing**, and neither is redundant.
(For why `onValueChange` needs a guard of its own, see the next decision.) On a mouse click
of a _different_ tab, Radix activates on `onMouseDown`/focus, so `onValueChange`
and its `navigate` run before `onClick` does. react-router wraps the location
update in `startTransition`, so by the time `onClick` fires the re-render may or may
not have committed: if it has, the pathname now equals the target and the
"pathname is not already this path" clause blocks; if it has not, the tab is not yet
the active value and the "this tab is the current value" clause blocks. Dropping
either clause reintroduces a double navigation — two history entries for one click,
and a Back button that needs two presses.

_Alternative considered:_ dropping `onValueChange` and navigating from the click
handler alone. Rejected — Radix `Tabs` defaults to `activationMode="automatic"`, so
arrow-key focus changes activate through `onValueChange`. Removing it would leave
keyboard users able to move the focus ring without ever navigating, since `value`
stays pinned to the pathname.

_Alternative considered:_ rendering each `TabsTrigger` with `asChild` around a
react-router `Link`. Rejected for this change as a larger rewrite of a component
with no other defect: it changes the rendered element from a button to an anchor,
affecting the existing `data-state` assertions and the row's keyboard semantics.
Worth revisiting if this component is reworked for another reason.

### Radix reports one click twice, so `onValueChange` needs its own guard

_Added during apply, with approval._ This design originally treated a double navigation as
something the new click handler might introduce. Browser verification (task 6.6) showed the row
**already** pushed two history entries per tab switch, before this change: one click on a tab called
`pushState` twice with the same URL, both from react-router's `completeNavigation`, and Back needed
two presses. Confirmed pre-existing by re-measuring with `section-tabs.tsx` stashed; a plain nav
`Link` pushes one, so it is specific to this row.

The cause is Radix `Tabs`: `TabsTrigger` activates on `mousedown`, and again on the `focus` that
immediately follows, because while react-router's transition is still in flight the trigger still
sees itself as unselected. Both firings call `onValueChange`, which navigated unconditionally.

`onValueChange` now skips a value it is already at or already navigating to, the target held in a
ref cleared when `pathname` changes. A ref rather than state because it must be readable by the
second firing, whose closure is a render behind — a ref is the same object across renders.

_Alternative considered:_ `activationMode="manual"`, which stops Radix activating on focus at all.
Rejected for the same reason this design keeps `onValueChange`: it would also stop arrow-key
activation, leaving keyboard users moving the focus ring without navigating.

_Alternative considered:_ comparing `value` against `pathname` alone. Rejected — at the second
firing the handler's closure may still carry the pre-navigation `pathname`, so the comparison can
pass and navigate again. The ref is what makes the guard independent of render timing.

**This is not covered by the jsdom tests, in the way it appears to be.** `userEvent.click` produces a
single `onValueChange` there, because the state update lands between mousedown and focus — which is
why the row's existing tests never caught it. The regression test dispatches `mouseDown` and `focus`
inside one `act` to reproduce the browser's timing; it fails without the guard.

### The stale doc comment is corrected, not left

`section-tabs.tsx` describes itself as "shared by the desktop and mobile headers".
It is rendered only by `mobile-header.tsx`; the desktop header became a static
breadcrumb in a later change without this comment being updated. Leaving it would
keep pointing the next reader at a desktop surface that does not exist, and it is
the reason this defect first read as broader than it is.

## Risks / Trade-offs

- **The flag can drift out of sync with a page's real behavior.** If a declared
  landing page later gains a redirect, the tab starts throwing users somewhere
  unhelpful, and nothing fails loudly. → The two flagged paths get an explicit test
  asserting their landing screen renders without redirecting away, so a future
  redirect breaks a test rather than only the experience.
- **A future nav child silently gets no re-navigation.** The opt-in default means a
  genuinely returnable child added later just keeps the old dead-tab behavior until
  someone notices. → Accepted as the safer failure direction: an inert tab is the
  status quo, whereas a wrong navigation actively moves the user.
- **One component, two sections.** A regression breaks navigation in Goals and
  Library at once. → The added behavior is guarded to a case that is currently
  inert, so existing tab switching is untouched, and `section-tabs.test.tsx`'s
  existing cases stay as the regression net.

## Migration Plan

No data migration, no API involvement, no deployment ordering. Rollback is a
frontend revert; the change adds a navigation path and removes none.
