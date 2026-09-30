## 1. Desktop shell and menu state

- [x] 1.1 Create an isolated apps worktree based on the current route changes and review this change's artifacts before code; verify Plan includes Schedule and the existing worktree changes remain intact. Waived by user: worked directly on main, no worktree; artifacts reviewed.
- [x] 1.2 Compose the slim global bar, main rail, existing page header, section column, and route outlet in the app layout; verify desktop layout tests locate each region and no duplicate brand, search, or account controls remain.
- [x] 1.3 Own independent primary/section expansion state above the responsive shell branch with compact/expanded defaults and no persistent restoration; verify sibling, cross-section, childless, search, Back/Forward, and breakpoint transitions retain choices while fresh document initialization resets them, including with an old sidebar cookie.
- [x] 1.4 Replace child flyouts with the persistent active-section navigation, active nested-route styling, label tooltips, and independent accessible collapse/reopen control (layout revised by 1.6: the reopen control now lives in the page header); verify Plan, Library, single-child Guild, childless Home, focus handling, and hidden-link tab order in navigation tests.
- [x] 1.5 Preserve existing section-entry memory, page breadcrumbs/descriptions, route filtering, and page content state; run section-entry, active-navigation, header, and mobile tab regression tests with current Library and Schedule routes.
- [x] 1.6 Give the section menu a header with the section name and collapse button and text-only child rows (no icons, no Goals count); make it a full-height column with the page header and outlet in the content column to its right (the panel pushes the header right); show the title alone when expanded, and a reopen button plus "Section ›" breadcrumb before the title when collapsed; verify layout tests for panel header, text-only rows, sibling-column structure, expanded vs collapsed header, no leftover floating control, childless Home, and focus handoff between the two toggle buttons.

## 2. Top-bar search and account preferences

- [x] 2.1 Move the existing search launcher/dialog and Ctrl/Cmd+K handling into the desktop top-bar composition; verify label/description matching, anonymous filtering, direct child navigation, shortcut toggling from focused inputs, Escape, and focus return.
- [x] 2.2 Move authenticated account access to the top-right and align its card below/right with viewport collision handling; verify avatar/name, loading/error fallbacks, identity/name editing, catalog status, existing account actions, guards, Escape, and outside dismissal in account tests.
- [x] 2.3 Reuse ThemeSwitcher inside the desktop account card (now the Preferences three-icon switch, see 2.5) and add guest preferences with existing sign-in behavior; verify all three themes, persisted theme across reload, anonymous Library access, and silent-restore/manual-login states without changing mobile controls.
- [x] 2.4 Remove superseded desktop controls while retaining sidebar Create Goal/Sync and moving the rail toggle (first) and tour button (second) to the top of the rail (language, feedback and the board link move per 2.6, 2.7 and 2.8), stacking them on separate rows with the toggle as a full-width row button and the section panel header as a full-width row button aligned with the page title, aligning Sync with Create Goal (measured in the browser), and dropping the search launcher tooltip; verify existing action shortcuts and mobile account/layout tests pass.

- [x] 2.5 Re-layout the desktop account card as identity header with edit button (Account settings profile tab), Preferences (theme three-icon switch, Language row with current language and chevron), Account settings, Import from V1 as a plain top-level row, Send feedback, Roadmap, Sign out, and a quiet catalog-status footer; verify account tests for order, edit-to-profile, top-level Import from V1 navigation, feedback, sign-out, footer, and that no export/restore/shortcuts/delete rows exist (out of scope, follow-up).
- [x] 2.6 Move the UserJot feedback button from the page header into the desktop global bar beside the account trigger, verify a single feedback button in the bar, none in the header controls, and unchanged widget-open behavior.
- [x] 2.7 Replace the desktop page-header language selector with a Language row and in-card picker (reusing the LanguageSwitcher language logic) in both the account card and the guest preferences menu; verify picker selection, guest access, and that mobile language controls are untouched.
- [x] 2.8 Remove the page-header board link icon and add a localized "Roadmap" row (en/de/es/fr) to the desktop account and guest menus opening the single-source roadmap URL in a new tab with rel noopener; keep the mobile drawer board link; verify href/target/rel, guest availability, and no board link in the header.
- [x] 2.9 Restyle the mobile account drawer and mobile guest settings popover to the shared account card (identity, Preferences with in-view language picker, Account settings, Import from V1, Send feedback, tour row, Roadmap, Sign out, catalog footer), remove superseded mobile-only controls, keep the drawer testids and tour orchestration; verify auth-control and mobile-layout tests, en/de/es/fr, and browser screenshots at a mobile width.
- [x] 2.10 Make Ctrl/Cmd+B toggle the section menu (opt-out `keyboardShortcut` prop on SidebarProvider, default preserved; none on the main rail), with focus rules and platform-aware title/aria-keyshortcuts hints; verify ui and desktop-layout tests (input focus, repeat, childless no-op, rail unchanged) and in the browser.
- [x] 2.11 Animate the section column width like the rail (200ms linear, motion-reduce safe, inert/invisible when collapsed); verify tests for inert/aria-hidden state, tour target fallback to the reopen button, and width sampling during a toggle in the browser.

## 3. Responsive styling, copy, and tours

- [ ] 3.1 Constrain top-bar sizing (now including the feedback button), truncation, panel scrolling, and wide page content; verify at 768px and a wide desktop viewport with both menus expanded, long translated labels, and a populated Schedule.
- [x] 3.2 Add localized labels/tooltips for new navigation and guest controls in en/de/es/fr; verify key parity and real translations, with no untranslated user-facing strings.
- [x] 3.3 Update general.tutorial.tsx desktop steps and corresponding en/de/es/fr tutorial copy for global search/account, section navigation, and remaining footer controls; verify automated tutorial tests cover childless and collapsed-menu starts and preserve mobile drawer orchestration.

## 4. Desktop verification

- [ ] 4.1 Use the Aspire stack with healthy web/API and signed-in data containing a populated Schedule plus an account with no goals/projects; at 768px and a wide viewport verify shell layout, scrolling, both toggles, all route navigation paths, direct nested Library links, and refresh-only resets. Record browser evidence.
- [ ] 4.2 Verify top-bar search/shortcuts and account/theme keyboard flows in signed-in and signed-out Library states; confirm theme persists while menu presentation resets, and existing identity/account actions remain reachable without performing destructive account actions.
- [ ] 4.3 Run the general desktop tour from a populated Plan page, childless Home, and an initially collapsed section menu; verify targets, focus, Next/Back/close, and retained menu choices with screenshots.

- [ ] 4.4 In the signed-in desktop browser at a wide viewport, verify and screenshot the expanded panel (name, collapse button, text-only rows, full-height column with the header to its right), collapsed panel (reopen button and breadcrumb in the page header, no leftover column), the account card (header, Preferences, Language row picker, Import from V1 row, footer), the top-bar feedback button, the rail top tools and Sync alignment, and the search launcher without tooltip; open and cancel only, restore theme System, no data changes or sign-out. Evidence under evidence/.

## 5. Mobile verification

- [ ] 5.1 Below 768px, using signed-in and signed-out Library states, verify the existing header, bottom bar, drawer, route tabs, account/theme controls, and lack of desktop top bar/section column; resize back to desktop and verify prior menu choices survive.
- [ ] 5.2 Run the general mobile tour on the healthy Aspire stack; verify account drawer opening/closing, target readiness, Next/Back/close, and touch interaction, recording browser evidence.

## 6. Integration and completion

- [ ] 6.1 Run pnpm test:run, pnpm typecheck, pnpm lint, pnpm lint:fsd, pnpm build, and git diff --check; resolve failures and record results.
