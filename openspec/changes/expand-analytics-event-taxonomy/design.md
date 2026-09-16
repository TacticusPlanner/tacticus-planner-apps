## Context

See proposal.md — Why. The mechanism exists and is not being rebuilt: `shared/analytics/analytics-event.ts` (the `AnalyticsEvent` discriminated union), `analytics-provider.tsx` (the only file that touches the vendor client, exposing `identifyUser` / `clearIdentity` / `captureEvent`), and the identified-only lifecycle wired through `AppShell`. This change adds three members to that union and registers super properties in the existing identify path.

Constraints that shape the approach:

- **The union is the privacy boundary.** `captureEvent` switches on `event.type` and maps declared fields to vendor properties by hand. Nothing else in the app can reach the vendor client, so an event that is not declared cannot be sent. Every decision below preserves that.
- **Theme and language are localStorage-only.** `ThemeProvider` reads and writes a storage key; i18next's detector caches to localStorage with order `["localStorage", "navigator"]`. `/me/user-settings` carries only `DailyEnergy`. The server therefore cannot report either, which is what makes them worth attaching here.
- **Sections are routed.** `/dailies/raids/today`, `/dailies/shops`, `/library/npcs` and the rest are real routes already covered by `page_view`. Any new event must add something routes do not have.

Companion change: `tacticus-planner-api` / `expand-analytics-event-taxonomy`, which applies first. **Shared contract surface: none** — no endpoint, DTO, or served dataset is shared. The halves meet only in the analytics destination, attributed to the same analytics id.

## Goals / Non-Goals

**Goals:**

- One generic event shape per _schema_, with closed enumerations, so adding a measurable action is a one-line union change rather than a new event, a new capture branch, and a new spec requirement.
- Client events that pair with a server outcome, so the pair yields an abandonment rate rather than two unrelated counts.
- Zero new UI, zero new dependency, zero visible behavior change.

**Non-Goals:**

- **Outcome reporting.** The server owns outcomes and survives ad blockers; duplicating them here creates two sources of truth for one number.
- **Client error tracking.** There is no `ErrorBoundary` in `apps/web` at all — a real gap, and a different one. Product analytics is not the tool for it and this change does not pretend to cover it.
- **In-page instrumentation** (`filter.changed`, tour progress). Deferred to its own change; see the decision below.
- **Anything answerable from routes.** Section views, page depth, destination popularity.

## Decisions

### Generic `action` with a closed `ActionId` union, not one event per action

```ts
type ActionId =
  | "onboarding.path_selected"
  | "v1_import.opened"
  | "sync.manual"
  | "goal.create_opened"
  | "project.create_opened"
  | "nav_search.opened"
  | "nav_search.no_results"

type ActionEvent = { type: "action"; actionId: ActionId; via?: ActionVia }
```

`via` is an optional qualifier from its own closed enumeration, describing _how_ an action was performed — not its outcome. Two ids need it immediately: `onboarding.path_selected` (which path was attempted, which matters precisely because a path that fails never reaches the server) and `nav_search.opened` (shortcut versus on-screen control). Encoding those into the id instead — `nav_search.opened_by_shortcut` — would be the same label-rot failure in a different costume once a third way to open something appears.

One declaration serves many measurements. In the destination, `action` broken down by `action_id` is a single chart carrying every action, and funnel steps filter on the property — whereas five event names mean five insights to build and maintain.

The union carries the weight. A `string` label would be the same thing on paper and a different thing in six months: `"Create Goal"` at one call site, `"create_goal"` at another, three bars on a breakdown chart for one action, and nobody noticing. A TypeScript union makes that a compile error for free, and keeps the "declared in one place with a documented purpose" property the existing design established.

_Alternative considered:_ one named event per action (`goal_create_opened`, `sync_manual`, …). Rejected — it is the same information at five times the declaration cost, and it fragments the destination's event list, which is the thing a human has to read.

### Three event families, not one mega-event

`action`, `menu_item_select`, and `preference` have genuinely different schemas. Merged into one event with a shared value property, that property means `"dark"` on one row and `"npcs"` on the next — not breakable-down, and not recoverable later. Separate events keep each property name meaning one thing.

### The promotion rule

An action that wants more than one property of its own graduates to its own declared event rather than growing `ActionEvent`. Otherwise the extra properties are absent on most `action` rows and the event's schema becomes a union of everything anyone ever needed. `goal.create` is the worked example: its _outcome_ really does want `{goal_type, source, count}` — which is exactly why the outcome lives in the API half, where those values are already in hand, and the client keeps only the cheap intent half.

### Theme is a super property; language is both

Registered once in the identify path: `theme`, `language`, `view_mode`, `display_mode`. Every event, `page_view` included, then carries them, so "what do my users run?" needs no event at all.

Language _additionally_ gets a `preference` event, and this is the one asymmetry worth stating plainly: the super property records the state, the event records the **transition**, and only the transition carries the signal. A user whose browser reports `fr` who moves to `en` is telling you the French translation is inadequate. The steady-state property cannot express that — it just says `en`, indistinguishable from an English speaker.

Theme has no equivalent transition signal. Nothing follows from a toggle count, so no event.

### `menu_item_select` earns its place on the negative result

The honest position: for the _destination_, this event is redundant with `page_view`, because sections are routed. What it adds is the disambiguation of a near-zero page:

```
page_view /library/npcs ~ 0
  + menu item clicked often  -> they arrive and bounce; fix the page
  + menu item never clicked  -> they never find it; fix the nav
```

Those two conclusions lead to opposite work, and route data alone cannot tell them apart. That is the whole justification, which is why it is scoped to navigation surfaces only and carries the surface — desktop sidebar versus mobile header — given how mobile-weighted the audience is.

### Navigation search is a third surface, not a fourth event family

`DesktopNavigationDialog` is opened by Cmd/Ctrl+K or by an on-screen control, filters nav items by label and description through `filterNavigationItems`, and closes on selection. It is a real navigation surface that nothing measures today — and because it renders `Link`s to the same destinations as the sidebar, `page_view` cannot distinguish a destination reached through it from one reached any other way.

It folds into `menu_item_select` with `surface: "desktop_search"` rather than becoming its own event. Selections made through it _are_ navigation selections; splitting them off would mean every "which navigation surface do people use" question had to union two event types forever.

Only the two things genuinely unique to a search surface become actions:

- **`nav_search.opened`** with `via: shortcut | control` — whether the keyboard shortcut was ever discovered. A shortcut nobody uses is either undiscoverable or unwanted, and those lead to different work.
- **`nav_search.no_results`** — a search session that ended with a query matching nothing.

Plus one property on the selection itself, `afterSearch`: did the user type to narrow the list, or use the dialog as a plain menu? If nobody types, the search input is dead weight on a dialog; if everybody types, the sidebar is not doing its job.

**Session-scoped, not keystroke-scoped.** `nav_search.no_results` fires at most once per opening of the dialog, evaluated on close: a non-empty query with no matches. That is deliberately not a debounced per-keystroke event — typing "goals" passes through "g", "go", "goa", and a per-keystroke rule would report intermediate states as failures. Scoping to the dialog session needs no debounce at all, and measures the thing that matters: the user gave up.

### Search terms are never reported

The most actionable signal a nav search can produce is _what people searched for and did not find_ — it names missing features and wrong labels directly. It is also free text, which the capture floor forbids, and the tempting middle path (report it only when short, alphanumeric, and zero-result) is a sanitization heuristic, which is the category of rule that holds until the day it does not.

So the failure **rate** is reported and the failure **content** is not. That is an honest loss, not a disguised one: the rate answers "is nav search failing people", which is the decision this change exists to inform, and "what were they looking for" is better served by the UserJot feedback widget that already ships in this app than by weakening a privacy floor to get a keyword list.

### `filter.changed` and tour events deferred

`filter.changed { surface, filter_key }` is the highest-value client event after these — it is the literal gap the GA4 review named, and unused filters are removable code. It is also the only proposed event with real volume risk: wired naively to a slider or a text filter it fires per keystroke, and a debounce that drops the _last_ change silently biases the data toward abandoned intermediate states.

It needs its own design pass covering the debounce semantics and the filter-key enumeration across every planner surface, and it does not block anything here. Tour events ride along in that change: both are in-page instrumentation, as opposed to the funnel instrumentation this change is.

### Emission at the call site, not in a wrapper component

Each event fires from the existing handler in the component that owns the interaction, through `useAnalyticsActions().captureEvent`. Not from a click-capturing wrapper, a route-level listener, or a HOC.

_Alternative considered:_ a generic `<Tracked actionId="...">` wrapper. It looks tidier at eight call sites, but it re-creates autocapture's failure mode — instrumentation drifting from intent, firing on renders and nested clicks nobody declared — and the existing design rejected autocapture on exactly that ground.

## Risks / Trade-offs

- **`menu_item_select` is the weakest event here and might not earn its keep** → scoped to navigation surfaces only, with a stated negative-result justification. If after a quarter it never separates the two conclusions above, it is one union member to delete.
- **Super properties are registered at identify time and go stale if a user changes theme or language mid-session** → re-register on change rather than only at identify; the change handlers already exist for both. Cheap, and it keeps the property honest without an event.
- **Cross-side funnels resolve at person level, not session level** → server events carry no session id, so "opened goal sheet → goal created" is a person-level funnel with a time window. Accepted: the abandonment questions are person-level questions, and the alternative is reporting outcomes on both sides, which creates two sources of truth.
- **Ad blockers eat some client events** → known and deliberately exploited exactly once: the gap between the client's `onboarding.path_selected` count and the API's `tacticus_integration_configured` count _is_ the blocked-client rate. Everywhere else, only one side reports, so no number is double-counted.
- **A declared `ActionId` outlives its call site** → the union member stays after the surface it measured is removed, and silently stops firing. Mitigated by keeping every id's call site listed in the proposal's Impact section, so a removed surface has one place to check.

## Migration Plan

No schema, no contract, no dependency, no user-visible change. The API half applies first, but nothing here depends on it at build or run time — the client compiles and behaves identically whether the server-side events exist or not; only the cross-side funnels are unavailable until both are deployed. Rollback is a revert: with no project token configured, `AnalyticsProvider` already mounts nothing at all.
