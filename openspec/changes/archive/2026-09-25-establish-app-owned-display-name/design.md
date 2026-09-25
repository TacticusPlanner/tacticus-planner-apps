## Context

The setup route currently advances from choice to key/import and treats `hasCompletedOnboarding` (key presence) as completion. `entities/account` maps `/me`; `auth-control` and avatar use the resulting name; Manage Account has no editor. Paired API change adds a nullable name, a private suggestion, `PUT /me/display-name`, and a `suggestedDisplayName` on the V1 import response.

## Goals / Non-Goals

**Goals:** One name step after normal or V1 setup, and one editor for later changes; refresh every identity consumer from canonical account state.

**Non-Goals:** Provider profile editing, email changes, or client-side generation of a public fallback from claims.

## Decisions

1. Extend the setup route state machine with a `name` step after key/import. If a key exists but no name is set, route directly to `name`; if a name is set but the key is absent, remain on key/import. Completion waits for both fields from a refreshed `/me`. Alternative: a free-floating modal outside setup. Rejected because it would bypass existing deep-link/back/reload rules.
2. `entities/account` owns the name/suggestion distinction (a name exists only once the user chose it) and exports a typed current-user view. `features/account-onboarding` and `features/account-management` each consume it through the entity public API; app shell composes refreshed avatar and UserJot identity. Do not import one feature from another.
3. Keep a private name draft per form and only promote the saved server value on success. After save, invalidate/refetch `/me` and signed UserJot token, then re-identify. Alternative: optimistic public-name change. Rejected for privacy and failed-save rollback complexity.
4. Desktop setup can show name as a full-width step in the existing screen; mobile uses its distinct route and scrollable form. The account-management editor is a Profile tab of the existing Manage Account dialog, and an edit icon beside the name in the account menu (desktop popover and mobile drawer) opens the dialog directly on it. The setup screen has no tour today and none is added; only the existing account-shell tour copy is updated to mention the planner name. The Manage Account editor is a Profile tab of the same dialog on desktop and mobile, so the open question about a mobile wrapper is resolved.

## Risks / Trade-offs

- [Setup guard loops on stale `/me`] → Navigate only when a refreshed response shows both key and name; preserve existing retry behavior.
- [V1 suggestion is not persisted by the API] → The setup route carries it from the import response to the name step in router navigation state, so it survives Back but not a reload; a reload falls back to the `/me` provider suggestion. A late-arriving suggestion never overwrites a draft the user already typed.
- [Public widget retains old token] → Explicit token invalidation/re-identification after a save; test a freshly decoded token.

## Migration Plan

Deploy API companion first, then update `/me` client mapping and setup gate together. Local accounts created before this change hold a provider-derived name and are reset (pre-production), so no legacy handling exists. No client storage migration is needed; rollback must be coordinated with the API's nullable-name contract.

## Open Questions

- Which existing mobile account-management wrapper should host the editor without hiding it below the drawer fold? Decide from the current rendered layout while preserving the editor contract and target coverage.
