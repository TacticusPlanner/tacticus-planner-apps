## Context

See the proposal and specs. The current `/guild` page owns query-state branching and page-local registration, Tacticus-user-id, sync, and registered views. `/dailies/guild-raids` is a placeholder. Both routes are already protected by the app's authentication/onboarding gate, and the existing current-guild endpoint exposes `tacticusUserIdRequired`, `unregistered`, or `registered` plus `lastSyncSucceededAt` and `canSynchronize`.

## Goals / Non-Goals

**Goals:**

- Provide one reusable UI state machine for guild prerequisites.
- Keep Guild management and Guild Raid ready content page-specific.
- Preserve current API calls and authorization behavior.

**Non-Goals:**

- Changing guild persistence or API contracts.
- Fetching Guild Raid status or showing recommendations.
- Sharing whole page/route components across FSD pages.

## Decisions

### Own the reusable journey in a `features/guild-access` slice

`entities/guild` continues to own DTOs, API calls, and current-guild query keys. A new feature slice owns the access-state resolver and reusable boundary UI, including prerequisite actions. Both `/guild` and `/dailies/guild-raids` consume the feature through its public index and provide page-specific ready children/render props.

Putting this under either page was rejected because pages cannot import pages. Putting action-heavy registration UI in the entity was rejected because the entity should describe guild data, not orchestrate onboarding.

### Derive readiness from one cached current-guild query

The feature calls the existing `guildQueries.current()` and derives the six UI states. Successful mutations invalidate/refetch that same query key. The registered response is ready only when `lastSyncSucceededAt` exists. There is no second local readiness flag.

### Preserve authorization-sensitive actions without inferring unregistered roles

The registered response uses `canSynchronize` to decide whether to show a working sync action or guidance to contact a Leader/Co-Leader. The `unregistered` response has `guild: null`, so it exposes neither `callerRole` nor `canSynchronize`; the shared surface therefore shows the existing credential form to every unregistered caller with an explicit Leader/Co-Leader eligibility notice and does not claim that the caller is authorized.

Registration remains server-authorized. When the server rejects a registration for role/credential authorization, the flow stays gated, shows the actionable API error plus Leader/Co-Leader handoff guidance, and lets the Dailies consumer link to Guild management. Adding a role-discovery API solely to pre-hide the form was rejected because the existing server decision is authoritative and this extraction does not need a new contract.

### Establish the Guild Raids page shell now

The Dailies route lazily loads a real `GuildRaidsPage`. It renders the shared access boundary and, when ready, a neutral page-owned ready container designed for later status/recommendation sections. It does not import `GuildPage` or expose member management.

### Desktop/mobile and tutorial behavior

The prerequisite cards use the same interaction hierarchy on both breakpoints, so most markup can responsively reflow. Desktop centers a bounded setup panel; mobile uses the full content width and keeps the primary action reachable without horizontal scroll. A co-located `guild-raids.tutorial.tsx` registers desktop and mobile steps with distinct selectors only where the shell differs. All copy and tutorial text use the existing supported locales.

## Risks / Trade-offs

- [Risk] Extracting current Guild components can alter `/guild` behavior → Keep API/mutation semantics unchanged and add regression tests for every existing Guild page state.
- [Risk] Unregistered responses cannot distinguish members from leaders before token submission → Explain eligibility before the form and turn an authorization rejection into explicit Leader/Co-Leader handoff guidance.
- [Risk] The ready slot is initially sparse → Use a neutral page-owned shell that later changes can fill, not another Under Construction state.

## Migration Plan

Introduce the feature slice, migrate `/guild` to it with regression coverage, then replace the Guild Raids placeholder. The change is client-only and additive at the route level; rollback restores the placeholder and page-local Guild branching.
