// Generator for the game-name i18n namespaces, id -> the game's own term, in every locale:
//   public/locales/{en,de,es,fr}/upgrades.json          upgrade material id -> name
//   public/locales/{en,de,es,fr}/abilities.json         ability id          -> name
//   public/locales/{en,de,es,fr}/equipmentItems.json    equipment item id   -> name
//   public/locales/{en,de,es,fr}/characters.json        character id        -> short name
//   public/locales/{en,de,es,fr}/mows.json              MoW id              -> short name
//   public/locales/{en,de,es,fr}/traits.json            trait id            -> name
//   public/locales/{en,de,es,fr}/factions.json          faction id          -> name
//   public/locales/{en,de,es,fr}/npcs.json              NPC variation id    -> name
//   public/locales/{en,de,es,fr}/mythicQuestTasks.json  task loca key       -> template
//   public/locales/{en,de,es,fr}/eventMissions.json     seasonal event mission task templates, chain names,
//                                                        game modes and event names ({ tasks, chains, gameModes,
//                                                        events })
//   public/locales/{en,de,es,fr}/hreTaskHints.json      HRE mission task loca key -> the game's hint
//                                                        (the in-game task details minus the objective)
//   public/locales/{en,de,es,fr}/unitSearchNames.json   character/MoW id    -> other names to search by
//   public/locales/{en,de,es,fr}/progression.json       ranks and rarities (en also keeps its hand-written short forms)
//
// Source: the pinned data-mines commit (datamine/REF, see scripts/datamine.mjs): the game config names
// the ids, the game's language files name them. A term missing in one locale falls back to English.
// datamine/curated-names.json adds the few ids and terms the game lacks or gets wrong; a curated term
// wins in the locales it gives and is the fallback for the rest. Re-run after every
// `pnpm datamine:pull` and commit the four locale directories' files.
//
// The script prints every id that has no term anywhere (the game's or a curated one) and exits non-zero,
// writing nothing, if there is one, so a refresh that adds an unnamed id is noticed.
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
const npcs = config("units/npc.json")

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

/** The seasonal event quest groups (daily, free and premium chains) — the missions of event shops. */
const SEASONAL_QUEST_GROUPS = [
  "seasonal_daily",
  "seasonal_seasonal",
  "seasonal_seasonal_premium",
]
const seasonalQuests = SEASONAL_QUEST_GROUPS.flatMap(
  (group) => config("quests/groups.json")[group]?.quests ?? []
)
const seasonalTasks = seasonalQuests.flatMap((quest) => quest.tasks ?? [])
/** Task name -> its loca key (`TraverseHexes` -> `TraverseHexes_description`). */
const seasonalTaskKeys = new Map(
  seasonalTasks.map((task) => [task.name, task.locaKey])
)
/** Chain name keys of the free and premium chains (`October2026FreeMissionChain`). */
const seasonalChainKeys = [
  ...new Set(
    seasonalQuests
      .filter((quest) => quest.category === "seasonal" && quest.locaKey)
      .map((quest) => quest.locaKey)
  ),
]
/** Game modes the seasonal tasks name (`gameMode` / `gameModes` parameters). */
const seasonalGameModes = [
  ...new Set(
    seasonalTasks.flatMap((task) => {
      const parameters = task.taskParameters ?? {}
      return [parameters.gameMode, ...(parameters.gameModes ?? [])].filter(
        Boolean
      )
    })
  ),
]

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
  // A regular NPC has its own Units/ name; a boss or hero-like NPC (and debris) has none and shows as
  // the unit it looks like (`visualId`), by that unit's displayed name; the config name is the last resort.
  npcs: {
    ids: Object.keys(npcs),
    key: (id) => {
      const visual = npcs[id].visualId
      return [
        `Units/${id}_Name`,
        ...(visual
          ? ["_ExtraShortName", "_ShortName", "_Name"].map(
              (suffix) => `Units/${visual}${suffix}`
            )
          : []),
      ]
    },
    fallback: (id) => npcs[id].name,
  },
  mythicQuestTasks: {
    ids: [...mythicTaskKeys(config("quests/groups.json"))],
    key: (id) => `Quests/${id}`,
  },
  // Folded into the nested `eventMissions` namespace below; never written on their own.
  eventMissionTasks: {
    ids: [...seasonalTaskKeys.keys()],
    key: (id) => `Quests/${seasonalTaskKeys.get(id)}`,
  },
  eventMissionChains: {
    ids: seasonalChainKeys,
    key: (id) => `Quests/${id}`,
  },
  eventMissionGameModes: {
    ids: seasonalGameModes,
    key: (id) => `Quests/Quest_GameMode_${id}`,
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
    // `key` gives one language key, or several tried in order.
    const game = (locale) =>
      [key(id)]
        .flat()
        .map((k) =>
          languages[locale][k]?.replace(/[\u200B-\u200D\uFEFF]/g, "").trim()
        )
        .find(Boolean)
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

// An id with no term fails the run before any file is touched, so the committed files stay complete.
if (unnamed.length > 0) {
  for (const id of unnamed) console.log(`  NO TERM   ${id}`)
  process.exit(1)
}

// ---- event missions ----------------------------------------------------------------------------------

// One nested namespace for the event shop's Missions: `tasks.<taskName>` and `chains.<chainKey>` are the
// game's templates ({[TARGET_AMOUNT]}, {[GAME_MODE]}, {[CHAIN_POSITION]}… and <style> tags kept; the page
// fills and strips them), `gameModes.<mode>` the names {[GAME_MODE]} takes.
// `events.<EventKey>` is the seasonal event's own name (`SeasonalEvents/name_november_2026` -> key
// `November2026`), which names an event shop the calendar has not dated yet (it has no definition).
const SEASONAL_EVENT_NAME = /^SeasonalEvents\/name_([a-z]+)_(\d{4})$/
const seasonalEventNames = (locale) =>
  Object.fromEntries(
    Object.keys(languages.en)
      .map((key) => [key, SEASONAL_EVENT_NAME.exec(key)])
      .filter(([, match]) => match)
      .map(([key, [, month, year]]) => [
        `${month[0].toUpperCase()}${month.slice(1)}${year}`,
        languages[locale][key] || languages.en[key],
      ])
      .sort(([a], [b]) => a.localeCompare(b))
  )
tables.eventMissions = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    {
      tasks: tables.eventMissionTasks[locale],
      chains: tables.eventMissionChains[locale],
      gameModes: tables.eventMissionGameModes[locale],
      events: seasonalEventNames(locale),
    },
  ])
)
delete tables.eventMissionTasks
delete tables.eventMissionChains
delete tables.eventMissionGameModes

// ---- search names ------------------------------------------------------------------------------------

// The game shows a unit by its extra short name ("Nauseous", "Gulgortz"), but players know it by its
// short and full names too ("Nauseous Rotbone", "Boss Gulgortz", "Gulgortz Bulldoza"), the ones V1 showed.
// Unit searches match these as well, the English ones in every locale, so a name read on Discord or in
// V1 finds the unit whatever the language. The displayed term itself is left out: searches match it already.
const SEARCH_NAME_SUFFIXES = ["_ShortName", "_Name"]
const unitSearchNames = Object.fromEntries(
  LOCALES.map((locale) => [locale, {}])
)
for (const namespace of ["characters", "mows"]) {
  for (const id of Object.keys(tables[namespace].en)) {
    for (const locale of LOCALES) {
      const shown = tables[namespace][locale][id]
      const names = [
        ...new Set(
          [locale, "en"].flatMap((source) =>
            SEARCH_NAME_SUFFIXES.map(
              (suffix) =>
                // Some terms carry zero-width spaces, which would keep a duplicate apart.
                languages[source][`Units/${id}${suffix}`]
                  ?.replace(/[\u200B-\u200D\uFEFF]/g, "")
                  .trim() || ""
            )
          )
        ),
      ].filter((name) => name && name !== shown)
      if (names.length > 0) unitSearchNames[locale][id] = names
    }
  }
}
tables.unitSearchNames = unitSearchNames

// ---- progression -------------------------------------------------------------------------------------

// Ranks are the game's UnitDetails/Rank_<index> terms, shortened to the metal and numeral ("Stone Rank I"
// → "Stone I", "Steinrang I" → "Stein I") because the badges and chips are sized for the short form;
// rarities are the game's raw rarity names. Stars are never spelled out: the app shows a star icon and
// the count, and the hand-written English `short` templates ("Legendary 5★") name a progression where
// only text fits (accessible names, sentences); other locales fall back to them.
const SHORT_RANK = {
  en: (term) => term.replace(/ Rank /, " "),
  de: (term) => term.replace(/rang /, " "),
  es: (term) => term.replace(/^Rango de /, ""),
  fr: (term) => term.replace(/^Rang (?:de |d')?/, ""),
}
const RANK_METALS = [
  "Stone",
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Diamond",
  "Adamantine",
]
const RANKS = RANK_METALS.flatMap((metal) =>
  [1, 2, 3].map((n) => `${metal}${n}`)
)
const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"]
const ROMAN = ["I", "II", "III"]
const enProgression = readJson(`${localesDir}/en/progression.json`)

const progressionTerm = (locale, key) => {
  const term = (languages[locale][key] ?? languages.en[key])?.trim()
  if (!term) {
    console.log(`  NO TERM   progression/${key}`)
    process.exit(1)
  }
  return term
}
// A term the shortening does not reduce to "<metal> <numeral>" fails the run, so a reworded rank is noticed.
const shortRank = (locale, index) => {
  const term = progressionTerm(locale, `UnitDetails/Rank_${index}`).replace(
    /\s+/g,
    " "
  )
  const short = SHORT_RANK[locale](term)
  const numeral = ROMAN[index % 3]
  if (short === term || !new RegExp(`^\\S+ ${numeral}$`).test(short)) {
    console.log(`  BAD RANK  ${locale} ${term} -> ${short}`)
    process.exit(1)
  }
  return short.charAt(0).toLocaleUpperCase(locale) + short.slice(1)
}
const progression = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    {
      ...(locale === "en" ? { short: enProgression.short } : {}),
      ranks: Object.fromEntries(
        RANKS.map((rank, index) => [rank, shortRank(locale, index)])
      ),
      rarities: Object.fromEntries(
        RARITIES.map((rarity) => [
          rarity,
          progressionTerm(locale, `Upgrades/RarityName_Raw_${rarity}`),
        ])
      ),
    },
  ])
)
tables.progression = progression

// ---- HRE task hints ----------------------------------------------------------------------------------

// The in-game details of each HRE mission task (`MissionQuickLinks/TaskDetails_<locaKey>`), keyed by loca
// key, with only the hint: the first paragraph restates the objective the tracker already shows, so it
// is dropped (Severyn, 2026-11). A text in one paragraph drops its first line, or else its first
// sentence. Every variant of a task name the HRE chains use is kept (`DealDamageOfProfileType_Psychic_
// description`), since the client falls back from the served key to keys guessed from the task name.
// `{[TARGET_AMOUNT]}`-style placeholders and `<style>` markup are kept for the page; `<i>` is dropped.
// A text with no hint left is left out, so its objective shows no game hint.
const TASK_DETAILS = "MissionQuickLinks/TaskDetails_"
const hreTaskNames = new Set(
  Object.entries(config("quests/groups.json"))
    .filter(([group]) => /^hre\d+$/.test(group))
    .flatMap(([, group]) => group.quests ?? [])
    .flatMap((quest) => quest.tasks ?? [])
    .map((task) => task.name)
)
const hreHintKeys = Object.keys(languages.en)
  .filter((key) => key.startsWith(TASK_DETAILS))
  .map((key) => key.slice(TASK_DETAILS.length))
  .filter((id) => [...hreTaskNames].some((name) => id.startsWith(`${name}_`)))
  .sort()

/** The hint part of a task details text, or undefined when it only restates the objective. */
function hintOf(text) {
  const clean = text.replace(/[\u200B-\u200D\uFEFF\r]/g, "").trim()
  const paragraphs = clean.split(/\n[ \t]*\n/)
  const lines = clean.split("\n")
  const rest =
    paragraphs.length > 1
      ? paragraphs.slice(1).join("\n\n")
      : lines.length > 1
        ? lines.slice(1).join("\n")
        : /^.*?[.!?]\s+(.+)$/s.exec(clean)?.[1]
  const hint = rest?.replaceAll(/<\/?i>/g, "").trim()
  return hint || undefined
}

tables.hreTaskHints = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    Object.fromEntries(
      hreHintKeys
        .map((id) => {
          const text = languages[locale][`${TASK_DETAILS}${id}`]
          const hint =
            (text && hintOf(text)) ??
            hintOf(languages.en[`${TASK_DETAILS}${id}`])
          return [id, hint]
        })
        .filter(([, hint]) => hint)
    ),
  ])
)

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
