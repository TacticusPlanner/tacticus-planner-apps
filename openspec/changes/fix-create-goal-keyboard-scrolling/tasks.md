## 1. Reproduction and fix

- [ ] 1.1 Reproduce `UI-001` in a supported browser at a short viewport using keyboard only, recording focused element, scroll owner, and failing key/path; verify the recorded case is repeatable.
- [ ] 1.2 Correct the sheet/form's bounded overflow and focus/scroll targeting without removing modal focus containment; verify every applicable field and footer action is reachable by keyboard.

## 2. Regression

- [ ] 2.1 Add interaction tests for tab navigation, focus containment, and scroll-target behavior where testable; verify focused Create Goal tests pass.
- [ ] 2.2 Manually check a tall populated form at short and ordinary desktop/mobile viewports with keyboard, mouse, and touch, including a combobox/popover and validation message; record results.
- [ ] 2.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.
