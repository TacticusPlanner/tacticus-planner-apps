# Tasks

## 1. Wait for the silent restore

- [x] 1.1 `useAuthPending` covers MSAL interactions, a running restore and accounts msal-react has not caught up with; `AuthenticatedRoute` and `NotFoundRedirect` wait on it. Verify with `auth-route-guards.test.tsx`.

## 2. Boot screen

- [x] 2.1 `BootScreen` replaces `AuthResolving`'s spinner, the translation fallback and the onboarding gate's loading state, keeping the slow and re-authentication messages.
- [x] 2.2 Static copy in `index.html`.

## 3. Shell content

- [x] 3.1 Setup-complete hint in `entities/account`; the onboarding gate reads and writes it. Verify with `setup-complete-hint.test.ts` and `onboarding-gate.test.tsx`.
- [x] 3.2 Home skeleton as the shell's Suspense fallback on `/home`, in both layouts. Verify with `route-loading-fill.test.tsx`.

## 4. Landing page

- [x] 4.1 `LandingRoute` redirects a signed-in visitor only when `next` is present; the hero shows "Open planner". Verify with `auth-route-guards.test.tsx` and `landing-page.test.tsx`.
- [x] 4.2 Sign-in from the bare landing page returns to `/home`. Verify with `use-sign-in-redirect.test.ts`.
