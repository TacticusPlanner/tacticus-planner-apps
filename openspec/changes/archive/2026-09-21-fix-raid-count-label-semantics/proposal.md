## Why

`schedule.raids` (`dailies.json`) renders as a bare "{{count}} raids" —
tester feedback (`DAILY-08`, `TERM-06`) points out that a number like "6
raids" doesn't say whether it's raids required, remaining, or already
performed. Every call site (`resource-card.tsx` ×3, `today-page.tsx`'s
`TodaysAttemptsList`) always passes an already-performed count
(`raidsPerformed`/`attemptsUsed`), so the fix is retitling the existing
string, not changing what's computed or shown.

## What Changes

- Reword `schedule.raids_one`/`schedule.raids_other` and the embedded
  "raids" text in `schedule.node`'s fallback string, in all four locales
  (en/de/es/fr), to state the count is attempts already used (e.g.
  "{{count}} attempts used") rather than a bare unlabeled count.
- No change to which components render the count, the underlying data
  (`raidsPerformed`/`attemptsUsed`), or any other locale key. Purely a
  copy edit to existing keys — no key renames, since every call site
  already passes the same semantic value and no test asserts on the
  rendered English text (tests mock `t` to return the key, not the
  interpolated string).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — the capabilities that govern this surface (`daily-raids-today`,
`daily-raids-plan`) already specify _that_ a raid count is shown; none pin
its exact wording, so no requirement text changes. This change edits copy
only, hence `skip_specs: true` in `.openspec.yaml`.

## Impact

- `apps/web/public/locales/en/dailies.json`,
  `apps/web/public/locales/de/dailies.json`,
  `apps/web/public/locales/es/dailies.json`,
  `apps/web/public/locales/fr/dailies.json` — `schedule.raids_one`,
  `schedule.raids_other`, `schedule.node`.
- No TSX changes (`resource-card.tsx`, `today-page.tsx` already call
  `t("schedule.raids", { count })`/`t("schedule.node", ...)` unmodified),
  no test changes, no API changes, no cross-repo companion change.
