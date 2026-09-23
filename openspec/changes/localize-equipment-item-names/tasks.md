## 1. Names and resolver

- [ ] 1.1 Port ID-keyed English, German, Spanish, and French equipment-piece names into `equipmentItems` resources, register the namespace/types for every supported locale, and verify catalog-versus-locale key coverage with a test or check.
- [ ] 1.2 Update the shared `shopRewardDisplay` specific `I_*`/`R_*` branch to use locale name, catalog English, then readable-ID fallback; verify focused tests for each fallback and generic pools.

## 2. Consumers and verification

- [ ] 2.1 Load the namespace in Dailies Shops and Library Shops without changing reward identity/icon/quantity/eligibility; verify tests for both consumers and live locale switching.
- [ ] 2.2 Manually check representative specific items and a generic pool on both shop views at mobile and desktop widths, including missing/unknown-key fallbacks; record results.
- [ ] 2.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
