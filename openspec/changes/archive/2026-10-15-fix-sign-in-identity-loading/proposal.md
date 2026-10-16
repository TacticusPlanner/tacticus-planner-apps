## Why

UserJot "Sign-In Repeatedly Defaults to Wrong Account" (MoanKeigh, ~Oct 10):

> Sign-in issues - tries to log into wrong account and have to refresh or hit sign in with different account multiple times before the right one shows up.

Follow-up comment:

> Actually, it's the same account, but the username doesn't show up (MoanKeigh), it shows up as my email address only and everything hangs on loading until the username is populated.

So the account is right; the app looks wrong and frozen while `GET /me` is pending:

- The account control renders the neutral label ("Signed-in account") plus the MSAL account email until `/me` answers (`app/providers/auth-control.tsx`, `accountName = currentUser?.displayName ?? t("auth.account")`, `accountEmail = account.username`). Without the planner name it reads like a different account.
- The onboarding gate blocks every protected route behind an unlabeled spinner while `/me` is pending (`app/onboarding-gate.tsx`).
- `/me` is slow exactly for a returning user whose SPA refresh token (24h in Entra External ID) has expired: `acquireAccessToken` → `acquireTokenSilent` falls back to a hidden `prompt=none` frame, which only fails after MSAL's 10s `iframeBridgeTimeout` (`timed_out`) before the re-authentication redirect starts. At the same time the app-load silent restore (`ssoSilent`) runs a _second_ hidden frame for the same session in parallel, on every page load, even when cached tokens are valid. A user who refreshes during the wait restarts the whole wait.

## What Changes

- The app-load silent restore tries cached tokens (access token, then refresh token) first and only runs the hidden IdP session check when those are unusable. It starts before the first render.
- API token acquisition waits for an in-flight restore instead of racing a second hidden frame, and once the restore has failed it skips the frame so the interaction-required error (and the redirect) comes immediately.
- A rejected refresh token (`invalid_grant`) counts as interaction-required.
- The hidden-frame timeout is lowered from MSAL's 10s default to 6s.
- While `/me` is pending (or its interaction-required error is starting the redirect), the account trigger, desktop card and mobile drawer show a loading identity (placeholder avatar, skeleton, "Loading account") and no email or neutral fallback label.
- The onboarding gate's loading state is labelled ("Loading your account…" / "taking you to sign in…") and adds a "taking longer than usual, refreshing won't help" note after 5s.

`/me` retries are unchanged: they already apply only to network/5xx/429 failures, never to auth errors.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `silent-sign-in`: restore uses cached tokens before the hidden IdP check; token requests coordinate with it.
- `account-menu`: identity shows a loading state until the planner account is known.
- `account-display-name`: neutral identity scenario covers the loading state.
- `onboarding-gate`: labelled loading state with a slow-loading note; re-authentication starts without a second silent wait.

## Impact

`shared/auth/authentication.ts`, `main.tsx`, `app/providers/{auth-control,account-card,account-avatar}.tsx`, `app/onboarding-gate.tsx`, new `app/use-delayed-flag.ts`, `common` locale keys (en/de/es/fr), and tests. No API change, so no companion `tacticus-planner-api` change.

Follow-up (infra, not changed here): staging runs the API with `containerMinReplicas = 0` (`tacticus-planner-infra/params/stg.workload.bicepparam`), so the first `/me` there pays a container cold start; production already keeps 1 replica.
