## Why

The blocking account-setup screen shown to every first-time signed-in user stacks two complete
forms into roughly 1100px of content inside a non-scrolling modal. On a phone the submit buttons
sit off-screen — a user reported being unable to scroll the pop-up at all on Firefox for Android,
where the browser's bottom toolbar covered what little of the button was reachable. Separately,
when the V1 import succeeds at the HTTP level but the V1 account has no Tacticus API key (or an
invalid one), the screen silently re-renders itself with no message, trapping the user in a
no-op loop. A user who wants neither option has no way out: the modal suppresses escape,
outside-click, and the close button, and its overlay makes the shell's existing sign-out
unreachable.

## What Changes

- Replace the blocking modal dialog with an in-flow setup screen on its own minimal chrome, outside
  the main app shell. Ordinary document scrolling makes the content reachable on a phone without any
  dialog-level scroll container, and none of the shell's affordances — all of which lead somewhere a
  user without an API key cannot go, including a background sync that fails for want of that very
  key — are present to get in the way.
- Give setup its own addresses — `/setup`, `/setup/key`, `/setup/import` — instead of rendering it
  anonymously in place of whatever route the user asked for. The gate redirects to `/setup`,
  remembering the requested destination, and returns the user there on completion. This makes the
  browser Back button work between steps, keeps a mid-setup refresh on the same step, and — the
  reason it is worth the wiring — makes the setup funnel measurable: page-view events are keyed on
  the matched route pattern, so today every setup step is either unreported or misattributed to
  the route it is masking.
- On viewports at or above 768px, present both paths at once as two side-by-side panels — a
  single step, horizontally oriented — rendered at every setup address, since desktop has no steps
  to distinguish.
- On viewports below 768px, split the flow into two steps: a choice screen at `/setup` naming the
  two paths, then the single form for the chosen path at its own address, with a Back control
  returning to the choice.
- Surface the per-part outcome of a V1 import instead of ignoring it. An import that returns HTTP
  200 but did not import a usable Tacticus API key now reports why, in place, on the import form.
  On mobile that message also offers a direct jump to the API-key step.
- Show a sign-out control on the setup screen at all times, on both layouts and every step, so a
  user who wants neither path can leave.
- Rewrite the user-facing copy for the new flow and translate it into all supported locales.

No API change is required: `POST /api/v1/me/v1-import` already validates the imported key against
Tacticus and already returns the per-part status and code this change reads. There is no companion
`tacticus-planner-api` change.

## Capabilities

### New Capabilities

- `account-setup`: The blocking first-run screen that connects a signed-in user's Tacticus account
  — its desktop and mobile presentation, the two paths (paste an API key, import from V1), the
  outcome handling for each path including partial V1 imports, and the sign-out escape.

### Modified Capabilities

None. `account-menu` governs the desktop account menu's own presentation and is untouched;
`guild-access-onboarding` is a separate guild-registration journey.

## Impact

- `apps/web/src/fsd/features/account-onboarding` — the dialog is replaced by the setup screen and
  its two layout forms; the two existing form components are extracted and reused.
- `apps/web/src/fsd/app/onboarding-gate.tsx` and its test — the gate redirects to `/setup` instead
  of rendering a dialog in place of the route.
- `apps/web/src/fsd/app/routes.tsx` — `ProtectedRoute` splits into an authentication-only guard and
  an authentication-plus-onboarding guard, and the `/setup` routes are registered as a sibling of
  the app shell using the former.
- `apps/web/src/fsd/app/layout/account-setup-layout.tsx` (new) — the setup screen's own chrome. It
  mounts `PostHogProvider` so setup still reports page-views, and deliberately does not mount the
  game-catalog or player-data providers.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — the `onboarding.*` copy is largely
  rewritten and extended with choice-screen and import-outcome strings.
- No change to `packages/ui`'s dialog primitive or to the API.

Out of scope: the shared `DialogContent` primitive has no max-height or overflow of its own, which
leaves the same latent overflow in the app's other dialogs. This change removes the setup screen's
dependence on it but deliberately does not fix it; that is a separate change.
