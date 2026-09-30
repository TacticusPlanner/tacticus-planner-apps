## 1. Desktop shell and menu state

- [ ] 1.1 Create an isolated apps worktree based on the current route changes and review this change's artifacts before code; verify Plan includes Schedule and the existing worktree changes remain intact.
- [ ] 1.2 Compose the slim global bar, main rail, existing page header, section column, and route outlet in the app layout; verify desktop layout tests locate each region and no duplicate brand, search, or account controls remain.
- [ ] 1.3 Own independent primary/section expansion state above the responsive shell branch with compact/expanded defaults and no persistent restoration; verify sibling, cross-section, childless, search, Back/Forward, and breakpoint transitions retain choices while fresh document initialization resets them, including with an old sidebar cookie.
- [ ] 1.4 Replace child flyouts with the persistent active-section navigation, active nested-route styling, label tooltips, and independent accessible collapse/reopen control; verify Plan, Library, single-child Guild, childless Home, focus handling, and hidden-link tab order in navigation tests.
- [ ] 1.5 Preserve existing section-entry memory, page breadcrumbs/descriptions, route filtering, and page content state; run section-entry, active-navigation, header, and mobile tab regression tests with current Library and Schedule routes.

## 2. Top-bar search and account preferences

- [ ] 2.1 Move the existing search launcher/dialog and Ctrl/Cmd+K handling into the desktop top-bar composition; verify label/description matching, anonymous filtering, direct child navigation, shortcut toggling from focused inputs, Escape, and focus return.
- [ ] 2.2 Move authenticated account access to the top-right and align its card below/right with viewport collision handling; verify avatar/name, loading/error fallbacks, identity/name editing, catalog status, existing account actions, guards, Escape, and outside dismissal in account tests.
- [ ] 2.3 Reuse ThemeSwitcher inside the desktop account card and add guest preferences with existing sign-in behavior; verify all three themes, persisted theme across reload, anonymous Library access, and silent-restore/manual-login states without changing mobile controls.
- [ ] 2.4 Remove superseded desktop controls while retaining sidebar Create Goal/Sync/tour/toggle and header language/feedback/board link; verify existing action shortcuts and mobile account/layout tests pass.

## 3. Responsive styling, copy, and tours

- [ ] 3.1 Constrain top-bar sizing, truncation, panel scrolling, and wide page content; verify at 768px and a wide desktop viewport with both menus expanded, long translated labels, and a populated Schedule.
- [ ] 3.2 Add localized labels/tooltips for new navigation and guest controls in en/de/es/fr; verify key parity and real translations, with no untranslated user-facing strings.
- [ ] 3.3 Update general.tutorial.tsx desktop steps and corresponding en/de/es/fr tutorial copy for global search/account, section navigation, and remaining footer controls; verify automated tutorial tests cover childless and collapsed-menu starts and preserve mobile drawer orchestration.

## 4. Desktop verification

- [ ] 4.1 Use the Aspire stack with healthy web/API and signed-in data containing a populated Schedule plus an account with no goals/projects; at 768px and a wide viewport verify shell layout, scrolling, both toggles, all route navigation paths, direct nested Library links, and refresh-only resets. Record browser evidence.
- [ ] 4.2 Verify top-bar search/shortcuts and account/theme keyboard flows in signed-in and signed-out Library states; confirm theme persists while menu presentation resets, and existing identity/account actions remain reachable without performing destructive account actions.
- [ ] 4.3 Run the general desktop tour from a populated Plan page, childless Home, and an initially collapsed section menu; verify targets, focus, Next/Back/close, and retained menu choices with screenshots.

## 5. Mobile verification

- [ ] 5.1 Below 768px, using signed-in and signed-out Library states, verify the existing header, bottom bar, drawer, route tabs, account/theme controls, and lack of desktop top bar/section column; resize back to desktop and verify prior menu choices survive.
- [ ] 5.2 Run the general mobile tour on the healthy Aspire stack; verify account drawer opening/closing, target readiness, Next/Back/close, and touch interaction, recording browser evidence.

## 6. Integration and completion

- [ ] 6.1 Run pnpm test:run, pnpm typecheck, pnpm lint, pnpm lint:fsd, pnpm build, and git diff --check; resolve failures and record results.
- [ ] 6.2 Open the apps PR with screenshots and verification results; wait for complete CI and latest-commit CodeRabbit review, address actionable findings, push fixes, and resolve addressed threads; verify checks and reviews cover the final commit.
- [ ] 6.3 After review completion, reconcile the header-picker requirement with move-raids-plan-to-plan-schedule, preserving its mobile/no-third-level-tab behavior and this change's desktop menu behavior; sync and archive the change, verify one coherent header requirement and no stale flyout/account-position wording in the affected capabilities, and account for remaining active apps changes with openspec list.
