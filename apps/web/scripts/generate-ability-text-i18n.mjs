// Generator for the ability rules-text game data, one file (and i18next namespace) per ability id:
//   public/locales/{en,de,es,fr}/npcAbilityText/<abilityId>.json
//     { <abilityId>: { description, variables, constants, scaled } }
//   public/locales/en/npcAbilitySummoners.json  sorted ids whose English text summons a unit
//   public/locales/en/npcAbilityTextGaps.json   sorted referenced ids with no rules text (never fetched)
//
// Covers every ability id the game config references: NPC active/passive abilities (all npc records),
// character active/passive abilities, each MoW's active (primary, secondary) and mythic abilities, and
// relic abilities (`abilityId` of relic items). Source: the pinned data-mines commit (datamine/REF, see
// scripts/datamine.mjs): the game config's ability tables and the game's own language files. Re-run
// after every `pnpm datamine:pull` and commit the four locale directories and the two lists. Each locale
// directory is emptied first, so a dropped ability's file disappears.
//
// An entry is written only when the English description resolves completely: every `{[token]}` is one of
// the ability's variables or constants (keys compared trimmed — the game has trailing-space keys), a
// `DamageProfileType…` token backed by a `damageProfile…` constant, `UnitName`, or an `S/…` reference (the
// renderer drops those). Tables are pruned to what the description references (plus every
// `damageProfile*` constant); de/es/fr use the game's localized description with the same tables.
//
// The script prints every referenced id it could not cover and exits non-zero when that set differs from
// KNOWN_GAPS, or when a relic ability icon is missing (exact filename case), so a refresh notices both.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { format, resolveConfig } from "prettier"

import abilityIconOverrides from "../../../packages/game-catalog/src/game-entities/icons/ability-icon-overrides.json" with { type: "json" }
import { ensureDatamine } from "./datamine.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const datamine = ensureDatamine()
const localesDir = resolve(here, "../public/locales")
const catalogImageDir = resolve(here, "../public/game_catalog")

const LOCALES = ["en", "de", "es", "fr"]

// Referenced ids with no complete rules text, checked against what this run finds uncovered. Update it
// deliberately when a refresh adds or fixes one.
const KNOWN_GAPS = new Set([
  // NPC-only: no description in the game's language files.
  "BossEndFightUndefeated",
  "RepairEnthusiast",
  "RunsAround",
  "RunsAway",
])

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))
const config = (path) => readJson(`${datamine}/raw/gameconfig/${path}`)

// ---- referenced ability ids --------------------------------------------------------------------------

const referenced = new Set()
const relicAbilityIds = new Set()
const add = (id) => {
  if (id) referenced.add(id)
}

// Characters and MoWs: a MoW's `activeAbilities` are its primary and secondary ability.
for (const unit of Object.values(config("units/lineup.json"))) {
  for (const id of unit.activeAbilities ?? []) add(id)
  for (const id of unit.passiveAbilities ?? []) add(id)
  for (const id of unit.mythicAbilities ?? []) add(id)
}
for (const npc of Object.values(config("units/npc.json"))) {
  for (const id of npc.activeAbilities ?? []) add(id)
  for (const id of npc.passiveAbilities ?? []) add(id)
}
for (const item of Object.values(config("items.json"))) {
  if (!item.isRelic || !item.abilityId) continue
  add(item.abilityId)
  relicAbilityIds.add(item.abilityId)
}

// ---- datamine sources --------------------------------------------------------------------------------

const abilityById = new Map(Object.entries(config("units/abilities.json")))
const languages = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    readJson(`${datamine}/raw/languages/${locale}.json`),
  ])
)
const descriptionOf = (locale, id) =>
  languages[locale][`Abilities/${id}_CurrentLevelDescription`]

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
  const english = descriptionOf("en", id) ?? ""
  if (!ability) {
    uncovered.set(id, "no ability entry")
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
      locale === "en" ? english : (descriptionOf(locale, id) ?? english)
    text[locale][id] = {
      description: description.trim(),
      variables,
      constants,
      scaled,
    }
  }
}

// ---- summoners ---------------------------------------------------------------------------------------

// Kept equal to `SUMMON_PATTERNS` in the app's `entities/unit/model/summoners.ts`
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

// The paths game-catalog's abilityIcon() serves: the game's sprite (by id, or its override), else the
// planner's own copy.
const hasAbilityIcon = (id) =>
  [
    `datamines/${abilityIconOverrides[id] ?? `abilities/ui_icon_ability2_${id}.webp`}`,
    `curated/abilities/ui_icon_ability2_${id}.webp`,
  ].some((path) => existsSync(resolve(catalogImageDir, path)))
const missingRelicIcons = [...relicAbilityIds]
  .filter((id) => !hasAbilityIcon(id))
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
    `  NO ICON   relic ability ${id}: ui_icon_ability2_${id}.webp (exact case)`
  )
}

if (
  newGaps.length > 0 ||
  closedGaps.length > 0 ||
  missingRelicIcons.length > 0
) {
  process.exitCode = 1
}
