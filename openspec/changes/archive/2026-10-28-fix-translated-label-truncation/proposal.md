## Why

Longer localized labels are cut off with an ellipsis in several places (UserJot "Fix Text Truncation on Longer/Translated Labels"): campaign and node names in the Today schedule and the Home raids widget, the project selector, and Dailies navigation labels. German and French labels are routinely longer than English, so the clipped text is the normal case for those locales, not an edge case.

## What Changes

- Reproduce each reported surface in de and fr at desktop and mobile widths and record which labels clip.
- Let campaign/node labels wrap onto a second line instead of truncating, in the Today schedule rows and the shared location row used by the Home raids widget.
- Size the project selector trigger to its longest localized option (or let it grow) instead of a fixed width, so the selected label is never clipped.
- Let Dailies navigation labels show in full (wrap or give the tab row the width it needs) on desktop and mobile.
- Keep single-line truncation only where a row's height is fixed by design and a title attribute or tooltip exposes the full text.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-raids-today`: schedule location labels are shown in full in every supported locale.
- `dailies-navigation`: tab labels and the project selector are shown in full in every supported locale.

## Impact

`pages/dailies/ui/today-page.tsx`, `features/daily-raids/ui/location-row.tsx`, `entities/project/ui/project-select.tsx`, the section tabs / desktop section menu, and their tests. No API or data change.
