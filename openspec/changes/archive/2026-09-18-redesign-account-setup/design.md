## Context

See proposal.md — Why. Requirements are in `specs/account-setup/spec.md`; this document covers the
approach only.

Current state that shapes the design:

- `OnboardingGate` (`app/onboarding-gate.tsx`) renders `OnboardingDialog` in place of the route's
  children. It is reached from `ProtectedRoute` (`app/routes.tsx`), which is nested **inside**
  `<AppShell />` — so the shell's chrome already renders behind the modal today.
- `OnboardingDialog` (`features/account-onboarding`) suppresses every affordance that makes a
  dialog a dialog: `showCloseButton={false}`, `onEscapeKeyDown` and `onInteractOutside` both
  prevented, and it never closes. It is a screen wearing a modal costume.
- The shared `DialogContent` (`packages/ui/src/components/dialog.tsx`) declares no `max-height`
  and no `overflow`. Nothing between the overlay and the form owns a scroll axis, which is why the
  reported gesture had nothing to move.
- Nothing in the app suppresses document scrolling: `MobileShell` (`app/layout/mobile-layout.tsx`)
  is `min-h-svh flex flex-col` with a `flex-1` content slot — no `overflow-hidden`, no fixed
  height — and `--mobile-scroll-clearance` (`mobile-layout.css`) pads content past the fixed bottom
  nav and `env(safe-area-inset-bottom)`. Only the modal was trapping the gesture.
- The API already does the work item C needs: `ImportV1ProfileEndpoint.ImportPersonalKeyAsync`
  runs `TacticusApiKeyValidator` against Tacticus and returns `Imported` /
  `Skipped:missing_personal_api_key` / `Failed:personal_api_key_invalid` /
  `Failed:personal_api_key_not_saved` inside an HTTP 200 body. `GetCurrentUserEndpoint` computes
  `hasCompletedOnboarding` as `tacticusApiKey is not null` — the key alone gates the screen.
- `ProtectedRoute` (`app/routes.tsx`) currently bundles two concerns: it waits for MSAL
  `inProgress` to clear and redirects unauthenticated users to `/`, and it wraps children in
  `OnboardingGate`. Setup needs the first without the second.
- `PostHogIdentity` (`app/providers/posthog-provider.tsx:82-94`) captures `page_view` keyed on
  `routePattern` from `useMatches()`, firing only on a pattern change, with `routeGroup` supplied
  by whichever layout mounts `PostHogProvider` — today only `AppShell`.
- `PlayerDataProvider` (`app/providers/player-data-provider.tsx:170-211`) auto-syncs on mount when
  no successful sync has ever happened, and `GameCatalogInitGate` renders a blocking overlay while
  the catalog downloads. Both are mounted by `AppShell`.

## Goals / Non-Goals

**Goals:**

- Make every control reachable on a phone by relying on the document's own scrolling, rather than
  by adding a scroll container to a dialog.
- One behavioral state machine with two presentations, so desktop and mobile do not fork logic.
- Turn the silent post-import no-op into an actionable, localized message.
- Make the setup funnel measurable — each step a distinct, reportable route — without regressing
  the destination a user was originally trying to reach.

**Non-Goals:**

- Fixing the shared `DialogContent` primitive. It remains without `max-height`/`overflow`, and the
  app's other dialogs remain exposed to the same overflow. This change only removes the setup
  screen's dependence on it.
- Any change to `tacticus-planner-api` or to the V1 import endpoint's selection semantics (setup
  still imports only the personal key and the user ID).
- Reworking `ProtectedRoute` beyond separating its authentication guard from its onboarding guard.
  Every existing protected route keeps the behavior it has today.
- Building an analytics dashboard or funnel report. This change only makes the events emit
  correctly.
- Reporting non-key import parts (for example a Tacticus user ID conflict). Those stay visible in
  Manage Account.
- Localizing the HTTP-400 error bodies the API returns for invalid V1 credentials. See the
  outcome-message decision below for the limit of what this change localizes.

## Decisions

### A screen on its own minimal chrome, not a dialog and not the app shell

Render the setup surface as ordinary page content on a dedicated layout
(`app/layout/account-setup-layout.tsx`) registered as a sibling of `AppShell`, not inside it.

_Why:_ it removes the defect class rather than patching it. Of the six fixes the design review
proposed, five exist only because the content is in a modal — an in-flow page gets native document
scroll, needs no `dvh` math, needs no `min-height: 0` flex dance, has no Radix scroll-lock or
`pointer-events: none` to fight, and is already full-bleed on a phone. The sixth (safe-area padding
under the submit control) is one `env(safe-area-inset-bottom)` rule on the setup layout, and with
no fixed bottom nav present there is nothing else for the button to collide with.

_Why not inside the shell:_ the first working build made the case against it. A user here has no
configured API key, so every shell affordance is a trap or noise — the nav links lead to protected
routes that bounce straight back to setup, create-goal and navigation search act on data that does
not exist yet, `GameCatalogInitGate` throws a blocking overlay over the form, and
`PlayerDataProvider`'s mount auto-sync parks a red "sync failed" badge on the very screen asking for
the key it is missing. Moving setup out of the shell removes that whole class of problem instead of
suppressing each control.

_What the separate layout must still carry:_ `PostHogProvider` is mounted inside `AppShell`, so a
naive move would leave setup emitting no page-views at all — deleting the measurement that
justified the per-step addresses. The setup layout mounts it directly with a literal `/setup` route
group. It deliberately does not mount the game-catalog or player-data providers: setup needs
neither, and both are sources of the noise above.

_Alternative considered:_ fix `DialogContent` (`max-h-[100dvh]`, `overflow-y-auto`, full-bleed
under `sm`) and keep the dialog. That fix is worth making for the app's other eight dialogs, but as
its own change — it does not address the two-forms-in-one-viewport structure, and keeping this
particular surface as a modal preserves a modal that deliberately disables every modal affordance.

### Setup gets its own routes, one per step

`/setup` (the mobile choice step, and the whole desktop screen), `/setup/key`, `/setup/import`.
The gate redirects instead of substituting a render.

_Why:_ measurement decides this. `posthog-provider.tsx:82-94` captures `page_view` keyed on
`routePattern` from `useMatches()`, and the effect fires only when that pattern changes. With the
setup screen rendered anonymously in place of another route, no setup step is ever reported and
its traffic is attributed to the route it masks — so "how many users abandon setup, and at which
step" is unanswerable, on the exact screen a user reported being unable to finish. Per-step paths
make each step a distinct pattern and the funnel falls out of the existing analytics. The browser
Back button working between steps, and a mid-setup refresh staying on the same step, come along
for free.

_Cost, stated plainly:_ this gives up a property the render-in-place approach had for nothing —
the address bar keeps holding the route the user originally asked for, so they land back on it
automatically. With a redirect that destination has to be carried and restored (see the next
decision). That is roughly twenty lines plus a validation rule, and the query-param form survives
a refresh, which the render-in-place version did not.

_Alternatives considered:_ keep `useState` for the steps (cheapest, but leaves the funnel dark);
a `?setup=key` search param (buys Back and refresh, still no funnel, because `routePattern` does
not include the query string). Neither buys the measurement, which is the point.

### The requested destination travels as a validated `next` parameter

The gate redirects to `/setup?next=<path>` carrying `location.pathname + location.search`. On
completion the screen navigates to that path; the parameter is carried across step navigations so
it survives Back and the mobile jump action.

_Why a query parameter rather than router state:_ router state is lost on a refresh, which is one
of the two things this move is meant to fix.

_Validation is mandatory, not optional._ `next` is attacker-controllable via a crafted link, so an
unvalidated redirect is an open-redirect hole. Accept only a same-origin relative path: it must
begin with a single `/`, must not begin with `//` or `/\` (protocol-relative), and must not
contain a backslash or a scheme. It must also not point back at a setup address — `?next=/setup`
would otherwise make the reverse guard navigate from setup to setup. Anything failing those checks
falls back to `/home` rather than erroring.

### Completion does not navigate; the reverse guard does

Submitting a key successfully triggers the current-user refetch and nothing else. The user reaches
their destination when the reverse guard sees the refreshed state.

_Why:_ `useCurrentUser`'s `refetch` is fire-and-forget (`use-current-user.ts:33` — `() => { void
query.refetch() }`), and react-query keeps `isPending: false` throughout a refetch, so `state`
stays `{ status: "success" }` carrying the **stale** `hasCompletedOnboarding: false`. A completion
handler that navigated to `next` immediately would land on a protected route whose gate reads that
stale value and redirects straight back to `/setup` — a bounce that empties the form the user just
submitted, reproducing the silent-no-op symptom this change exists to remove. Waiting for the
guard removes the race entirely, adds no new mechanism (the guard is required anyway for a
configured user who types `/setup`), and needs no change to the shared `useCurrentUser` hook. The
submit button's existing spinner covers the wait.

_The one state this leaves to handle:_ if the refetch itself fails after a successful save, the
loop-safety rule keeps the user on setup and the spinner would never resolve. A successful
submission followed by an account-state failure must therefore surface a retry, not an indefinite
spinner.

### A viewport change that switches presentation discards entered values

Crossing 768px re-selects the presentation live, remounting the forms. A desktop user who has
typed into a panel and then narrows the window — realistically, rotating a tablet to portrait —
loses what they typed.

_Why accept it:_ preserving it means lifting form state above the presentation switch, including
holding a V1 password there, which is exactly what the discard decision below avoids. The trigger
is rare and self-inflicted, and the data is two short fields. Recorded as accepted behavior rather
than left as an undiscovered surprise.

### Desktop renders the whole screen at any setup address; the funnel separates steps by view mode

At ≥768px there are no steps, so `/setup`, `/setup/key` and `/setup/import` all render the same
two-panel screen. No redirect.

_Why not redirect the step addresses to `/setup` on desktop:_ it would double-report. `page_view`
is captured in an effect keyed on `routePattern`, and the redirect can only be a client-render
decision (it depends on `useIsMobile()`), so the `/setup/key` route commits and fires its effect
before the router processes the `<Navigate>`. One navigation, two events — which breaks
`specs/product-analytics/spec.md`'s "a single `page_view` event is reported for the destination
route", and contaminates the very funnel the redirect was meant to protect.

_What separates the steps instead:_ `page_view` already carries `viewMode`
(`posthog-provider.tsx:86`). A step funnel filters on `viewMode = "mobile"`, so desktop views of a
step address are distinguishable without any redirect. The cost is cosmetic — a desktop user who
follows a `/setup/key` link sees the full screen at that address.

### Redirect loops are the new failure mode, and are guarded explicitly

Turning a render branch into a navigation introduces a hazard the old design could not have: the
gate sends unconfigured users to `/setup`, and `/setup` sends configured users away. If both sides
acted on an indeterminate account state they could ping-pong.

The rule: **both guards redirect only on a definitive answer.** The gate redirects only when the
current-user request has succeeded and reports onboarding incomplete — its loading branch still
renders the spinner and its error branch still fails open by rendering children, neither of which
navigates. `/setup` bounces out only when the request has succeeded and reports onboarding
complete; while loading it renders the setup screen's own loading state, and on error it stays put
rather than bouncing to a route that would bounce it back.

### Two presentations over one set of routes

`useIsMobile()` (768px) selects a desktop wrapper (two panels, `grid md:grid-cols-2`, both forms
mounted, rendered at `/setup`) or a mobile wrapper (the step named by the current path). The step
is read from the route rather than held in component state; the two form components are shared
between the wrappers unchanged.

_Why:_ the behavior — submit, outcome handling, error text — is identical; only the composition
differs. `useIsMobile()` is `useSyncExternalStore` over a synchronous `matchMedia` snapshot, so the
correct wrapper renders on the first paint with no flash.

_Desktop/mobile split, stated explicitly:_ desktop shows both paths simultaneously and never shows
a choice step or a Back control; mobile never shows both paths' fields at once and always shows
Back on the form step. The failed-import message carries a jump-to-API-key action on mobile only —
on desktop that panel is already on screen, so the action would be noise.

_How this gets tested:_ jsdom has no viewport, and `apps/web/src/test/setup.ts` stubs `matchMedia`
to return `matches: false` for every query — so `useIsMobile()` is always `false` under vitest and
a test that merely sets `window.innerWidth` would assert the desktop tree while claiming to test
mobile. Follow the established convention instead: `vi.hoisted` + `vi.mock(
"@workspace/ui/hooks/use-mobile")`, as in `entities/project/ui/project-select.test.tsx` and nine
other suites. The breakpoint value itself and the absence of a first-render flash are properties of
`useIsMobile`, not of this screen, and are covered by real viewports in manual verification rather
than asserted in jsdom.

Drop the "Or" separator on desktop: side-by-side panels plus a "pick either one" line in the header
carry the meaning, and it is one fewer string to translate four times.

### Field values are discarded when leaving a step

Form state lives in each form component, and navigating between step routes unmounts it.

_Why:_ it is the default behavior — keeping values would mean lifting state above the route,
including holding a V1 password there. The flow is two short forms; the cost of retyping is
smaller than the cost of the extra state. Note this now also applies to the browser Back button,
which is the behavior a user expects from Back anyway.

### Setup reports its own analytics route group

`AppShell` derives `routeGroup` from the matched nav item, and setup is deliberately not a nav
item. Since setup now has its own layout, that layout passes the group literally rather than
deriving it.

_Why bother:_ `routePattern` alone already distinguishes the steps, so the funnel is technically
reconstructible without this. But leaving the group as `unknown` buries setup in a bucket shared
with every other unmatched route, which half-defeats the reason for taking on the routing work at
all.

### Part-outcome messages are keyed off `code`, not the server's `message`

Branch on `personalTacticusApiKey.status`, then map `code` to an i18n key, with a generic fallback
for an unrecognized or null code.

_Why:_ the API's part messages are English-only and written for developers ("The imported personal
API key could not be validated."). Repo convention is that all user-facing copy goes through
react-i18next in every supported locale.

_Scope, stated honestly:_ this covers the HTTP-200 part outcomes only. The HTTP-400 paths (invalid
V1 credentials, unreachable V1 profile) keep surfacing the server's field message, because
`shared/api/api-client.ts` lifts it into `ApiError.message` and the set of possible strings is
open-ended. So a non-English user submitting bad V1 credentials still sees English. That is a
pre-existing limitation of every form in the app, not something this change introduces — but the
decision above should not be read as a claim that this screen is fully localized. Localizing the
400 bodies is a separate, API-wide problem.

### No refetch on the failed-import path

Only call the current-user refetch when the key part reports `Imported`.

_Why:_ on a failed key import the endpoint may already have persisted the Tacticus user ID (it
imports the ID before the key), but nothing on this screen reads it, and
`UpdateTacticusIntegrationEndpoint` preserves an existing user ID when the field is submitted
empty. So the imported ID survives whichever path the user takes next, with nothing to reconcile.

### FSD placement

The screen and both forms stay in `features/account-onboarding`, exported through its public API
and rendered by the setup routes in `app/routes.tsx`. `app/onboarding-gate.tsx` no longer renders
it — under this change the gate only redirects. `features/v1-import` is a sibling feature, so the
account-onboarding import form cannot import from it and keeps its own narrow form — this
duplication with `ImportV1Dialog` is pre-existing and deliberately not addressed here. Sign-out
reuses `signOut` and `useActiveAccountId` from `shared/auth`, mirroring the existing pattern in
`app/game-catalog-init-gate.tsx`.

### A sign-out control on the screen, despite the shell already having one

Once the overlay is gone the shell's own sign-out becomes reachable again — `auth-control.tsx:260`
in the mobile drawer and `:383` in the desktop sidebar card — and the `account-menu` spec pins it
as a guaranteed menu action. The setup screen still carries its own.

_Why:_ on mobile the shell's copy sits inside a drawer behind a menu button, which is not where a
user who has decided they want neither path will look; the whole point of the control is to be
visible to someone who is stuck. It was also explicitly requested for this screen. The cost is one
button and one label — and the label can reuse the existing `auth.signOut` key rather than adding
a new string in four locales.

### No Joyride tour for this screen

This is a deliberate exception to the repository convention that every page carries a
`<page>.tutorial.tsx`.

_Why:_ the setup screen is a one-time blocking surface whose entire purpose is to be escaped, with
at most three fields on it. A guided tour of it would delay the user from doing the only thing the
screen asks. Recording it here so the absence reads as a decision rather than an oversight. The
shared shell tour in `shared/tour/general.tutorial.tsx` is unaffected.

## Risks / Trade-offs

- **Shell affordances during setup — resolved by moving setup out of the shell.** Had setup stayed
  in the shell, an unconfigured user would have had live access to the account menu's "Manage
  Account" and "Import from V1" entries, the create-goal control, the navigation search and the
  Tacticus sync control, none of which can do anything useful without a key. The sync control was
  the sharp one and was never click-triggered: `player-data-provider.tsx:170-211` auto-syncs on
  mount whenever there has never been a successful sync, so the screen rendered with a red "sync
  failed" badge from the start. The dedicated layout mounts none of this.
  → Residual check: confirm nothing else in the app deep-links into a shell-only control from the
  setup screen, and that leaving setup restores the full shell.
- **Manage Account is no longer reachable from setup at all.** It used to be the "alternate door"
  for configuring a key mid-setup, and it carries the same unscrollable
  `<DialogContent className="sm:max-w-lg">` (`features/account-management/ui/manage-account-dialog.tsx:66`)
  that this change exists to route around. → No loss: the setup screen's own API key panel does the
  same job, on a surface that scrolls. Manage Account stays reachable from the shell after setup.
- **Two presentations double the manual verification surface.** → Verification tasks pin one
  viewport below 768px and one at or above, and the reported Firefox-for-Android case specifically.
- **Renaming `OnboardingDialog` breaks its test double.** `app/onboarding-gate.test.tsx` mocks
  `@/features/account-onboarding` by that export name, and existing `data-testid` values
  (`onboarding-dialog`, `onboarding-sign-up-*`, `onboarding-import-*`) may be referenced elsewhere.
  → Grep for each before renaming, and update in the same change.
- **The underlying `DialogContent` defect survives this change.** Any future tall dialog hits it.
  → Called out as out of scope in the proposal so it is tracked rather than forgotten.
- **Redirect loops between the gate and `/setup`.** The two guards point at each other, so any
  state either treats as definitive when it is not — a flicker in `hasCompletedOnboarding`, a
  refetch error, a race with the MSAL `inProgress` dance already in `ProtectedRoute` — becomes an
  infinite navigation rather than a wrong render. → The definitive-answer rule above, plus an
  explicit test for each indeterminate state (loading, error) asserting that no navigation occurs.
- **`next` is attacker-controllable.** A crafted `/setup?next=https://evil.example` link turns the
  completion handler into an open redirect. → Same-origin relative-path validation with a `/home`
  fallback, tested with the hostile inputs directly (`//evil.example`, `/\evil.example`,
  `https://evil.example`, a path containing a backslash), not only the happy path.
- **Setup addresses are now reachable directly.** A configured user can type `/setup`, and an
  unauthenticated one can follow a link to it. → The reverse guard sends configured users away;
  the authentication guard still applies, so an unauthenticated visitor is redirected to `/` as
  with any protected route.

## Migration Plan

No data migration and no API change. The change is a client-side replacement of one gated surface;
rollback is reverting the commit. Because the API contract is unchanged, the frontend can ship
independently of `tacticus-planner-api`.
