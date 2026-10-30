## Context

The API change `harden-security-audit-findings` adds new 4xx responses on existing routes and one response header. No request or response schema gains a field, so the client changes are about reading issue codes, headers and counts, and about never building a request the API now refuses.

## Goals / Non-Goals

**Goals:**

- Every new refusal reads as translated copy where the action happened.
- Where the client already holds the data that decides a cap, it does not send the request.
- The client never builds a goal payload the new validation rejects.

**Non-Goals:**

- No new page, route, layout or tour step. Desktop and mobile render the same messages in the same places, so no platform split is specified.
- No server-side change. Counts the client cannot see (another device's writes since the last read) still fall back to the API's answer.

## Decisions

### D1. Key on issue codes, translate in the client

The server's `detail` is English. Each new code maps to a key in `common` (or `legendaryEvents` for team toasts). A code with no mapping keeps today's behavior (the server text), so a future code is never hidden.

### D2. Limits live in the owning entity

- `entities/goal`: `MAX_GOALS_PER_TYPE`, `goalTypesOverLimit`, `isGoalLimitError`, plus the snapshot and farming-location bounds.
- `entities/project`: `MAX_PROJECTS`, `isAtProjectLimit`, `isProjectLimitError`.
- `entities/legendary-event`: `MAX_TEAMS_PER_LANE`; the plan write queue toasts `legendaryEventTeamLimitReached`.
- `entities/account`: `isTacticusUserId`, `tacticusUserIdProblem`.

Features and pages consume these through each slice's public API; no feature imports a sibling.

### D3. Pre-checks use data already loaded

- Goal create: the non-archived goal list (`useGoalsById`) plus the request's own specs. The over-cap type shows as a blocking issue in that type's card, like the slot conflict.
- Unarchive: the cached non-archived list plus the restored goals' types; a refusal is one toast.
- Project create: the cached project list; both the Projects sheet and the inline picker.
- Team create: the write queue's confirmed plan, checked inside the queued send, so Add, a suggestion and a leaderboard unit share one guard. Add team is also disabled at the cap.

### D4. One sync hook

Both Sync buttons (`pages/guild` and `features/guild-access`) use `entities/guild`'s `useGuildSync`. A 429 starts a countdown from `ApiError.retryAfterSeconds` (fallback 60 s), disabling the button until it ends. `rateLimited` is treated like the cooldown since both carry `Retry-After`.

### D5. Snapshot bounds

The recipe walk already aggregates by id, so duplicates cannot arise in practice. An id the catalog does not resolve is counted as a base material, so the create form filters the snapshot to catalog upgrade ids. The builder then trims, drops blank or over-long ids, de-duplicates and caps at 250 as a contract guard. A full rank ladder needs about 150 materials, so the cap never cuts real data.

### D6. Sign-in deletion result

`purgeAccount` returns `signInAccountDeleted` from the header. If the user chose to delete the sign-in account and it is `false`, the dialog does not sign out at once. It shows a destructive alert and a Sign out button. Planner data is already gone either way.

## Risks / Trade-offs

- [The loaded lists can be stale] → The API stays the authority; its refusal reads as the same translated copy.
- [A client-side GUID check that is stricter than the server] → It accepts the hyphenated, bare, braced and parenthesized forms a person would paste, matching `Guid.TryParse` for those.
- [Synthetic `ApiError` for the team pre-check] → It is created only inside the write queue's send, so the existing toast and rollback path handle it unchanged.
