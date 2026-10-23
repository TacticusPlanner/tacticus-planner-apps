// Generator for the ability rules-text game data, one file (and i18next namespace) per ability id:
//   public/locales/{en,de,es,fr}/npcAbilityText/<abilityId>.json
//     { <abilityId>: { description, variables, constants, scaled } }
//   public/locales/en/npcAbilitySummoners.json  sorted ids whose English text summons a unit
//   public/locales/en/npcAbilityTextGaps.json   sorted referenced ids with no rules text (never fetched)
//
// Covers every ability id the game catalog references: NPC active/passive abilities (all npc records),
// character active/passive abilities, relic abilities (`abilityId` of relic equipment) and each MoW's
// primary, secondary and mythic ability. Source: the catalog's raw data in the sibling
// `tacticus-planner-api` checkout and V1's ability table plus localized descriptions in the sibling
// `tacticusplanner` checkout (develop). Re-run after every game-catalog refresh (see the api repo's
// `game-catalog-data` skill) and commit the four locale directories and the two lists. Each locale
// directory is emptied first, so a dropped ability's file disappears.
//
// An entry is written only when the English description resolves completely: every `{[token]}` is one of
// the ability's variables or constants (keys compared trimmed — V1 has trailing-space keys), a
// `DamageProfileType…` token backed by a `damageProfile…` constant, `UnitName`, or an `S/…` reference (the
// renderer drops those). Tables are pruned to what the description references (plus every
// `damageProfile*` constant); de/es/fr use V1's localized description with the same tables.
//
// The script prints every referenced id it could not cover and exits non-zero when that set differs from
// KNOWN_GAPS, or when a relic ability icon is missing (exact filename case), so a refresh notices both.
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { format, resolveConfig } from "prettier"

const here = dirname(fileURLToPath(import.meta.url))
const workspace = resolve(here, "../../../..")
const catalogData = `${workspace}/tacticus-planner-api/src/TacticusPlanner.GameCatalog/Data`
const v1 = `${workspace}/tacticusplanner/src/fsd`
const localesDir = resolve(here, "../public/locales")
const abilityIconDir = resolve(here, "../public/game_catalog/abilities")

const LOCALES = ["en", "de", "es", "fr"]

// Referenced ids with no complete V1 rules text, checked against what this run finds uncovered. Update it
// deliberately when a refresh adds or fixes one.
const KNOWN_GAPS = new Set([
  // NPC-only: V1's "Coming soon!" placeholder.
  "BossEndFightUndefeated",
  "RepairEnthusiast",
  "RunsAround",
  "RunsAway",
])

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))
const readDir = (dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => readJson(`${dir}/${file}`))

// ---- referenced ability ids --------------------------------------------------------------------------

const referenced = new Set()
const relicAbilityIds = new Set()
const add = (id) => {
  if (id) referenced.add(id)
}

for (const faction of readDir(`${catalogData}/units`)) {
  for (const character of faction.characters ?? []) {
    for (const id of character.activeAbilityNames ?? []) add(id)
    for (const id of character.passiveAbilityNames ?? []) add(id)
  }
  for (const mow of faction.mows ?? []) {
    add(mow.primaryAbility?.name)
    add(mow.secondaryAbility?.name)
    add(mow.mythicAbility?.name)
  }
}
for (const faction of readDir(`${catalogData}/npcs`)) {
  for (const npc of faction.npcs ?? []) {
    for (const id of npc.activeAbilities ?? []) add(id)
    for (const id of npc.passiveAbilities ?? []) add(id)
  }
}
for (const items of readDir(`${catalogData}/equipment`)) {
  for (const item of items) {
    if (!item.isRelic || !item.abilityId) continue
    add(item.abilityId)
    relicAbilityIds.add(item.abilityId)
  }
}

// ---- V1 sources ------------------------------------------------------------------------------------

const abilityById = new Map(
  readJson(`${v1}/4-entities/abilities/data/new-ability-data.json`).map(
    (ability) => [ability.id, ability]
  )
)
const localizedDescriptions = Object.fromEntries(
  LOCALES.filter((locale) => locale !== "en").map((locale) => [
    locale,
    readJson(`${v1}/5-shared/l10n/data/${locale}/ability_descriptions.json`),
  ])
)

// ---- entry rule --------------------------------------------------------------------------------------

const PLACEHOLDER_DESCRIPTIONS = new Set(["", "Coming soon!"])
const TOKEN_RE = /\{\[(.+?)\]\}/g
const DAMAGE_PROFILE_TYPE_RE = /^DamageProfileType(?:Style)?(_\d+)?$/

/** Token names in a description, without a split index (`dmg[0]` -> `dmg`). */
const tokensOf = (description) =>
  new Set(
    [...description.matchAll(TOKEN_RE)].map((match) =>
      match[1].replace(/\[\d+\]$/, "").trim()
    )
  )

const hasKey = (record, name) =>
  Object.keys(record ?? {}).some((key) => key.trim() === name)

/** The tokens the renderer could not resolve from the ability's own tables. */
function unresolvedTokens(ability, tokens) {
  return [...tokens].filter((token) => {
    if (token.startsWith("S/") || token === "UnitName") return false
    const profile = DAMAGE_PROFILE_TYPE_RE.exec(token)
    if (profile)
      return !hasKey(ability.constants, `damageProfile${profile[1] ?? ""}`)
    return (
      !hasKey(ability.variables, token) && !hasKey(ability.constants, token)
    )
  })
}

const pick = (record, keep) =>
  Object.fromEntries(
    Object.entries(record ?? {}).filter(([key]) => keep(key.trim()))
  )

const text = Object.fromEntries(LOCALES.map((locale) => [locale, {}]))
const uncovered = new Map()

for (const id of [...referenced].sort()) {
  const ability = abilityById.get(id)
  const english = ability?.text?.currentLevelDescription ?? ""
  if (!ability) {
    uncovered.set(id, "no V1 ability entry")
    continue
  }
  if (PLACEHOLDER_DESCRIPTIONS.has(english.trim())) {
    uncovered.set(id, "placeholder description")
    continue
  }
  const tokens = tokensOf(english)
  const unresolved = unresolvedTokens(ability, tokens)
  if (unresolved.length > 0) {
    uncovered.set(id, `unresolved ${unresolved.join(", ")}`)
    continue
  }

  const variables = pick(ability.variables, (key) => tokens.has(key))
  const constants = pick(
    ability.constants,
    (key) => tokens.has(key) || key.startsWith("damageProfile")
  )
  const scaled = (ability.variablesAffectedByRarityBonus ?? []).filter((name) =>
    hasKey(variables, name.trim())
  )
  for (const locale of LOCALES) {
    const description =
      locale === "en" ? english : (localizedDescriptions[locale][id] ?? english)
    text[locale][id] = {
      description: description.trim(),
      variables,
      constants,
      scaled,
    }
  }
}

// ---- summoners ---------------------------------------------------------------------------------------

// Kept equal to `SUMMON_PATTERNS` in the app's `features/team-recommendations/model/hre-summoners.ts`
// (this script cannot import TypeScript); the apps parity test checks the committed list against them.
const SUMMON_SPAN = String.raw`<style="Summon">(?:<style=[^>]*>)?[^<]*(?:</style>)?</style>`
const SUMMON_PATTERNS = [
  /\bsummons?\b[^.]{0,60}?<style="Summon">/i,
  new RegExp(`${SUMMON_SPAN}\\s+(?:is summoned|appears)`, "i"),
  /\bcalls in an? <style="Summon">/i,
]
const summoners = Object.keys(text.en)
  .filter((id) =>
    SUMMON_PATTERNS.some((pattern) => pattern.test(text.en[id].description))
  )
  .sort()

// ---- write -------------------------------------------------------------------------------------------

// Every id becomes a file name: keep them portable and collision-free on case-insensitive file systems.
const SAFE_ID_RE = /^[A-Za-z0-9_-]+$/
const lowerIds = new Map()
for (const id of Object.keys(text.en)) {
  if (!SAFE_ID_RE.test(id))
    throw new Error(`ability id is not a safe file name: ${id}`)
  const other = lowerIds.get(id.toLowerCase())
  if (other) throw new Error(`ability ids differ only by case: ${other}, ${id}`)
  lowerIds.set(id.toLowerCase(), id)
}

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

for (const locale of LOCALES) {
  rmSync(`${localesDir}/${locale}/npcAbilityText.json`, { force: true })
  const dir = `${localesDir}/${locale}/npcAbilityText`
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir)
  for (const id of Object.keys(text[locale]).sort()) {
    await writeJson(`${dir}/${id}.json`, { [id]: text[locale][id] })
  }
}
await writeJson(`${localesDir}/en/npcAbilitySummoners.json`, summoners)
await writeJson(
  `${localesDir}/en/npcAbilityTextGaps.json`,
  [...uncovered.keys()].sort()
)

// ---- report ------------------------------------------------------------------------------------------

const abilityIcons = new Set(readdirSync(abilityIconDir))
const missingRelicIcons = [...relicAbilityIds]
  .filter((id) => !abilityIcons.has(`ui_icon_ability2_${id}.png`))
  .sort()

const newGaps = [...uncovered.keys()].filter((id) => !KNOWN_GAPS.has(id))
const closedGaps = [...KNOWN_GAPS].filter((id) => !uncovered.has(id))

console.log(
  `npcAbilityText: ${Object.keys(text.en).length} files per locale from ${referenced.size} referenced ids, ${summoners.length} summoners`
)
for (const [id, reason] of uncovered) {
  console.log(
    `  ${KNOWN_GAPS.has(id) ? "known gap" : "NEW GAP  "} ${id}: ${reason}`
  )
}
for (const id of closedGaps)
  console.log(`  CLOSED    ${id}: now covered, remove it from KNOWN_GAPS`)
for (const id of missingRelicIcons) {
  console.log(
    `  NO ICON   relic ability ${id}: ui_icon_ability2_${id}.png (exact case)`
  )
}

if (
  newGaps.length > 0 ||
  closedGaps.length > 0 ||
  missingRelicIcons.length > 0
) {
  process.exitCode = 1
}
