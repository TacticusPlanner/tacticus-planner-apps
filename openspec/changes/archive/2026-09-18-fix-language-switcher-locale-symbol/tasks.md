## 1. Locale configuration

- [x] 1.1 In `apps/web/src/fsd/shared/config/i18n/locales.ts`, replace each entry's
      `flag` and `labelKey` fields with a `nativeName` literal (`en: "English"`,
      `fr: "Français"`, `de: "Deutsch"`, `es: "Español"`), keeping the array `as
    const`. Verify `pnpm typecheck` reports errors only at the two
      `language-switcher.tsx` call sites that still read the removed fields.
- [x] 1.2 Confirm nothing else in the repo reads `flag` or `language.options`
      (`rg "\.flag\b|language\.options" apps/web/src apps/web/public`), so the
      removal in 1.1 and 3.1 is complete. Verify the search returns no hits
      outside the files this change edits.

## 2. Switcher component

- [x] 2.1 In `apps/web/src/fsd/app/providers/language-switcher.tsx`, render the
      active locale's uppercased `code` as the trigger's visible content instead
      of the flag emoji. Keep `data-testid="language-switcher"` — three consumer
      tests and `general.tutorial.test.tsx` reference it. Verify the trigger
      reads `EN` in the browser on Windows.
- [x] 2.2 Give the trigger an accessible value naming the language: drop
      `aria-hidden="true"` from the value span and add a visually-hidden
      `nativeName` alongside the visible code (Tailwind `sr-only`). Verify the
      accessible name/value pair resolves to "Language" + "English" in the
      accessibility tree, not "Language" + "EN" (spec: _Active language is
      exposed to assistive technology_).
- [x] 2.3 Render each dropdown option as its `code` plus `nativeName`, replacing
      the flag + `t(locale.labelKey)` pair. Verify the open list reads `EN
    English`, `FR Français`, `DE Deutsch`, `ES Español` in every UI language.
- [x] 2.4 Let a full-width mount show the native name beside the code in the
      trigger, so the account drawer's `w-full` control is not two letters of
      text in a wide box (spec: _Full-width control on a roomy surface_). Verify
      the desktop header stays compact (code only) while the drawer shows code +
      native name.

## 3. Translation resources

- [x] 3.1 Remove the `language.options` block from
      `apps/web/public/locales/{en,de,es,fr}/common.json`, keeping
      `language.label` in all four — it is the switcher's accessible label and
      the visible label beside it in `mobile-header.tsx` and `auth-control.tsx`.
      Verify all four files still parse and `language.label` is present in each.
- [x] 3.2 Confirm no new user-facing strings are introduced by this change:
      native language names are deliberately untranslated literals (spec:
      _Options are labelled by native language name_), and locale codes are not
      translated. Verify no locale file gains a key.

## 4. Tests

- [x] 4.1 Add `apps/web/src/fsd/app/providers/language-switcher.test.tsx` — the
      component has none today and is `vi.mock`'d by all three of its consumers'
      tests, so every behavior below is currently uncovered. Verify the new file
      runs under `pnpm test:run`.
- [x] 4.2 Cover the trigger: it shows the active locale's uppercased code and no
      emoji, and shows the same code for the same language regardless of
      platform. Verify by asserting on rendered text for at least two languages.
- [x] 4.3 Cover the accessible value: assert the switcher's accessible value
      names the language (`Español`) rather than being empty or the bare code.
- [x] 4.4 Cover the options: assert all four options render code + untranslated
      native name, in order, while the UI language is German — a language whose
      own `common.json` must not translate the other three names.
- [x] 4.5 Cover switching: selecting French calls `changeLanguage("fr")` and the
      trigger then reads `FR`.

## 5. Verification

- [ ] 5.1 Manually verify on Windows in Chrome or Edge — the platform where flag
      emoji fall back to letters and the reported `GB` came from. Check all three
      surfaces: desktop header (signed out is fine), mobile guest settings
      popover below 768px, and the signed-in account drawer. The drawer needs an
      authenticated session, so run it against the workspace Aspire AppHost if
      the stack is already up; start it if not. - Desktop header **verified** against the running Aspire stack on Windows
      Chrome: trigger reads `EN`, switches to `DE`, dropdown lists `EN English` /
      `FR Français` / `DE Deutsch` / `ES Español` with no emoji, and the native
      names stay untranslated while the UI is German. - Account drawer **verified** at a 966px-wide mobile viewport: the
      full-width control reads `EN  English` under the "Language" label, its
      dropdown lists all four options as code + native name, and the
      accessibility tree reports name "Language" with value "English". - Mobile guest settings popover **not verified**: it renders only when
      signed out (`mobile-header.tsx`), and the available session is signed in.
      Reaching it means signing out, and signing back in requires entering
      credentials. It mounts `<LanguageSwitcher />` with no props — the same
      compact form already verified in the desktop header and covered by
      `language-switcher.test.tsx` — so this is an eyeball check, not an
      untested path.
- [x] 5.2 Run the repository gates: `pnpm test:run`, `pnpm typecheck`,
      `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`. Verify all pass.

<!--
No Joyride task: the switcher is shared shell rather than a page, and
`shared/tour/general.tutorial.test.tsx:41` asserts the app-wide tour
deliberately does not target `[data-testid="language-switcher"]`. This change
does not alter that, so no tour step or `tour.*` key is added.
-->
