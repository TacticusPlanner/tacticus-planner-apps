## 1. Shared Guild Access Feature

- [ ] 1.1 Create the `features/guild-access` public slice and pure six-state resolver over `guildQueries.current()`, and verify unit tests cover loading, failure, Tacticus-user-id-required, unregistered, never-synchronized, and ready states.
- [ ] 1.2 Move/rebuild the existing prerequisite forms and sync handoff inside the shared feature without changing API semantics, and verify component tests cover the role-unknown unregistered form, successful query refresh, registration authorization rejection with Leader/Co-Leader handoff, authorized sync, and registered-member guidance.
- [ ] 1.3 Migrate `/guild` to render its management experience through the shared ready slot and verify existing Guild page/member/sync/purge regression tests pass.

## 2. Guild Raids Page Shell

- [ ] 2.1 Add the lazy `/dailies/guild-raids` page and route it through the shared access feature, and verify route/page tests show onboarding for every missing prerequisite and a neutral page-owned ready slot for a synchronized guild.
- [ ] 2.2 Remove the Guild Raids Under Construction route usage and verify Dailies navigation tests still highlight and deep-link all six primary tabs correctly.

## 3. Copy, Tutorial, and Responsive Verification

- [ ] 3.1 Add all access/shell copy to every supported `dailies`/common locale with real de/es/fr translations and verify the locale key parity tests pass.
- [ ] 3.2 Create and register `guild-raids.tutorial.tsx` with desktop/mobile access-shell steps and their translated `tour.guildRaids.steps.*` keys, and verify tutorial tests resolve valid test-id targets at both breakpoints.
- [ ] 3.3 Use the full Aspire stack and authenticated browser to verify below 768px and at/above 768px: user-id-required, unregistered, never-synchronized manager, never-synchronized member, ready guild, load error/retry, and both tutorial variants; record screenshots/notes in the PR.

## 4. Repository Gates

- [ ] 4.1 Run `pnpm test:run` and verify all workspace tests pass.
- [ ] 4.2 Run `pnpm typecheck` and verify it exits successfully.
- [ ] 4.3 Run `pnpm lint` and `pnpm lint:fsd` and verify both exit successfully with the new feature boundary.
- [ ] 4.4 Run `git diff --check` and verify no whitespace errors are reported.
