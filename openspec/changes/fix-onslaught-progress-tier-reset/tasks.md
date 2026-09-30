## 1. Rule

- [ ] 1.1 Add `tierAfterSectorChange` next to `onslaught-page.tsx` and use it in the Sector select's `onValueChange`; verify the tier select updates to 1 on a move up and 4 on a move down, and stays put when the same sector is re-selected.
- [ ] 1.2 Unit-test the helper (up, down, same sector, from tier 4) and add a page test that changes Gold 4 → Diamond and asserts the Tier select shows 1 before Save; verify the existing save/conflict tests still pass.

## 2. Verification

- [ ] 2.1 Manually verify in the Aspire stack on desktop (≥768px) and mobile (<768px): set an alliance to Gold 4, change to Diamond → Tier 1; change back to Gold → Tier 4; Save persists the new position.
- [ ] 2.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
