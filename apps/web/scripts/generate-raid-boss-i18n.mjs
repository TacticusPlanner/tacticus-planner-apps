// Generator for the raid-boss game-data i18n namespaces, keyed by entity id:
//   public/locales/en/raidBosses.json                        unitSetId -> display name
//   public/locales/{en,de,es,fr}/raidBossAbilities.json     abilityId -> ability name (referenced ids only)
//   public/locales/{en,de,es,fr}/raidBossTraits.json        traitId   -> trait name (referenced ids only)
//   public/locales/{en,de,es,fr}/raidBossAbilityText/<abilityId>.json
//     { <abilityId>: { description, variables, constants, scaled } }
//   public/locales/en/raidBossAbilityTextGaps.json          sorted referenced ability ids with no rules text
//   public/locales/{en,de,es,fr}/raidBossTraitText.json     traitId   -> { description, styledName, variables }
//
// Source: the pinned data-mines commit (datamine/REF, see scripts/datamine.mjs): the guild-boss unit
// sets, the ability tables, the global trait constants and the game's own language files. Boss names are
// derived from the unit-set ids with V1's `getUnitDisplayName` formatting (the game has no localized
// name for them), so `raidBosses` is en-only and other locales fall back to it. Re-run after every
// `pnpm datamine:pull`. Ability/trait rules-text carries `{[variable]}` tokens the client resolves per
// progression step (see the `add-raid-boss-ability-text` OpenSpec change).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { format, resolveConfig } from "prettier"

import { ensureDatamine } from "./datamine.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const datamine = ensureDatamine()
const localesDir = resolve(here, "../public/locales")

const LOCALES = ["en", "de", "es", "fr"]

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))
const unitSets = readJson(
  `${datamine}/raw/globalconfig/guildBoss/unitSets.json`
)
const abilityById = new Map(
  Object.entries(readJson(`${datamine}/raw/gameconfig/units/abilities.json`))
)
const languages = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    readJson(`${datamine}/raw/languages/${locale}.json`),
  ])
)
/** The game's text for a language key, falling back to English. */
const term = (locale, key) => languages[locale][key] ?? languages.en[key]

// Trait descriptions carry `{[varName]}` placeholders whose values come from global game constants
// (traits do not level, so each resolves to a single-element array). Build-time only, so shipped app
// code reads already-resolved values. They come from the game's `globalValues.traitVariables`, plus
// three of its top-level values under V1's names; the game config has no source for the last three,
// which keep V1's values.
const globalValues = readJson(`${datamine}/raw/gameconfig/globalValues.json`)
const TRAIT_GLOBAL_VARIABLES = {
  ...globalValues.traitVariables,
  battleFatigueChance: globalValues.battleFatigueFleeChance,
  battleFatigueChance_2: globalValues.battleFatigueFleeChanceOverkill,
  terrifyingDefensePct: globalValues.terrifyingBonus,
  damagedMachineDestroyChanceIncrease: 50,
  actOfFaithExtraCritChance: 10,
  actOfFaithExtraCritDmgPct: 25,
}

const TRAIT_VARIABLE_MAP = {
  ActOfFaith: {
    extraCritChance: "actOfFaithExtraCritChance",
    extraCritDmgPct: "actOfFaithExtraCritDmgPct",
  },
  BattleFatigue: {
    chance: "battleFatigueChance",
    chance_2: "battleFatigueChance_2",
  },
  BeastSlayer: {
    extraDmgPct: "beastSlayerExtraDmgPct",
    blockChance: "beastSlayerBlockChance",
  },
  BeastSnagga: {
    extraDmgPct: "beastSnaggaDmgBonus",
    blockChance: "beastSnaggaBlockChance",
    blockDmgPct: "beastSnaggaDmgAsMaxHpPct",
  },
  BlessingsOfKhorne: {
    extraDmgPct: "blessingsOfKhorneExtraDmgPct",
    dmgPctReduction: "blessingsOfKhorneDmgPctReduction",
    nrOfHeroes: "blessingsOfKhorneMaxDefeatedUnits",
  },
  BossAdjutant: {
    damagePctReduction: "bossAdjutantDmgReductionPct",
    damagePct: "bossAdjutantDmgPct",
  },
  CloseCombatWeakness: {
    dmgPctReduction: "closeCombatWeaknessMeleeDmgPctReduction",
    dmgPctReduction_2: "closeCombatWeaknessRangeDmgPctReduction",
  },
  ContagionsOfNurgle: {
    armorReduction: "contagionsOfNurgleArmorOneAura",
    armorReduction2: "contagionsOfNurgleArmorTwoOrMoreAuras",
  },
  CrushingStrike: { extraDmgPct: "crushingStrikeExtraDmgPct" },
  Daemon: {
    blockChance: "daemonBlockChance",
    blockDmgPct: "daemonBlockDamagePercentage",
  },
  Dakka: { extraHit: "dakkaExtraHits" },
  Diminutive: { hitsReduction: "diminutiveHitReduction" },
  Emplacement: {
    damageModifier: "emplacementMeleeDmgModifier",
    damageModifier_2: "emplacementRangedDmgModifier",
  },
  GetStuckIn: {
    chance: "getStuckInChance",
    chance_2: "getStuckInChance_2",
  },
  HeavyWeapon: { extraDmgPct: "heavyWeaponExtraDmg" },
  LetTheGalaxyBurn: { chance: "LetTheGalaxyBurnChancePct" },
  LivingMetal: { hpPct: "livingMetalHp" },
  MartialKatah: {
    dmgReductionPct: "martialKatahDmgReductionPct",
    extraDmgPct: "martialKatahExtraDmgPct",
  },
  Parry: { hitsReduction: "parryHitReduction" },
  PrioritisedEfficiency: {
    extraDmgPct: "prioritisedEfficiencyExtraDmgPct",
    dmgReductionPct: "prioritisedEfficiencyDmgReductionPct",
  },
  Psyker: { extraDmgPct: "psykerExtraDmg" },
  PutridExplosion: { extraDmgPct: "putridExplosionDmgPct" },
  RangedSpecialist: { extraDmgPct: "rangedSpecialistDmgPct" },
  RapidAssault: { extraDmgPct: "rapidAssaultExtraDmgPct" },
  ShadowInTheWarp: {
    range: "shadowInTheWarpRange",
    dmgPct: "shadowInTheWarpDmgModifier",
  },
  TerminatorArmour: { dmgPctReduction: "terminatorArmourDmgReduction" },
  Terrifying: { defensePct: "terrifyingDefensePct" },
  ThrillSeekers: {
    nrOfRounds: "thrillSeekersNrOfRounds",
    extraCritChance: "thrillSeekersExtraCritChance",
  },
}

function getTraitVariables(traitId) {
  const map = TRAIT_VARIABLE_MAP[traitId]
  if (!map) return {}
  return Object.fromEntries(
    Object.entries(map).map(([variableName, globalKey]) => [
      variableName,
      [TRAIT_GLOBAL_VARIABLES[globalKey]],
    ])
  )
}

const FACTION_PREFIXES = [
  "Tyran",
  "Necro",
  "Death",
  "Orks",
  "Astra",
  "Eldar",
  "Thous",
  "Admec",
  "Tau",
  "Darka",
]
const UNIT_TYPE_RE = /^GuildBoss\d+(?:Boss|MiniBoss|Minion|Npc|LootObj)\d*/

function formatWords(name) {
  return name
    .replace(/([a-z])(of|the)([A-Z])/g, "$1 $2 $3")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim()
}

// Ported from V1 guild-boss.service.ts getUnitDisplayName.
function unitDisplayName(unitSetId) {
  let name = unitSetId.replace(UNIT_TYPE_RE, "")
  for (const faction of FACTION_PREFIXES) {
    if (name.startsWith(faction)) {
      name = name.slice(faction.length)
      break
    }
  }
  return formatWords(name || unitSetId)
}

const BOSS_RE = /^GuildBoss(\d+)Boss/
const PRIME_RE = /^GuildBoss(\d+)(?:MiniBoss|Minion)(\d+)/

const raidBosses = {}
const referencedAbilityIds = new Set()
const referencedTraitIds = new Set()

// The game keeps several unit-set variants; a boss's referenced ids are the union over them.
const unitSetEntries = Object.values(unitSets).flatMap((set) =>
  Object.entries(set)
)
for (const [id, unitSet] of unitSetEntries) {
  if (!BOSS_RE.test(id) && !PRIME_RE.test(id)) continue
  raidBosses[id] = unitDisplayName(id)
  for (const abilityId of [
    ...(unitSet.activeAbilities ?? []),
    ...(unitSet.passiveAbilities ?? []),
    ...(unitSet.relicAbilities ?? []),
  ]) {
    referencedAbilityIds.add(abilityId)
  }
  for (const traitId of unitSet.traits ?? []) referencedTraitIds.add(traitId)
}

const traitIds = new Set(
  Object.keys(languages.en)
    .map((key) => /^Traits\/(.+)_Name$/.exec(key)?.[1])
    .filter(Boolean)
)

const raidBossAbilities = {}
const raidBossTraits = {}
const raidBossAbilityText = {}
const raidBossTraitText = {}
const PLACEHOLDER_DESCRIPTIONS = new Set(["", "Coming soon!"])

for (const locale of LOCALES) {
  // Abilities: keep a readable label for every referenced id (falling back to a formatted token when
  // the game has no name), then let the page hide the handful of internal ids via its own set.
  raidBossAbilities[locale] = {}
  for (const abilityId of [...referencedAbilityIds].sort()) {
    raidBossAbilities[locale][abilityId] =
      term(locale, `Abilities/${abilityId}_Name`) || formatWords(abilityId)
  }

  // Traits: emit an entry ONLY when the id resolves to a real game trait. An unresolved id (e.g. the
  // `Boss` pseudo-trait) is dropped so the page can skip it, matching V1's `if (!trait) return`.
  raidBossTraits[locale] = {}
  for (const traitId of [...referencedTraitIds].sort()) {
    const name = traitIds.has(traitId) && term(locale, `Traits/${traitId}_Name`)
    if (name) raidBossTraits[locale][traitId] = name
  }

  // Ability rules-text: for every referenced ability whose English description is real (not a
  // placeholder), carry the text plus the per-level variable/constant tables and the rarity-scaled
  // variable names. `nrOfHits` etc. are resolved client-side per the selected progression step's
  // ability level. Every locale covers the same ids, so the gaps list holds for all of them.
  raidBossAbilityText[locale] = {}
  for (const abilityId of [...referencedAbilityIds].sort()) {
    const ability = abilityById.get(abilityId)
    const key = `Abilities/${abilityId}_CurrentLevelDescription`
    if (
      !ability ||
      PLACEHOLDER_DESCRIPTIONS.has((languages.en[key] ?? "").trim())
    )
      continue
    raidBossAbilityText[locale][abilityId] = {
      description: term(locale, key),
      variables: ability.variables ?? {},
      constants: ability.constants ?? {},
      scaled: ability.variablesAffectedByRarityBonus ?? [],
    }
  }

  // Trait rules-text: the styled name and description, with `{[var]}` placeholders resolved from the
  // global trait constants at build time (traits do not level).
  raidBossTraitText[locale] = {}
  for (const traitId of [...referencedTraitIds].sort()) {
    const description =
      traitIds.has(traitId) && term(locale, `Traits/${traitId}_Description`)
    if (!description) continue
    raidBossTraitText[locale][traitId] = {
      description,
      styledName:
        term(locale, `Traits/${traitId}_StyledName`) ??
        term(locale, `Traits/${traitId}_Name`) ??
        traitId,
      variables: getTraitVariables(traitId),
    }
  }
}

const sortObject = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))

// Every ability id becomes a file name: keep them portable and collision-free on case-insensitive
// file systems.
const SAFE_ID_RE = /^[A-Za-z0-9_-]+$/
const lowerIds = new Map()
for (const id of Object.keys(raidBossAbilityText.en)) {
  if (!SAFE_ID_RE.test(id))
    throw new Error(`ability id is not a safe file name: ${id}`)
  const other = lowerIds.get(id.toLowerCase())
  if (other) throw new Error(`ability ids differ only by case: ${other}, ${id}`)
  lowerIds.set(id.toLowerCase(), id)
}

const prettierOptions = await resolveConfig(`${localesDir}/en/common.json`)
// Formatted as the pre-commit hook would, so a second run leaves the committed files unchanged.
const writeJson = async (path, value) =>
  writeFileSync(
    path,
    await format(JSON.stringify(value, null, 2), {
      ...prettierOptions,
      filepath: path,
    })
  )

await writeJson(`${localesDir}/en/raidBosses.json`, sortObject(raidBosses))
for (const locale of LOCALES) {
  const outDir = `${localesDir}/${locale}`
  await writeJson(`${outDir}/raidBossAbilities.json`, raidBossAbilities[locale])
  await writeJson(`${outDir}/raidBossTraits.json`, raidBossTraits[locale])
  await writeJson(
    `${outDir}/raidBossTraitText.json`,
    sortObject(raidBossTraitText[locale])
  )

  // Ability rules text: one file (and i18next namespace) per ability id, so the detail view fetches
  // only the abilities it shows. The directory is emptied first, so a dropped ability's file disappears.
  const abilityTextDir = `${outDir}/raidBossAbilityText`
  rmSync(abilityTextDir, { recursive: true, force: true })
  mkdirSync(abilityTextDir)
  for (const id of Object.keys(raidBossAbilityText[locale]).sort()) {
    await writeJson(`${abilityTextDir}/${id}.json`, {
      [id]: raidBossAbilityText[locale][id],
    })
  }
}
// The referenced ids without text, so the client never requests them.
await writeJson(
  `${localesDir}/en/raidBossAbilityTextGaps.json`,
  [...referencedAbilityIds].filter((id) => !raidBossAbilityText.en[id]).sort()
)

console.log("raidBosses:", Object.keys(raidBosses).length)
console.log("raidBossAbilities:", Object.keys(raidBossAbilities.en).length)
console.log("raidBossTraits:", Object.keys(raidBossTraits.en).length)
console.log("raidBossAbilityText:", Object.keys(raidBossAbilityText.en).length)
console.log("raidBossTraitText:", Object.keys(raidBossTraitText.en).length)
