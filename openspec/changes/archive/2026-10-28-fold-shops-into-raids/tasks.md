## 1. Implementation

- [x] 1.1 Replace `shops-page.tsx` with a `TodayShops` section (no project selector, same states and layouts) and render it at the end of `TodayPage`; verify with `today-shops.test.tsx`.
- [x] 1.2 Move shop and group headings in `shops-desktop.tsx` / `shops-mobile.tsx` to h3/h4 under the section's h2; verify in `today-shops.test.tsx`.
- [x] 1.3 Redirect `/dailies/shops` to `/dailies/raids` and drop the Shops nav item and its `dailies:tabs.shops*` keys in every locale; verify with `dailies-layout`, `section-tabs`, `desktop-section-navigation`, `desktop-layout`, `mobile-layout` and `use-section-entry-path` tests.
- [x] 1.4 Append the shop tour steps (from the `shops` namespace) to `useTodayTutorial` and delete `shops-page.tutorial.tsx`; verify with `dailies-tutorial.test.tsx`. No new strings, so no translation work.
- [x] 1.5 Run the targeted tests, `pnpm typecheck`, eslint on changed files, `pnpm lint:fsd` and `git diff --check`; full suite left to CI per project instructions.

## 2. Desktop verification (≥768px)

- [ ] 2.1 With a populated project and with "All goals": Raids shows the raid lanes then the Shop recommendations section in a multi-column card grid; the Raids project selector changes both.
- [ ] 2.2 The Today tour ends with the three shop steps; `/dailies/shops` lands on Raids; the section menu has no Shops entry.

## 3. Mobile verification (<768px)

- [ ] 3.1 With a populated project: the shop section renders the dense mobile rows below the raid lanes; the tab row has no Shops tab.
- [ ] 3.2 With a project with no Active goals: the shop section shows its no-goals state while raids show theirs.

## Notes

- Manual verification needs the Aspire stack, which was not available in the session that made this change; sections 2 and 3 are open for review.
