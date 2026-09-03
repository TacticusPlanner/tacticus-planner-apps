## 1. Selection-state behavior

- [x] 1.1 Add a pure Character Lookup range-derivation helper in the existing
      selection hook that advances rank and progression together, including
      progression required by the target rank and maximum-endpoint fallback.
- [x] 1.2 Use the helper for incomplete/missing URL defaults while retaining
      complete valid URL ranges and the existing parameter names.
- [x] 1.3 Track generated versus user-authoritative draft state so rank or
      progression edits cannot be overwritten by a later synced-player result.
- [x] 1.4 Update the Character Library synced-player prefill integration to
      seed the selected character through the shared derivation path once per
      selection, without changing desktop or mobile presentation components.

## 2. Automated regression coverage

- [x] 2.1 Extend `use-lookup-selection` tests for anonymous defaults, a
      progression boundary required for the next rank, and maximum rank and
      progression fallback ranges.
- [x] 2.2 Add hook-level tests proving complete URL-backed values and a draft
      edit made before a delayed prefill remain authoritative.
- [x] 2.3 Extend Character Lookup page tests for synced-player initialization
      and switching between character records, including no stale prefill after a
      selection change.
- [x] 2.4 Verify the shared derived state through both desktop and mobile
      Character Lookup control variants without adding viewport-specific behavior.

## 3. Manual verification and quality gates

- [ ] 3.1 In the full Aspire stack, verify the anonymous Characters Library
      defaults at a viewport below 768px and at or above 768px with catalog data
      loaded: rank and progression endpoints must advance and remain compatible.
- [ ] 3.2 In the full Aspire stack with a signed-in player who owns at least
      two characters, including one at maximum rank or progression, verify
      character switching seeds each current state once, retains a meaningful
      maximum range, and does not replace an explicit shared URL or a manual
      control edit.
- [x] 3.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`,
      and `git diff --check`.
