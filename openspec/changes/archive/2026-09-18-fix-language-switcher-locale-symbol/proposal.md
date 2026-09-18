## Why

The language switcher's collapsed trigger renders only a flag emoji, and Windows
ships no flag glyphs — Chrome and Edge on Windows fall back to drawing the
regional-indicator pair as plain letters, so every Windows user sees a bare `GB`
button instead of a flag. A user reported this as "symbol for English being 'GB'
instead of 'EN' is a little strange". Swapping the flag for a different country
would not fix it: `🇺🇸` renders as `US` on the same machines. The trigger needs
real text, not an emoji.

The same trigger also has no accessible value: its only child is
`aria-hidden="true"`, so assistive technology announces the control but never
which language is selected.

## What Changes

- Replace the flag emoji in the switcher's collapsed trigger with the uppercased
  locale code (`EN`, `FR`, `DE`, `ES`), so the control reads identically on every
  platform.
- Announce the selected language to assistive technology by its **native name**,
  not by the bare code — the visible trigger stays compact while the accessible
  value reads `Español` rather than `ES`. Today the trigger announces nothing at
  all.
- Let a surface with room to spare show the native name next to the code: the
  account drawer mounts the switcher full-width under a visible "Language" label,
  where a two-letter control would waste the space.
- Keep the dropdown listing each language under its native name (`English`,
  `Français`, `Deutsch`, `Español`), which identifies the language more reliably
  than a country flag can.
- Move those native names out of the translation resources and onto
  `supportedLocales` as a `nativeName` field, so "never translated" is structural
  rather than a convention four locale files have to keep agreeing on.
- **BREAKING** (internal only): remove the `flag` field from `supportedLocales`,
  and remove the now-unused `language.options.*` keys from every locale's
  `common.json`. Nothing outside the switcher reads either.

## Capabilities

### New Capabilities

- `language-switcher`: How the app presents the current UI language and lets the
  user change it — what the collapsed trigger shows, how that value is exposed to
  assistive technology, and how the options are labelled.

### Modified Capabilities

<!-- None. No existing spec covers the language switcher. -->

## Impact

- `apps/web/src/fsd/shared/config/i18n/locales.ts` — on `supportedLocales`,
  replace `flag` and `labelKey` with a `nativeName` literal.
- `apps/web/src/fsd/app/providers/language-switcher.tsx` — render the locale code
  in the trigger and code + native name in each option row; stop hiding the
  trigger value from assistive technology and give it the native name as its
  accessible value.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — remove the
  `language.options.*` block from all four. `language.label` stays: it is the
  switcher's accessible label and the visible label beside it in the mobile
  popover and the account drawer.
- Three mount points are affected but unchanged: `app/layout/desktop-layout.tsx`,
  `app/layout/mobile-header.tsx`, `app/providers/auth-control.tsx` (the last
  gains the roomy full-width presentation).
- The switcher has no test today and is `vi.mock`'d by all three of its
  consumers' tests, so this change adds a `language-switcher.test.tsx` covering
  trigger text, accessible value, and option labels.
- Out of scope: `getSupportedLanguage` truncates a locale code at its first
  hyphen, so a region-qualified locale (`pt-BR`) would fall back to `en`. No
  supported language hits this today; it must be fixed before one is added.
- No API change; no companion change in `tacticus-planner-api`.
