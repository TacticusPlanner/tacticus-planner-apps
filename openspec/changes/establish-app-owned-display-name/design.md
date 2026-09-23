## Context

The setup route currently advances from choice to key/import and treats `hasCompletedOnboarding` (key presence) as completion. `entities/account` maps `/me`; `auth-control` and avatar use the resulting name; Manage Account has no editor. Paired API change adds nullable confirmed name, private suggestion, confirmation state, and `PUT /me/display-name`.

## Goals / Non-Goals

**Goals:** One name-confirmation path after normal or V1 setup, and one editor for later changes; refresh every identity consumer from canonical account state.

**Non-Goals:** Provider profile editing, email changes, or client-side generation of a public fallback from claims.

## Decisions

1. Extend the setup route state machine with a `name` step after key/import. If key exists but name is unconfirmed, route directly to `name`; if name is confirmed but key absent, remain on key/import. Completion waits for both fields from a refreshed `/me`. Alternative: a free-floating modal outside setup. Rejected because it would bypass existing deep-link/back/reload rules.
2. `entities/account` owns the confirmed/suggested distinction and exports a typed current-user view. `features/account-onboarding` and `features/account-management` each consume it through the entity public API; app shell composes refreshed avatar and UserJot identity. Do not import one feature from another.
3. Keep a private name draft per form and only promote the saved server value on success. After save, invalidate/refetch `/me` and signed UserJot token, then re-identify. Alternative: optimistic public-name change. Rejected for privacy and failed-save rollback complexity.
4. Desktop setup can show name as a full-width step in the existing screen; mobile uses its distinct route and scrollable form. Account-management editor remains in the existing desktop dialog/mobile account flow. Tutorial targets and copy differ where structure differs; use the existing setup tutorial registration and account shell targets rather than a separate disconnected tour.

## Risks / Trade-offs

- [Setup guard loops on stale `/me`] → Navigate only when a refreshed response confirms both key and name; preserve existing retry behavior.
- [V1 suggestion arrives after import asynchronously] → Refetch `/me` before entering the name step, retaining a user-edited draft if they already typed.
- [Public widget retains old token] → Explicit token invalidation/re-identification after confirmed save; test a freshly decoded token.

## Migration Plan

Deploy API companion first, then update `/me` client mapping and setup gate together. Existing accounts with unconfirmed names receive the one-time name step with the previous value editable. No client storage migration is needed; rollback must be coordinated with the API's nullable-name contract.

## Open Questions

- Which existing mobile account-management wrapper should host the editor without hiding it below the drawer fold? Decide from the current rendered layout while preserving the editor contract and target coverage.
