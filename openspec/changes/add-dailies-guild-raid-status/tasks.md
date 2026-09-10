## 1. Status and Resource Model

- [ ] 1.1 Add the `entities/guild-raid-status` DTO, mapper, API call, and query factory matching regenerated OpenAPI, and verify tests cover active/no-season payloads, nullable fields, five-minute staleness, forced refresh, and API failures.
- [ ] 1.2 Add the canonical Guild Raids status/resource view-model mapper and verify tests cover boss/catalog resolution, unknown ids/configs, fresh/stale status, known/unknown season end, and independent missing token data.
- [ ] 1.3 Add observation-anchored season/token/bomb countdown helpers and verify fake-time tests cover full buckets, positive countdowns, zero/due values, and stale snapshots without locally inventing regenerated tokens.

## 2. Responsive Guild Raid Status UI

- [ ] 2.1 Implement the desktop status region with boss HP, tier progress, next boss, prime modifiers/thresholds, freshness, guild-sync time, and resources, and verify component tests assert all active-state fields and refresh behavior.
- [ ] 2.2 Implement the mobile boss-first layout with compact secondary cards and expandable modifier detail, and verify viewport tests assert ordering and absence of horizontal-overflow structures below 768px.
- [ ] 2.3 Implement loading, no-season, unmapped-catalog, stale fallback, initial error/retry, and missing-player-resource states while preserving independent useful data, and verify each discriminated component state has coverage.

## 3. Copy, Tutorial, and Live Verification

- [ ] 3.1 Add all status/resource/empty/error copy to every supported locale with real de/es/fr translations and verify locale key parity tests pass.
- [ ] 3.2 Update `guild-raids.tutorial.tsx` and translated `tour.guildRaids.steps.*` keys for status/resources with desktop/mobile target arrays, and verify tutorial tests resolve targets at both breakpoints.
- [ ] 3.3 With the companion API applied, use the full Aspire stack and authenticated browser to verify below 768px and at/above 768px: active mapped boss with primes/modifiers, no active season, unknown countdown, player tokens present/absent, stale retained data, hard error/retry, manual refresh single-action behavior, and both tutorial variants; record screenshots/notes in the PR.

## 4. Repository Gates

- [ ] 4.1 Run `pnpm test:run` and verify all workspace tests pass.
- [ ] 4.2 Run `pnpm typecheck` and verify it exits successfully.
- [ ] 4.3 Run `pnpm lint` and `pnpm lint:fsd` and verify both exit successfully.
- [ ] 4.4 Run `git diff --check` and verify no whitespace errors are reported.
