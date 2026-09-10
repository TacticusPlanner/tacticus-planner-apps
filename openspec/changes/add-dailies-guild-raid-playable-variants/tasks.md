## 1. Constrained Variant Matcher

- [ ] 1.1 Add the canonical ideal/recommended slot result types and bounded assignment search to `entities/guild-raid-meta`, and verify table-driven tests cover locked ideal heroes, explicit replacements only, duplicate-candidate conflicts, greedy-trap assignments, and deterministic ties.
- [ ] 1.2 Add Ready/Playable Variant/Partial/Unavailable classification from slot fillability and essential flags, and verify tests cover every state plus blocking-slot explanations.
- [ ] 1.3 Add explicit Machine-of-War alternative selection and verify tests cover ideal preference, highest-investment allowed replacement, authored/id ties, and missing MoW without changing hero readiness.
- [ ] 1.4 Add result ordering by readiness, substitution count, and authored order, and verify tests prove candidate combat power never reorders separate recommendations or becomes an effectiveness value.

## 2. Variant Recommendation UI

- [ ] 2.1 Extend desktop recommendation cards to compare ideal and recommended lineups side by side with role and replacement mappings, and verify component tests cover Ready, Playable Variant, Partial, and Unavailable presentations.
- [ ] 2.2 Extend mobile cards to prioritize the owned recommended lineup and collapse ideal/replacement detail, and verify viewport tests assert ordering and no horizontal scrolling below 768px.
- [ ] 2.3 Add rules-unavailable and no-viable-team states while retaining exact readiness/status, and verify page tests never infer Comp/general-roster substitutions.

## 3. Copy, Tutorial, and Live Verification

- [ ] 3.1 Add all variant/readiness/replacement copy to every supported locale with real de/es/fr translations and verify locale key parity tests pass.
- [ ] 3.2 Update `guild-raids.tutorial.tsx` and translated `tour.guildRaids.steps.*` keys for ideal-versus-recommended variants on desktop/mobile, and verify tutorial tests resolve the breakpoint-specific targets.
- [ ] 3.3 Use the full Aspire stack and authenticated browser to verify below 768px and at/above 768px: Ready, one-substitution Playable Variant, shared-candidate conflict, Partial, essential-slot Unavailable, missing MoW, rules unavailable, no viable team, result ordering, and both tutorial variants; record screenshots/notes in the PR.

## 4. Repository Gates

- [ ] 4.1 Run `pnpm test:run` and verify all workspace tests pass.
- [ ] 4.2 Run `pnpm typecheck` and verify it exits successfully.
- [ ] 4.3 Run `pnpm lint` and `pnpm lint:fsd` and verify both exit successfully.
- [ ] 4.4 Run `git diff --check` and verify no whitespace errors are reported.
