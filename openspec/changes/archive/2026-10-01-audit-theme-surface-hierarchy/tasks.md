## 1. Baseline and audit evidence

- [x] 1.1 Start an isolated apps worktree after revamp-desktop-navigation and review these artifacts plus goal-visual-accessibility; verify current shell surfaces and preserve existing route/action behavior. (Worktree waived by user; reviewed and verified on main.)
- [x] 1.2 Record an audit.md surface/state matrix in this change using UI Kit, Home, Goals, Schedule, and Library in light and dark mode; verify each finding identifies its source token/class, rendered state, viewport, screenshot, retain/change decision, and whether it is a visual hierarchy issue or a measured contrast issue.
- [x] 1.3 Measure actual foreground/background combinations for muted text, inputs, buttons, navigation selection/focus, cards, and overlays, including alpha compositing; verify numeric results and distinguish enabled meaningful cues from decorative boundaries and disabled states.

## 2. Surface and component corrections

- [x] 2.1 Define coherent light/dark canvas, card, overlay, and navigation roles, adding semantic top-bar/section-menu/page-header roles where needed; verify token consumer inventory and retain/change rationale, preserving useful white-card light hierarchy and correcting dark card/canvas ordering.
- [x] 2.2 Apply shell surface roles to desktop global bar, rail, submenu, and page heading and to mobile header/bottom bar; verify both theme/layout combinations show identifiable navigation and integrated page headings without changing behavior or dimensions.
- [x] 2.3 Correct shared Card, Input, Button, menu/popover/dialog/sheet/drawer, tooltip, and direct Schedule surface consumers as indicated by the audit; verify updated composited text/control measurements and matching after screenshots, avoiding unnecessary page-local colors.
- [x] 2.4 Check hover, selected, focus, disabled, progress, badge, and semantic color consumers of every changed token; verify non-hue selection cues, existing goal-accessibility targets, and preserved rarity/rank/project/event meanings.
- [x] 2.5 Add focused regression checks for palette luminance relationships and applicable text/control contrast using the actual palette/compositing logic; verify failures are triggered by hierarchy or readability regressions rather than exact-color snapshots.

## 3. Desktop verification

- [ ] 3.1 On a healthy Aspire stack at 768px and a wide desktop viewport, capture matching light/dark Home, Goals, Schedule, and Library states, with populated goals/projects, empty states, and long labels; verify hierarchy and contrast and append before/after evidence to audit.md.
- [ ] 3.2 In both themes, verify expanded/compact rail, expanded/collapsed submenu, top-bar search, account menu, creation form, tooltip, hover/selected/focus/disabled states, and meaningful status/progress colors; record measured pairs and screenshots for all corrected findings.
- [ ] 3.3 Verify Light/Dark/System, reload persistence and system changes, including open overlays/form values; run general/page tours to check callout readability and unchanged selectors/interaction. Update tutorial copy and en/de/es/fr translations only if an affordance description changed, and verify relevant tour tests.

## 4. Mobile verification

- [ ] 4.1 Below 768px, capture matching light/dark populated and empty Goals/Schedule and public Library states; verify card/canvas hierarchy, header/bottom navigation, muted labels, progress/status, and scroll behavior with evidence in audit.md.
- [ ] 4.2 Verify Menu/account drawers, search, input forms with keyboard visible, enabled/disabled actions, theme switching, and general/page tour readability in both themes; confirm no lost input, overlapping surfaces, or changed navigation behavior.

## 5. Integration and completion

- [ ] 5.1 Finish audit.md with a disposition for every audited finding and the final semantic palette/measurements; verify retained light surfaces are documented as retained and no unmeasured claim is reported as a contrast pass.
- [x] 5.2 Run pnpm test:run, pnpm typecheck, pnpm lint, pnpm lint:fsd, pnpm build, and git diff --check; resolve failures and record results, including theme and goal-accessibility regressions.
