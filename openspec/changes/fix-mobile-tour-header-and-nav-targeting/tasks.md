## 1. Reproduce and decide

- [ ] 1.1 On the Aspire stack below 768px, reproduce both steps signed in and guest at ordinary and short heights, scrolling forward/back and recording target/spotlight rectangles, scroll container, visual viewport, and selector; verify whether the current build actually misaligns.
- [ ] 1.2 Compare the reproduced cause with `fix-mobile-tour-account-drawer-positioning` and record whether this change remains separate or is folded into that proposal; verify the decision references observed geometry.

## 2. Correct and verify

- [ ] 2.1 If reproduced independently, correct target refresh or callout placement in the shared shell tour without changing normal sticky/fixed navigation; verify both steps align in the same viewport cases. If not reproduced, record the evidence and do not add speculative code.
- [ ] 2.2 Add focused tests for selector choice and any confirmed refresh behavior, plus manual checks of callout controls and safe areas; verify tests and recorded mobile checks pass.
- [ ] 2.3 If code changes, run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
