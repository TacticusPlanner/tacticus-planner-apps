## Context

Tile details already show tier, multipliers and owned state, in a popover on desktop and a bottom sheet on mobile. Game-data text lives in dedicated locale namespaces keyed by id (`characters`, `equipmentItems`, …).

## Decisions

- **Text in a dedicated `hordeStrategy` namespace keyed by `unitId`.** It is curated content, not game data or UI copy, and keeping it apart lets it be revised without touching `legendaryEvents`. Missing keys hide their block; a character with none hides the section.
- **Translations ship with the change.** de, es and fr are translated from the English at implementation, so the key-parity test passes; Severyn reviews the English.
- **Collapsed by default.** The Strategy section is a disclosure so the details stay compact; its open state is not persisted.
- **Same content on both forms.** The section sits inside the details content, so desktop (popover) and mobile (bottom sheet) show the same blocks in the same order; on mobile the bottom sheet scrolls.
- **Relic advice is its own block**, last in the section, because relic rows (`add-horde-mode-relic-ratings`) are not built yet; the relic is named in the text.
- **Text is read with `i18n.getResource`**, like the other id-keyed content namespaces, falling back to English field by field. The page loads the namespace with `legendaryEvents` so opening a tile never suspends.
- **Long text scrolls inside the section** (max height), so the desktop popover stays on screen.
- **Teammates link out.** Each teammate links to `/library/characters/{unitId}`, matching the existing Open in Library link.

## Risks / Trade-offs

- The notes are first-draft, AI-assisted text and may contain mistakes. Mitigation: Severyn reviews the split English in the PR before merge.
