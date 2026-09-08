## Why

The Arena recommendation engine (roster pools, XP/Power ordering, minimum-size
widening, weighted random draw, locks) is about to be needed almost verbatim by
Salvage Run (#77) and Onslaught (#78) — each is Arena plus a hard alliance
restriction, and Onslaught adds a priority pool and a shard-recipient panel.
Shipping those as independent pages would fork the engine three ways and force
every later change (#111 HSE category, #112 preference controls) to land three
times. This change extracts the engine and its shared UI into reusable modules
with Arena as the first consumer, and — because the same edit touches the
candidate-selection step — folds in the trait and damage-type preference
controls from #112.

## What Changes

- Extract the Arena engine into a game-mode-agnostic
  `pages/dailies/model/team-recommendations.ts` driven by a config: a
  mode-eligible roster, an ordered list of priority pools, a requested size, a
  lock set, a random seed, and (new) a set of soft preferences. Arena becomes a
  thin config over it. No user-visible change to the Arena page beyond the new
  controls below.
- Extract the shared team UI (team list, mode toggle, team size, category
  section, loading/error/empty states) into `pages/dailies/ui/team-recs/`. The
  Arena page, its desktop/mobile shells, and its tour keep composing them.
- **#112**: add two page-level controls to the Arena page — **Preferred trait**
  and **Preferred damage type** — each with an "Any" default. A set preference
  narrows the candidate-eligibility predicate that the existing pool-widening
  logic already consumes, so too few matches widens the pool (raising the
  existing "broadened" note) and a preference can never make a category fail to
  produce a team. The alliance dimension of #112 is intentionally dropped:
  alliance becomes the hard track restriction on Salvage Run / Onslaught, so a
  soft alliance preference on Arena would be redundant and confusing.
  Team-level faction composition is deferred to a new follow-up issue.
- Preferences persist per browser (JSON under `tp.dailies.arena.preferences`),
  the same way the XP/Power mode and Team size already do.
- Split the `arena` i18n namespace: shared control/state/rationale copy moves to
  a new `teamRecs` namespace; `arena` keeps the page title, category copy, and
  its tour.
- Move the character damage-type union helper out of `pages/library`'s
  `use-character-lookup-calc` into `shared/lib` so both `pages/library` and
  `pages/dailies` can use it without a pages→pages import.
- No companion `tacticus-planner-api` change — this is entirely a frontend
  refactor plus client-side preference state.

## Capabilities

### New Capabilities

- `dailies-team-recommendations`: the game-mode-agnostic team recommendation
  engine shared by the Dailies team pages — its configuration inputs
  (mode-eligible roster, ordered priority pools, requested size, preference
  filters, lock set, random seed), the Plan-team ordering and pool-widening
  rules, the Random-team draw and Regenerate behaviour, and the shared team
  presentation. Arena, and later Salvage Run and Onslaught, are consumers that
  supply a config.

### Modified Capabilities

- `dailies-arena-recommendations`: the requirements are re-expressed so the
  ordering / widening / random-draw / lock / presentation rules are delegated to
  the shared `dailies-team-recommendations` engine rather than restated, and two
  new requirements add the preferred-trait and preferred-damage-type controls
  (soft filters that feed pool widening, persisted per browser, applied to every
  category). No change to the Plan/Random category set, the project selector,
  the mode toggle, or the Team size control.

## Impact

- **Code (new)**: `apps/web/src/fsd/pages/dailies/model/team-recommendations.ts`
  - `.types.ts`; `apps/web/src/fsd/pages/dailies/ui/team-recs/*`;
    `apps/web/src/fsd/shared/lib/character-damage-types.ts`.
- **Code (moved/shrunk)**: `arena-recommendations.ts` / `.types.ts` become an
  Arena config; `arena-eligibility.ts` generalizes `expandCandidatePool` to an
  ordered pool list; `arena-*.tsx` UI files move under `ui/team-recs/` and lose
  the `arena-` prefix; `use-arena-recommendations.ts` gains a catalog live query
  and preference persistence; `use-character-lookup-calc.ts` imports the moved
  helper.
- **i18n**: new `apps/web/public/locales/{en,de,es,fr}/teamRecs.json`; `arena`
  namespace trimmed; `teamRecs` registered in
  `shared/config/i18n/i18next.d.ts`. de/es/fr are English copies pending #113.
- **Tests**: `arena-recommendations.test.ts` splits into a config-driven
  `team-recommendations.test.ts` plus a slim Arena file; `arena-translations`
  becomes a parameterized `team-translations.test.ts`; Arena page and tutorial
  tests gain the two controls. All other Arena tests should pass with
  import-path edits only — that is the extraction's regression guard.
- **No API, dependency, or schema changes.** Catalog data read
  (`characterView.traits`, `.meleeDamage`, `.rangedDamage`) is already synced.
