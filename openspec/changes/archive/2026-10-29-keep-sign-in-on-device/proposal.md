# Keep the sign-in on the device

## Why

Tokens were kept in tab-scoped session storage, so every launch of the installed app was a new session. The app had to restore it through a hidden identity-provider frame, and on Android the installed app often cannot complete that frame. A cold launch then fell back to the landing page and the account picker. Severyn accepted the trade-off of keeping tokens on the device, for every browser and not only the installed app.

A recording of the launch after `smooth-app-startup` also showed two small breaks:

- an empty public layout with a spinner while the landing page's copy loaded;
- the boot screen's logo was about half the size of the Android splash icon it follows.

Separately, signing in from the landing page could return to the landing page instead of Home.

## What Changes

- MSAL's token cache moves from `sessionStorage` to `localStorage`, and the one-off removal of an old localStorage cache is dropped. A relaunch within the refresh token's 24 hours restores without any hidden frame. Signing out still clears the cache.
- The landing route waits on the boot screen until its namespace has loaded, then mounts the public layout with its copy in place.
- The boot screen's logo is 208px, matching the Android splash icon. It is centred on its own, with the pulse and any message hanging below it, in both the React and the static copies.
- When a sign-in redirect completes on a bare `/`, the address becomes `/home` before the router starts. This covers the case where the redirect bridge cannot read the start page and falls back to the site root.

## Capabilities

### Modified Capabilities

- `redirect-authentication`: the token cache is device-scoped.
- `silent-sign-in`: the restore reads the device's token cache.
- `app-startup-rendering`: landing page wait, and the logo matching the splash.
- `landing-page`: sign-in from the landing page always ends on Home.

## Impact

- `shared/auth/authentication.ts`, `app/auth-route-guards.tsx`, `app/boot-screen.tsx`, `apps/web/index.html`.
- Existing sessions stay in `sessionStorage` until the tab closes. After this deploy, the next launch restores once more through the account hint and then keeps its tokens.
