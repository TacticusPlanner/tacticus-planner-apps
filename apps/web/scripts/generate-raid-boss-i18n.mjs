// One-off generator for the English raid-boss game-data i18n namespaces, keyed by entity id:
//   public/locales/en/raidBosses.json        unitSetId -> display name
//   public/locales/en/raidBossAbilities.json abilityId -> ability name (referenced ids only)
//   public/locales/en/raidBossTraits.json    traitId   -> trait name (referenced ids only)
//
// Source: tacticusplanner (develop) datamine. Other locales fall back to en (i18next fallbackLng),
// matching the existing `traits`/`characters` game-data namespaces which are en-only. Re-run on a
// game-version refresh. Names are derived with V1's own `getUnitDisplayName` formatting.
import { readFileSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const v1 = resolve(here, "../../../../tacticusplanner/src/fsd/4-entities")
const outDir = resolve(here, "../public/locales/en")

const guildBoss = JSON.parse(
  readFileSync(`${v1}/guild_boss/data/guild_boss.json`, "utf8")
)
const abilityData = JSON.parse(
  readFileSync(`${v1}/abilities/data/new-ability-data.json`, "utf8")
)
const traitData = JSON.parse(
  readFileSync(`${v1}/traits/data/new-traits-data.json`, "utf8")
)

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

for (const [id, unitSet] of Object.entries(guildBoss.unitSets)) {
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

const abilityById = new Map(abilityData.map((a) => [a.id, a]))
const traitById = new Map(traitData.map((t) => [t.id, t]))

// Abilities: keep a readable label for every referenced id (falling back to a formatted token when
// the datamine has no name), then let the page hide the handful of internal ids via its own set.
const raidBossAbilities = {}
for (const abilityId of [...referencedAbilityIds].sort()) {
  const name = abilityById.get(abilityId)?.text?.name
  raidBossAbilities[abilityId] = name || formatWords(abilityId)
}

// Traits: emit an entry ONLY when the id resolves to a real game trait. An unresolved id (e.g. the
// `Boss` pseudo-trait) is dropped so the page can skip it, matching V1's `if (!trait) return`.
const raidBossTraits = {}
for (const traitId of [...referencedTraitIds].sort()) {
  const name = traitById.get(traitId)?.name
  if (name) raidBossTraits[traitId] = name
}

const sortObject = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))

writeFileSync(
  `${outDir}/raidBosses.json`,
  JSON.stringify(sortObject(raidBosses), null, 2) + "\n"
)
writeFileSync(
  `${outDir}/raidBossAbilities.json`,
  JSON.stringify(raidBossAbilities, null, 2) + "\n"
)
writeFileSync(
  `${outDir}/raidBossTraits.json`,
  JSON.stringify(raidBossTraits, null, 2) + "\n"
)

console.log("raidBosses:", Object.keys(raidBosses).length)
console.log("raidBossAbilities:", Object.keys(raidBossAbilities).length)
console.log("raidBossTraits:", Object.keys(raidBossTraits).length)
