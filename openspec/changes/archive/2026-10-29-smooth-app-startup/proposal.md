# Smooth the app's startup

## Why

A cold launch of the installed app took about 5.5 seconds and passed through seven different screens: the splash, a spinner on near-black, an empty public layout, the landing page saying "Account detected — signing you in…", "Loading your account…", a small spinner at the top of the shell, and finally Home. Most of that came from one cause. Tokens are tab-scoped, so every launch restores the session silently from the account hint, and the route guard did not wait for that restore. It sent the user to the landing page, which then sent them back once the restore finished. The rest came from four different waiting indicators, each with its own position and colour.

## What Changes

- Protected routes, and the not-found redirect, wait while the silent restore runs instead of sending the user to the landing page. They redirect to sign-in only once the restore has failed, or when there was nobody to restore.
- One boot screen replaces every wait that comes before real content: translations, MSAL's startup, the silent restore and the first account check. It is navy (the manifest's `background_color`) with the logo centred and a soft pulse, it stays dark in both themes, and it covers the viewport wherever it mounts. `index.html` holds a static copy inside `#root`, so it shows before the bundle has run.
- The onboarding gate no longer waits for `GET /account` when the signed-in account finished setup on this device before. It renders straight away, and the request still runs and still redirects to setup if the answer has changed. Only the MSAL account id is stored for this, and it is cleared when the account is deleted.
- While the lazy Home page loads, the shell shows a skeleton of Home's layout, stacked on mobile and in three columns from `lg`, instead of a spinner. Other pages keep the spinner. The Home chunk already starts downloading when the route matches.
- A signed-in visitor on a bare `/` sees the landing page, with "Open planner" in place of the hero's sign-in button. The redirect stays for `/?next=…`, the return path of an interactive sign-in. Signing in from the bare landing page now returns to `/home`, so it still ends on Home.

## Capabilities

### Modified Capabilities

- `app-startup-rendering`: the boot screen, its static copy, and the Home skeleton.
- `silent-sign-in`: protected routes wait for the restore.
- `onboarding-gate`: the loading state uses the boot screen; returning accounts skip the wait.
- `landing-page`: signed-in visitors can browse it.

## Impact

- `apps/web/index.html`; new `app/boot-screen.tsx`, `app/use-auth-pending.ts` and `app/layout/route-loading-fill.tsx`.
- `app/auth-route-guards.tsx`, `app/routes.tsx`, `app/onboarding-gate.tsx`, `app/providers/i18n-provider.tsx`, `app/layout/{mobile,desktop}-layout.tsx`.
- `entities/account` (new setup-complete hint; `purgeAccount` clears it), `shared/auth/use-sign-in-redirect.ts`, `pages/landing`.
- Deferred: keeping tokens in `localStorage` for the installed app, which would remove the silent restore's wait altogether but reverses the tab-scoped token cache decision.
