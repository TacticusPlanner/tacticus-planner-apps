## Why

V2's Characters Library is a rank-up materials calculator with a small profile card. It has none of
the unit details V1 showed (trait descriptions, ability rules text by level, growth charts, the stat
comparison radar, the relic), so players piece ability wording together from other sites, and a beta
tester could not find a way into a character's information page. This change is change 1 of Collection
Stage 4 (umbrella #18, issue #203), built to the design handoff
`tacticus-planner-docs/ux/wireframes/library-unit-details-handoff.md` (sections 0–7, 10–12), which is
the source of truth for layout and visual detail.

Stage 4 is split into three changes:

| #   | Change                              | Scope                                                                                                                 |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | `add-character-unit-details` (this) | Characters list page and character unit page (Details and Rank-up materials tabs), desktop and mobile                 |
| 2   | `add-mow-library-details`           | Machines of War list and unit page (LIB-04), reusing this change's components                                         |
| 3   | `link-collection-to-library`        | Collection tiles open unit pages (after Collection PR #200 merges); real round portrait replaces this change's filler |

## What Changes

- **BREAKING** `/library/characters` no longer redirects to the first character. It becomes a
  **characters list** page: a tile grid of every character with name search; each tile opens that
  character's unit page.
- `/library/characters/:id` becomes a **unit page** with a unit navigation bar (back, breadcrumb,
  prev/next, tour), a header (portrait, name, faction, the player's unit line, a "Show values at"
  control: Your unit / Custom, or Starting when the player has no synced copy), and two tabs selected
  by `?tab=`: **Details** (default) and **Rank-up materials**.
- **Details tab**: At a glance (stats with percentiles, attacks, equipment slots; keeps LIB-01's quick
  summary), Traits with descriptions, Active and Passive ability panels (level stepper 1–60, rules
  text at that level, next-level preview, growth chart), Compared with other characters (V1's
  six-axis stat radar and percentile list), Stats by rank (three charts; a table on mobile), and a
  Relic panel for characters that have one. Text missing from V2's game data shows an explicit
  missing-text state, never half-resolved text. A Mythic quests card lists the character's up to
  five quests (task and rewards), ported from V1's static quest data as English game text.
- **Rank-up materials tab**: today's calculator, moved complete (rank and progression ranges, ".5",
  Include owned materials, Apply, Share, range in the URL). The character picker is removed; the unit
  comes from the URL. "Show values at" does not affect this tab.
- Mobile (<768px) uses accordions for the Details sections and a sticky two-tab bar.
- New page tours for the list and the unit page; the old Character Lookup tour is replaced.
- Porting from V1: per-damage-type pierce ratios, the stat-radar percentile model, and the mythic
  quest data (new English game-text namespaces `mythicQuests` and `mythicQuestTasks`).

Out of scope: Machines of War (change 2), Collection click-through and the real round portrait
(change 3), relic and MoW text porting (data issues), serving mythic quests from the API, links from goals and daily
raids, a characters comparison table, filters beyond name search.

## Capabilities

### New Capabilities

- `character-unit-details`: the characters list page and the character unit page — navigation, header
  and value states, Details tab sections (stats, traits, abilities, charts, radar, relic), missing-text
  behaviour, the Rank-up materials tab as hosted on the unit page, tabs and their URL state, desktop
  and mobile forms, and tours.

### Modified Capabilities

- `library-entity-routes`: the Characters collection URL without an entity id shows the characters
  list instead of redirecting to the first character; Characters entity selection no longer comes from
  an in-page picker.

## Impact

- **Apps only.** No API change and no companion `tacticus-planner-api` change: the page reads the
  existing catalog (`characters`, `equipment`, traits and abilities game-text namespaces) and player
  data (`characters`, inventory).
- `apps/web/src/fsd/pages/library/` — `route.tsx`, the `ui/character/` slice (calculator moved into a
  tab, picker removed), new list and unit page UI; tours `character-lookup.tutorial.tsx` replaced.
- `apps/web/src/fsd/entities/npc/lib/use-npc-ability-text.ts` — the ability/trait text hooks move to
  a shared slice so character and NPC pages both use them.
- New shared UI: level chart, stat radar, ability panel (plain SVG; no new chart dependency).
- `packages/game-domain` — pierce ratios; starting progression for a rarity.
- `packages/ui/src/styles/globals.css` — tokens `--chart-grid`, `--hl`.
- i18n en/de/es/fr — new `library` and `tour` copy.
- Existing Character Lookup tests that drive the picker are replaced.
