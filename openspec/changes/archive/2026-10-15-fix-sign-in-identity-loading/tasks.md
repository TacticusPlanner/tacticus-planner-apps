## 1. Token acquisition

- [x] 1.1 Restore the session from cached tokens (`CacheLookupPolicy.AccessTokenAndRefreshToken`) before `ssoSilent`; keep the restore promise for token callers.
- [x] 1.2 Make `acquireAccessToken` wait for an in-flight restore and skip the hidden frame after a failed restore.
- [x] 1.3 Treat `invalid_grant` as interaction-required; set `iframeBridgeTimeout` to 6s.
- [x] 1.4 Start the silent restore in `main.tsx` before the first render.
- [x] 1.5 Tests in `authentication.test.ts` (cache-first restore, waiting, frame skip, timeout config, `invalid_grant`).

## 2. Honest loading state

- [x] 2.1 Account trigger (desktop and mobile), desktop card and mobile drawer show a loading identity while `/me` is pending or re-authenticating; no email or neutral label.
- [x] 2.2 Onboarding gate: labelled loading / re-authenticating status and a slow note after 5s (`useDelayedFlag`).
- [x] 2.3 i18n keys `accountGate.loading`, `accountGate.reauthenticating`, `accountGate.slow` in en/de/es/fr.
- [x] 2.4 Tests in `auth-control.test.tsx`, `onboarding-gate.test.tsx`, `use-delayed-flag.test.ts`.

## 3. Verification

- [x] 3.1 Run the `app/`, `shared/auth` and `entities/account` suites, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, Prettier and `git diff --check`.

## Deferred / out-of-session

- Live browser verification of the expired-refresh-token path (needs a >24h-old session against Entra) and the desktop/mobile loading identity in the Aspire stack: not run in this session; needs a tracking issue.
- Infra: consider `containerMinReplicas = 1` for staging (cold-start `/me`); needs a tracking issue in `tacticus-planner-infra`.
