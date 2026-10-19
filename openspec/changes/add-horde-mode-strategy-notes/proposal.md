## Why

A tier and a multiplier say how good a character is in horde-style modes but not how to play them. Severyn's tier list revision (2026-10-18) adds per-character strategy: strengths, how to use, recommended teammates and relic advice. Showing it in the Tier List's tile details turns the list into a usable guide.

## What Changes

- New locale namespace `hordeStrategy` (en, de, es, fr), keyed by `unitId`: `strengths`, `howToUse` and, for characters with relic ratings, `relicAdvice`. The English text comes from `source-notes.md` (Severyn's notes), split into the two fields.
- Parse `synergies` (catalog character ids, from companion API change **`add-horde-mode-strategy-notes`**, which applies first).
- Tier List tile details gain a collapsible **Strategy** section: Strengths, How to use, Recommended teammates (portraits and names, each linking to its Library page) and, under each relic row from `add-horde-mode-relic-ratings`, its advice. A character with no strategy keys shows no section.
- Summoner notes mention that Survival summons keep the rarity they were created at, so timing matters (Bellator, Re'vas, Tan Gi'da, Sho'syl, Snotflogga, Archimatos, Abraxas, Anuphet, Xybia).
- New UI strings in `legendaryEvents`: `tierList.strategy.title`, `.strengths`, `.howToUse`, `.teammates`, `.relicAdvice`.

Depends on **`revise-horde-mode-tier-list`** and **`add-horde-mode-relic-ratings`** (apply first).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `legendary-event-tier-list`: strategy section in tile details.

## Impact

- `packages/game-catalog` schema, Tier List details UI, new `hordeStrategy.json` in four locales, i18n registration, fixtures and tests.
