## Context

See `proposal.md` - Why. Relevant existing pieces: `app/providers/theme-switcher.tsx` and `language-switcher.tsx` (the app's own theme/locale sources of truth), `entities/account`'s `useCurrentUser()` plus MSAL's `useIsAuthenticated()`/`useMsal()` (identity source), `desktop-layout.tsx`'s section-header icon row (`ThemeSwitcher` / `LanguageSwitcher` / `TourButton`, currently at lines ~78-86), and `auth-control.tsx`'s mobile account `Drawer` (theme/language/tour/account actions today). TanStack Query is the app's existing pattern for API calls. The companion `tacticus-planner-api` change exposes the signed-token endpoint this design consumes; it applies first.

## Goals / Non-Goals

**Goals:**

- Load the UserJot v3 SDK and drive it from a custom launcher (per proposal), not the default floating button.
- One shared piece of state/logic behind both entry points (desktop button, mobile drawer row) so unread-badge wiring isn't duplicated.
- Keep the widget's identity always verified (signed) - never send an unsigned `identify()` call.

**Non-Goals:**

- UserJot Automatic Login / SSO to UserJot's own public pages (e.g. a standalone `feedback.userjot.com` page) - everything here happens inside the in-app widget, so that layer isn't needed.
- Conversations/live chat - explicitly deferred per the proposal.
- Pinning the SDK to a specific v3 build - UserJot's beta contract for this API surface commits to not renaming or changing method behavior, so the unversioned `cdn.userjot.com/sdk/v3/uj.js` URL from their install docs is used as-is.

## Decisions

- **Install the two `<script>` tags directly in `apps/web/index.html`**, not via a React-mounted loader. The SDK's own queuing proxy (`window.uj ||= new Proxy(...)`) means call order never matters, so there's nothing a provider adds by injecting the script itself - it's a static asset, use the platform's own tag. The project id is public (only the _secret_ is sensitive) and substituted via Vite's built-in `%VITE_USERJOT_PROJECT_ID%` HTML env replacement, so no new build tooling is needed. `init()` is called inline with `widget: { launcher: false }` so the default floating button never renders.
- **One `useUserJot()` hook (new, under `app/providers`) is the single integration point** for both entry points and the identity/theme/locale sync effects. It wraps `uj.on('unread', ...)`, `uj.getState()`, and an `open()` passthrough. The desktop header button and the mobile drawer row both consume it instead of each subscribing to widget events independently.
- **Identify on auth-ready, re-identify on every widget open, never fall back to unsigned.** The hook fetches a fresh token from the API endpoint (TanStack Query, no caching beyond the request) when `useCurrentUser()`/MSAL report a signed-in session, and again each time `uj.on('open', ...)` fires - since tokens are capped at 1 hour, re-fetching on open is simpler and more robust than a background refresh timer, and matches how briefly a user session is normally open. If the fetch fails, the hook does nothing further (per spec, the widget stays open and usable anonymously) - it does not fall back to an unsigned `identify()`, since the whole point of this change is a verified identity.
- **`uj.open()` is called immediately on click; identify runs in parallel, not as a gate.** The SDK accepts `identify` calls at any time and upgrades the live session once the call resolves, so there's no reason to delay opening the widget on a network round-trip.
- **Theme/locale sync via effects that call `uj.setTheme()` / `uj.setLocale()`** whenever the app's own theme or `i18n.language` changes, replacing `init()`'s static `theme`/`locale` options (which only cover first load).
- **Desktop button follows the existing compact-icon-with-indicator shape already used by `CatalogSyncStatusBadge`** (icon + tooltip, badge/dot overlay for unread) rather than introducing a new visual pattern for a status indicator.

## Risks / Trade-offs

- Re-identifying on every `open` adds a network round-trip on each click -> Mitigated by not gating the open on it (see above); worst case the session is briefly less "verified" than needed for messages, which is deferred anyway.
- Two entry points (desktop, mobile) both need to render "loading/unread" state -> Mitigated by centralizing that in `useUserJot()`, so there's one implementation to keep correct, not two.
- Beta SDK could still surface bugs UserJot hasn't caught -> Accepted; low-stakes surface (feedback/roadmap/changelog), not a critical path.

## Migration Plan

- No data migration. Ships as: index.html script tags + `VITE_USERJOT_PROJECT_ID` env var, `useUserJot()` hook, desktop button in `desktop-layout.tsx`, mobile row in `auth-control.tsx`'s drawer. Can be feature-complete in one release; no rollout sequencing needed beyond the companion API endpoint being live first (it has no effect until called, so order of deployment isn't strict, but the proposal's stated order - API first - is followed for consistency).
