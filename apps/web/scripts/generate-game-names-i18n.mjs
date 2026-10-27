// Generator for the game-name i18n namespaces, id -> the game's own term, in every locale:
//   public/locales/{en,de,es,fr}/upgrades.json          upgrade material id -> name
//   public/locales/{en,de,es,fr}/abilities.json         ability id          -> name
//   public/locales/{en,de,es,fr}/equipmentItems.json    equipment item id   -> name
//   public/locales/{en,de,es,fr}/characters.json        character id        -> short name
//   public/locales/{en,de,es,fr}/mows.json              MoW id              -> short name
//   public/locales/{en,de,es,fr}/traits.json            trait id            -> name
//   public/locales/{en,de,es,fr}/factions.json          faction id          -> name
//   public/locales/{en,de,es,fr}/mythicQuestTasks.json  task loca key       -> template
//
// Source: the pinned data-mines commit (datamine/REF, see scripts/datamine.mjs): the game config names
// the ids, the game's language files name them. A term missing in one locale falls back to English.
// datamine/curated-names.json adds the few ids and terms the game lacks or gets wrong; a curated term
// wins in the locales it gives and is the fallback for the rest. Re-run after every
// `pnpm datamine:pull` and commit the four locale directories' files.
//
// The script prints every id that has no term anywhere (the game's or a curated one) and exits non-zero
// if there is one, so a refresh that adds an unnamed id is noticed.
import { readFileSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { format, resolveConfig } from "prettier"

import { ensureDatamine } from "./datamine.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const datamine = ensureDatamine()
const localesDir = resolve(here, "../public/locales")

const LOCALES = ["en", "de", "es", "fr"]

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))
const config = (path) => readJson(`${datamine}/raw/gameconfig/${path}`)
const languages = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    readJson(`${datamine}/raw/languages/${locale}.json`),
  ])
)
const curated = readJson(resolve(here, "../datamine/curated-names.json"))

// ---- ids and their language keys ---------------------------------------------------------------------

const lineup = Object.entries(config("units/lineup.json"))
const isMow = ([, unit]) => unit.traits?.includes("MachineOfWar")
const items = config("items.json")

/** The `mythic_*` quests' task loca keys, wherever they sit in the quest groups. */
function mythicTaskKeys(node, keys = new Set()) {
  if (Array.isArray(node)) {
    for (const child of node) mythicTaskKeys(child, keys)
  } else if (node && typeof node === "object") {
    if (String(node.name ?? "").startsWith("mythic_")) {
      for (const task of node.tasks ?? []) keys.add(task.locaKey)
    }
    for (const child of Object.values(node)) mythicTaskKeys(child, keys)
  }
  return keys
}

/** Ids named by `<prefix><id><suffix>` English keys. */
const idsOfKeys = (prefix, suffix) =>
  Object.keys(languages.en)
    .filter((key) => key.startsWith(prefix) && key.endsWith(suffix))
    .map((key) => key.slice(prefix.length, key.length - suffix.length))

const NAMESPACES = {
  upgrades: {
    ids: Object.keys(config("upgrades.json")),
    key: (id) => `Upgrades/${id}_name`,
  },
  // Only abilities the game names: the rest are internal (environment effects, enhancements…).
  abilities: {
    ids: Object.keys(config("units/abilities.json")).filter(
      (id) => `Abilities/${id}_Name` in languages.en
    ),
    key: (id) => `Abilities/${id}_Name`,
  },
  // A handful of items have no term; the game's own config name is all there is.
  equipmentItems: {
    ids: Object.keys(items),
    key: (id) => `Items/${id}_name`,
    fallback: (id) => items[id].name,
  },
  characters: {
    ids: lineup.filter((entry) => !isMow(entry)).map(([id]) => id),
    key: (id) => `Units/${id}_ExtraShortName`,
  },
  mows: {
    ids: lineup.filter(isMow).map(([id]) => id),
    key: (id) => `Units/${id}_ExtraShortName`,
  },
  traits: {
    ids: idsOfKeys("Traits/", "_Name"),
    key: (id) => `Traits/${id}_Name`,
  },
  factions: {
    ids: Object.keys(config("units/factions.json")),
    key: (id) => `UnitDetails/Faction_${id}`,
  },
  mythicQuestTasks: {
    ids: [...mythicTaskKeys(config("quests/groups.json"))],
    key: (id) => `Quests/${id}`,
  },
}

// ---- resolve -----------------------------------------------------------------------------------------

const unnamed = []
const tables = {}

for (const [namespace, { ids, key, fallback }] of Object.entries(NAMESPACES)) {
  const overrides = curated[namespace] ?? {}
  const values = overrides.values ?? {}
  const allIds = [
    ...new Set([
      ...ids,
      ...Object.keys(overrides.extraIds ?? {}),
      ...Object.keys(values),
    ]),
  ].sort()
  tables[namespace] = Object.fromEntries(LOCALES.map((locale) => [locale, {}]))
  for (const id of allIds) {
    const game = (locale) => languages[locale][key(id)]?.trim() || undefined
    for (const locale of LOCALES) {
      const term =
        values[id]?.[locale] ??
        game(locale) ??
        values[id]?.en ??
        game("en") ??
        fallback?.(id)
      if (term === undefined) {
        if (locale === "en") unnamed.push(`${namespace}/${id}`)
        continue
      }
      tables[namespace][locale][id] = term
    }
  }
}

// ---- write -------------------------------------------------------------------------------------------

const prettierOptions = await resolveConfig(`${localesDir}/en/common.json`)
// Indented input so Prettier keeps objects expanded, matching what the pre-commit hook produces.
const writeJson = async (path, value) =>
  writeFileSync(
    path,
    await format(JSON.stringify(value, null, 2), {
      ...prettierOptions,
      filepath: path,
    })
  )

for (const [namespace, byLocale] of Object.entries(tables)) {
  for (const locale of LOCALES) {
    await writeJson(
      `${localesDir}/${locale}/${namespace}.json`,
      byLocale[locale]
    )
  }
  console.log(`${namespace}: ${Object.keys(byLocale.en).length}`)
}
for (const id of unnamed) console.log(`  NO TERM   ${id}`)
if (unnamed.length > 0) process.exitCode = 1
