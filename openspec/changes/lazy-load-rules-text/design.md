# Design

## Context

See proposal.md - Why. i18next is initialised in `shared/config/i18n/i18n.ts` with `i18next-http-backend`
(`loadPath: /locales/{{lng}}/{{ns}}.json?v=<appVersion>`), `fallbackLng: en`, `load: "languageOnly"` and
`react.useSuspense: true`; only `common`, `dailies` and `library` are preloaded, every other namespace loads
when a component first asks for it. The rules-text hooks never call `t()`; they read structured entries with
`i18n.getResource(lng, ns, abilityId)` and fall back to `en`. Namespace names are opaque strings to
i18next and to the backend, so a namespace may contain `/` and map to a nested path. All ability ids are
`[A-Za-z0-9_-]+` with no case-only duplicates (checked 2026-10-21 for both namespaces).

The summon-free HRE team (`hre-mission-teams`) is the one consumer that needs every English description; it
runs `abilitySummons()` (three regexes in `pages/dailies/model/hre-summoners.ts`) over the whole roster's
abilities.

## Goals / Non-Goals

**Goals:**

- A unit page's first paint does not wait for any rules text; the text requests are a few 1 KB files.
- Content, entry shape, generator inputs and the committed-file invariants stay as they are.
- Per-panel loading and failure states, with retry, on both desktop and mobile (same panel components).

**Non-Goals:**

- Moving rules text to the catalog or the API (the api store serves ids only).
- Changing cache headers, hashed file names or the `?v=` query (`trim-startup-bundle`).
- Translating trait text or raid-boss text (still English-only).
- Bundling ability files per unit; see decision 1.

## Decisions

1. **One file per ability id, same entry shape, keyed by its id.** `locales/<lng>/npcAbilityText/<id>.json`
   contains `{ "<id>": entry }`, and the namespace name is `npcAbilityText/<id>`. The existing `loadPath`
   resolves it with no backend or config change, `getResource(lng, "npcAbilityText/<id>", id)` keeps the
   one-entry read, and the committed-file test iterates files instead of object keys.
   Alternatives: per-unit files (one request per page, but ability ids are shared by NPC variations and
   characters, so content would be duplicated and the generator would need the unit-to-ability map in
   every locale); a flat entry at the file root (saves one key but changes every reader and the test
   shape). HTTP/2 makes two to four parallel 1 KB requests cheaper than one duplicated bundle.
2. **Hooks take the ids they need and do not suspend.** `useAbilityText(abilityIds)` and
   `useRaidBossText({ abilityIds })` call `useTranslation(namespaces, { useSuspense: false })` and return
   `{ ready, failed, retry, text(id) }`. `ready` comes from react-i18next; `failed` tracks the i18next
   `failedLoading` event for those namespaces, and `retry` calls `i18n.reloadResources(lng, namespaces)`.
   Known gaps never reach the backend: the generator also writes `locales/en/npcAbilityTextGaps.json` and
   `raidBossAbilityTextGaps.json` (sorted id arrays, same shape and loading as the summoners list), the hooks
   drop those ids from the namespaces they request, and `text(id)` returns undefined for them, so the panel
   shows the missing-text note without a 404 ever being counted as a failure.
   Page-level callers (character and MoW pages, which also feed `hasAbilityText` to the tutorial) pass
   the unit's ability ids; panel-level callers (NPC abilities, raid-boss panel) pass their own.
   Alternative: keep Suspense and wrap each panel in `<Suspense>` - rejected because the page-level
   tutorial flag would still suspend the page, and a Suspense boundary cannot express the failed state.
3. **Trait namespaces stay whole.** `npcTraitText` (4 KB gzipped) and `raidBossTraitText` (3 KB) are
   not worth splitting; they only move from page-level to the same non-suspending hook so they load with
   the chips. Reconsider if either grows past about 50 KB raw.
4. **Summoners come from a generated list.** The generator applies the summon regexes to the English
   descriptions it already holds and writes `locales/en/npcAbilitySummoners.json` (sorted id array,
   loaded as one small namespace). `buildSummonerIds` takes an `isSummoning(abilityId)` predicate backed
   by that list; `abilitySummons()` and its regexes stay in TypeScript only to power the parity test
   (committed list == regex over committed descriptions). The three regexes are duplicated in the `.mjs`
   generator because it cannot import the app's TypeScript; the parity test is what keeps them equal.
   Alternative: have the HRE hook load every character's ability files (hundreds of requests) - rejected.
5. **Types.** The two rules-text keys leave the fixed `resources` map in `i18next.d.ts`; a
   template-literal index signature (``[ns: `npcAbilityText/${string}`]: Record<string, unknown>``)
   is tried first; if i18next's type machinery rejects it, the hooks cast the namespace list once at
   the `useTranslation` call and nothing else changes. No `t()` call ever targets these namespaces.
6. **Generators own cleanup.** Each generator empties its output directory before writing so a dropped
   ability's file disappears; the apps test reads the directories with `import.meta.glob(…, { eager: true })`
   (already used by `npc-portrait-assets.test.ts`), so no file-system code in tests.
7. **Copy.** Two new `library` keys per panel kind: a loading line and a failure line; retry reuses the
   existing `library` `retry` key. Translated into de/es/fr in the same task.

## Risks / Trade-offs

- [About 1,900 small static files in `public/locales`] → inert for the build (Vite copies `public/`
  verbatim); the Static Web App deploy handles file counts far larger (2,460 catalog images already).
- [A test or tool imports the old monolithic JSON] → the two files are deleted, so any stale import fails
  at typecheck/test, not at runtime.
- [react-i18next marks a failed namespace as "ready" so the panel would show the missing-text note] →
  decision 2 tracks `failedLoading` explicitly and checks `failed` before `ready`.
- [Tests mocking `react-i18next` by module path] → the page tests already stub `getResource`; they are
  updated in the same task group as each hook, not deferred.
- [Users on a language other than English now trigger two requests per ability (lng + en fallback)] →
  same ratio as today for the whole file; a few KB total.

## Migration Plan

Client-only, one PR. Order: generators and files, then hooks and call sites, then tests and copy.
Rollback = revert the PR (the monolithic files come back with it).
