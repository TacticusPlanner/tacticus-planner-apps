## 1. Shared control

- [ ] 1.1 Enlarge the shared slider root's horizontal and vertical hit box while keeping track and thumb visually unchanged; verify computed geometry and `shared-slider-interaction` scenarios in a browser.
- [ ] 1.2 Add focused tests for range/step, keyboard, disabled, and orientation behavior; verify the slider test suite passes.

## 2. Consumer regression

- [ ] 2.1 Check touch tap/drag and neighboring controls in Planning Settings, Progress event cards, and character lookup at narrow and wide viewports, with both enabled and disabled states; record observed results.
- [ ] 2.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
