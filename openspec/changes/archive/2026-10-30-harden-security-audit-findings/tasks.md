## 1. Contract

- [x] 1.1 Pull the API branch's OpenAPI document (`pnpm --filter web api:pull <sha>`) and regenerate `schema.d.ts`; re-pin to the API PR's merge SHA before merging
- [x] 1.2 Read `Retry-After` into `ApiError.retryAfterSeconds`, with a test

## 2. Tacticus user id

- [x] 2.1 Add `isTacticusUserId` and `tacticusUserIdProblem` to `entities/account`, with tests
- [x] 2.2 Validate the id and show field-level messages in account setup, Account settings and the guild prerequisite card; update their tests

## 3. Guild

- [x] 3.1 Add `useGuildSync` to `entities/guild` (cooldown countdown, 403 copy) and use it in both Sync actions; tests for the countdown and the 403
- [x] 3.2 Map the purge refusals in the delete-guild dialog; a test per issue code

## 4. Caps

- [x] 4.1 Goal cap helpers in `entities/goal`; the create sheet blocks an over-cap type and maps `goalLimitReached`; tests
- [x] 4.2 Unarchive pre-check and `goalLimitReached` copy in goal status actions; tests
- [x] 4.3 Project cap helpers in `entities/project`; pre-check and copy in the Projects sheet and the inline picker; tests
- [x] 4.4 Team cap: `MAX_TEAMS_PER_LANE`, the write-queue toast, the create guard and a disabled Add team; tests
- [x] 4.5 Translated goal and project cap copy in the Legendary Event plan wizard

## 5. Goal request bounds

- [x] 5.1 Snapshot: catalog upgrade ids only, trimmed, distinct, at most 128 characters and 250 entries; tests
- [x] 5.2 Goal edit: no farming locations for Ascension, at most 100 locations; tests
- [x] 5.3 Distinct `dependsOnIndex` entries; test

## 6. Account purge

- [x] 6.1 Return `signInAccountDeleted` from `purgeAccount`; the dialog reports a kept sign-in account and offers Sign out; tests

## 7. V1 import

- [x] 7.1 Bucket and translate `goal_limit_reached`, `project_limit_reached`, `too_many_goals`, `outcomes_truncated`; tests
- [x] 7.2 Translate `lane_team_limit_reached` and `issues_truncated`; tests
- [x] 7.3 Translate the user-id part codes `invalid_tacticus_user_id` and `tacticus_user_id_conflict`; tests

## 8. Copy

- [x] 8.1 Add every new key to `common.json` and `legendaryEvents.json` in en, de, es and fr, translated
- [x] 8.2 No tour step changes: no new page, route or tour target

## 9. Gates

- [x] 9.1 `pnpm lint`, `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:run`, `pnpm build`, `git diff --check`
- [x] 9.2 `openspec validate harden-security-audit-findings --strict`

## 10. Manual verification (platform-independent; same copy and placement on desktop and mobile)

Needs the local Aspire stack running this branch's web app against the API branch `fix/security-audit-findings`, a Leader account with a registered guild, and an account seeded with 200 non-archived Rank goals, 100 non-archived projects and a lane with 50 teams.

- [ ] 10.1 Account setup and Account settings: a non-GUID user id is flagged and not sent; an id claimed by another account shows the in-use message
- [ ] 10.2 Guild page: Sync twice within a minute shows the countdown and re-enables Sync
- [ ] 10.3 Delete guild as a demoted Co-Leader shows the forbidden message and keeps the guild
- [ ] 10.4 Create a Rank goal at 200 Rank goals, create a project at 100, add a team to a full lane: each is blocked with its message
- [ ] 10.5 Purge with "Planner data and sign-in account" where the Entra delete fails: the kept-account alert and Sign out show
