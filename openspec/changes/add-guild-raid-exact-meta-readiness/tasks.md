## 1. Exact Readiness Domain

- [ ] 1.1 Add the pure exact-readiness resolver to `entities/guild-raid-meta` and verify table-driven tests cover Ready (five owned), Partial (one to four), Unavailable (zero), separate Machine-of-War ownership, authored order, and reactive boss/roster changes.
- [ ] 1.2 Add discriminated absent-Meta, no-boss-recommendation, missing-roster, and populated result states and verify tests prove Comp membership never creates a replacement or changes classification.
- [ ] 1.3 Extend the entity public presentation result with owned/missing unit and optional per-unit investment facts, and verify tests confirm no aggregate score or recommendation reordering is produced.

## 2. Recommendation Presentation

- [ ] 2.1 Add the desktop exact-Meta cards below status/resources with lineup, Comp signatures, source attribution, readiness, and owned/missing detail, and verify component tests cover Meta/alternate authored order and all classification badges.
- [ ] 2.2 Add the mobile readiness-first cards with compact lineup and expandable Comp/source details, and verify viewport tests assert the intended order and no horizontal scrolling below 768px.
- [ ] 2.3 Render the four data-absence/no-ready states without hiding Guild Raid status, and verify page tests distinguish absent catalog, unsupported boss, missing roster, and valid results with no Ready team.

## 3. Copy, Tutorial, and Live Verification

- [ ] 3.1 Add all exact-readiness copy to every supported locale with real de/es/fr translations and verify locale key parity tests pass.
- [ ] 3.2 Update `guild-raids.tutorial.tsx` and translated `tour.guildRaids.steps.*` keys for exact Meta cards on desktop/mobile, and verify tutorial tests resolve the breakpoint-specific targets.
- [ ] 3.3 Use the full Aspire stack and authenticated browser to verify below 768px and at/above 768px: one Ready recommendation, Partial/Unavailable-only roster, missing roster, boss without Meta, absent Meta fixture, source/Comp expansion, and both tutorial variants; record screenshots/notes in the PR.

## 4. Repository Gates

- [ ] 4.1 Run `pnpm test:run` and verify all workspace tests pass.
- [ ] 4.2 Run `pnpm typecheck` and verify it exits successfully.
- [ ] 4.3 Run `pnpm lint` and `pnpm lint:fsd` and verify both exit successfully.
- [ ] 4.4 Run `git diff --check` and verify no whitespace errors are reported.
