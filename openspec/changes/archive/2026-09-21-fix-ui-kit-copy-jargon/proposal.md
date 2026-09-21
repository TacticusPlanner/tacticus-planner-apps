## Why

`/ui-kit`'s subtitle and Colors section description name the internal
`shadcn` component library directly ("Focused shadcn component catalog",
"Semantic colors from the active shadcn preset") to an audience with no
reason to know that term. The page is dev-only in intent but reachable on
staging by design (`isUiKitEnabled` only disables it in production), so
testers browsing staging can stumble onto it and read the jargon as if it
were product copy (`DEV-01`).

## What Changes

- Reword `uiKit.subtitle` and `uiKit.sections.colors.description` to
  describe the page/section in plain language, without naming `shadcn`.
- Per `DEV-01`'s own acceptance criteria ("audit the rest of `uiKit.*`
  while in the file"): also reword
  `uiKit.sections.dataDisplay.description`, which names `TanStack` (the
  data-table library) — the same category of internal-tooling jargon the
  issue describes, found during this change's audit rather than the
  original investigation.
- Apply the same rewording to all four locales (en/de/es/fr).
- No change to `/ui-kit`'s route gating (already confirmed correct —
  staging visibility is intentional dev/QA use, not a bug) or to any other
  `uiKit.*` copy — the other seven section descriptions (buttons,
  feedback, forms, layout, overlays, selection) don't name an internal
  library and need no change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — `/ui-kit` is a dev-only component showcase with no OpenSpec
capability covering it (it's tooling, not a product surface). This change
edits copy only, hence `skip_specs: true` in `.openspec.yaml`.

## Impact

- `apps/web/public/locales/en/common.json`,
  `apps/web/public/locales/de/common.json`,
  `apps/web/public/locales/es/common.json`,
  `apps/web/public/locales/fr/common.json` — `uiKit.subtitle`,
  `uiKit.sections.colors.description`,
  `uiKit.sections.dataDisplay.description`.
- No code changes (no component renders `shadcn`/`TanStack` directly outside
  these three strings), no API changes, no cross-repo companion change.
