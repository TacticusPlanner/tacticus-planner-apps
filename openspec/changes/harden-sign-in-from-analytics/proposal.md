## Why

The PostHog "Sign-in health" dashboard (`auth_step` events, Nov 2026) shows three avoidable failures and two gaps that make the rest hard to read:

- Most `no_response` returns from a sign-in redirect come back within half a second of leaving, almost all on Firefox and WebKit (Firefox 76 of 91, Mobile Safari 57 of 63, Chrome iOS 12 of 12), far too fast for a trip to the identity provider (successful ones take about 3s). The page was reloaded before the redirect left it. These bounces cause every loop-guard hit. The likely cause: those browsers abort the page's in-flight module loads as soon as the redirect starts, which the stale-build recovery reads as a stale build and answers with a reload that cancels the redirect.
- Samsung Internet's hidden-frame check found the session 0 of 25 times in 30 days, while its quiet renewals came back signed in 24 of 30.
- A cached-token restore that fails because the identity provider could not be reached (offline, a failed request, no authority metadata) goes on to a hidden frame and a quiet renewal that fail the same way, and the failed renewal starts its 12-hour cooldown.
- Return steps carry no sign-in method, so redirect success cannot be split by Google and email; steps sent later by another tab carry that tab's build version.

## What Changes

- While a sign-in redirect (interactive or quiet) is leaving the page, a stale-build failure no longer reloads it; the attempt for that URL is kept. If the redirect cannot start, stale-build recovery works again.
- Samsung Internet joins the browsers that skip the hidden-frame check and go straight to the quiet renewal.
- A cached-token restore that fails on a network error stops there: no hidden frame, no quiet renewal, no cooldown. The cached account stays, and the first API call tries the refresh token again.
- `auth_step` return steps carry the sign-in method and how the returned-to page was loaded (`navigation_type`: `navigate`, `reload`, `back_forward`); every step carries the build that recorded it (`recorded_app_version`).

## Capabilities

### Modified Capabilities

- `app-error-recovery`: no stale-build reload while a sign-in redirect is leaving the page.
- `silent-sign-in`: Samsung Internet skips the hidden check; a network failure during the cached-token restore stops the restore without further checks.
- `product-analytics`: sign-in steps carry the method on return, the navigation type and the recording build.

## Impact

- `apps/web/src/fsd/shared/auth` (journal, restore, hidden-frame support), the stale-build callers in `app/boot/stale-build-recovery.ts` and `app/routes/route-error-boundary.tsx`, the `auth_step` event declaration, mapping and capture.
- No API, locale or UI change. The PostHog dashboard can split the new properties once data arrives.
