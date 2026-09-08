## Why

The Dailies → Arena tab (`/dailies/arena`) is still an "Under Construction"
placeholder, but players run their daily Arena battles regardless. Those
battles are a free source of shared XP and progress that currently aligns with
the player's plan only by luck. This change recommends Arena team compositions
built from the player's active goals, active project, and roster so that daily
Arena play also advances what the player is already working toward — or, on
demand, simply fields their strongest team.

Tracked by [issue #76](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/76).

## What Changes

- Replace the Arena "Under Construction" placeholder with a real **Dailies →
  Arena** page at `/dailies/arena`, with distinct desktop and mobile layouts
  and a Joyride onboarding tour.
- Add a **client-side team-recommendation engine** that produces recommended
  Arena teams in these categories:
  - **Active Project Team** — optimized for the player's active project.
  - **Overall Goals Team** — optimized across all the player's active goals.
  - **Random Team** — drawn from the full owned roster, with a **Regenerate**
    control that produces a different composition.
  - **Home Screen Event (HSE) Team** is **deferred** to
    [issue #111](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/111) —
    V2 has no home-screen-event model yet. The engine is structured so this
    slots in later as one more candidate pool + category with no architectural
    change (issue #76 "Future Considerations").
- Support two **team-generation modes**:
  - **XP Mode (default)** — prefer characters that can still earn XP (current
    level below the cap for their current progression tier — an un-ascended
    Epic stops at 35, Legendary at 50, etc.) and that contribute to the active
    project / active goals; avoid XP-capped characters unless too few
    alternatives exist. Present **3-, 4-, and 5-character** variants of each
    category's team, ranking the **3-character** team highest because a
    battle's shared XP is split among fewer characters.
  - **Power Mode** — ignore XP entirely and recommend the single strongest
    team by each character's overall combat strength.
- **Candidate-pool expansion**: build each category's team starting from its
  highest-priority candidate pool and progressively widen —
  Active Project → Overall Goals → Full Roster — until at least **three**
  eligible characters are available, then generate the final team per the
  selected mode. Every recommended team contains **at least three characters**.
- Introduce a shared **character combat power** capability: port V1's
  `CharactersPowerService` metric (attribute power from rank / progression
  stars / applied-upgrade count, plus ability power from ability levels and
  rarity) into a shared FSD slice consumed through its public API. Power Mode
  and the tie-breaking within XP Mode both use it.
- **Machines of War (MoWs) are out of scope** — recommended teams are
  characters only.
- Keep the engine extensible for the additional optimization criteria named in
  issue #76 (character traits, faction composition) by scoring candidates
  through a replaceable scorer rather than a hard-coded rule. The player-facing
  controls for a preferred trait / alliance / damage type are **deferred** to
  [issue #112](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/112);
  this change only leaves the scorer seam for them.
- Add a new `arena` i18n namespace (all supported locales) for page copy and
  tour steps.

No `tacticus-planner-api` companion change — this is **client-only**, built
entirely from data the app already syncs.

## Capabilities

### New Capabilities

- `dailies-arena-recommendations`: the Dailies → Arena page and its
  recommendation engine — team categories, XP/Power modes, candidate-pool
  expansion and the three-character minimum, the 3/4/5-character XP variants,
  the Random team and its Regenerate control, mode-selection persistence, the
  loading / load-failure / no-roster / no-eligible-characters states, and the
  desktop vs. mobile presentation.
- `character-combat-power`: a shared, roster-agnostic estimate of a single
  character's overall combat strength, ported from V1's `CharactersPowerService`
  (attribute power + ability power), exposed for reuse by any feature that
  needs to rank owned characters by strength.

### Modified Capabilities

- `dailies-navigation`: the Arena primary tab renders the Arena
  recommendations page rather than the shared "Under Construction"
  placeholder; the "Placeholder tabs show Under Construction" requirement no
  longer covers Arena.

## Impact

- **`apps/web/src/fsd/pages/dailies`** — new Arena page: `ui/` (desktop +
  mobile team-category views, mode toggle, Regenerate control, state views),
  `model/` (engine hook + pure candidate-pool / team-selection / scoring
  functions with unit tests), co-located `arena-page.tutorial.tsx`.
  `route.tsx` drops `"arena"` from the placeholder-path list and lazy-loads
  the new page. `nav-items.ts` already carries the `/dailies/arena` entry and
  its `dailies:tabs.arena` label.
- **New shared slice for character combat power** (FSD entity for owned
  characters; exact slice chosen in `design.md`), with pure coefficient math
  possibly landing in `@workspace/game-domain`. Ported 1:1 from
  `tacticusplanner`'s `src/fsd/4-entities/unit/characters-power.service.ts`
  with tests pinning parity.
- **Data sources (all already synced; read-only):** `@/entities/goal`
  (`listGoals`, goal details, `status: "Active"`), `@/entities/project`
  (`useProjects` active/default project, project goal membership),
  `@workspace/player-data` roster queries (`getPlayerCharacters`, per-unit
  `xpLevel` / `rank` / `progressionIndex` / `abilities` /
  `appliedUpgradeSlots`), `@workspace/game-catalog` character catalog
  (`rarity`, `traits`, `faction`). No new network calls, no schema changes.
- **`openspec/specs/dailies-navigation/spec.md`** — the placeholder
  requirement is narrowed to exclude Arena.
- **i18n** — new `arena` namespace added to every supported locale
  (`en`, `de`, `es`, `fr`); `de`/`es`/`fr` may ship English placeholders.
  New `tour.arena.steps.*` keys.
- **Companion API change:** none.
- **Depends on:** nothing. **Follow-ups:**
  [#111](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/111)
  (HSE Team category);
  [#112](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/112)
  (preferred trait / alliance / damage-type controls);
  [#113](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/113)
  (real de/es/fr translations for the `arena` namespace).
