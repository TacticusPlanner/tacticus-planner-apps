// Display-name resolution for raid-boss unit-set ids. The served `raid-bosses` dataset is id-only, so
// the client turns `GuildBoss4MiniBoss1OrksBigMek` into "Gibbascrapz" (a playable prime), a field npc
// id into its npc-roster name, or — failing a roster hit — a humanized token. Ported from V1's
// guild-boss.service.ts (`getUnitDisplayName`, `resolvePrimeDisplayName`) and guild-boss-npc-adapter.ts
// (`fuzzyResolveNpc`).

const UNIT_TYPE_RE = /^GuildBoss\d+(?:Boss|MiniBoss|Minion|Npc|LootObj)\d*/
const PRIME_TOKEN_RE = /(?:MiniBoss|Minion)\d+(.+)$/
const NPC_PREFIX_RE = /^GuildBoss\d+Npc\d+/

// The faction token that leads a unit-set id's descriptive tail (`TyranTervigon…`, `AdmecMarshall`).
// Ported verbatim from V1 — these are id spellings, not derived from the faction display name.
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

// Faction id -> the abbreviation the npc roster keys its ids with (`tyranNpc3Termagant`).
const FACTION_ABBREVIATIONS: Record<string, string> = {
  Tyranids: "tyran",
  Necrons: "necro",
  DeathGuard: "death",
  Orks: "orks",
  AstraMilitarum: "astra",
  Aeldari: "eldar",
  ThousandSons: "thous",
  AdeptusMechanicus: "admec",
  Tau: "tau",
  DarkAngels: "darka",
}

// Hive-fleet skins: a raid-boss unit-set carries the fleet in its id (`…TermagantLeviathan`) but the
// shared npc roster usually only has the base entry (`tyranNpc3Termagant`).
const FLEET_SUFFIXES = ["Leviathan", "Kronos", "Gorgon"]

/** Inserts a space at a CamelCase boundary and around an embedded lowercase `of` / `the`. */
function splitWords(token: string): string {
  return token
    .replace(/([a-z])(of|the)([A-Z])/g, "$1 $2 $3")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
}

function stripFactionPrefix(token: string): string {
  for (const prefix of FACTION_PREFIXES) {
    if (token.startsWith(prefix)) return token.slice(prefix.length)
  }
  return token
}

/**
 * A readable name derived purely from the unit-set id: drops the `GuildBoss<n><type><m>` prefix and
 * the leading faction token, then splits the remainder into words. Ported from V1 `getUnitDisplayName`.
 */
export function unitDisplayName(unitSetId: string): string {
  const tail = stripFactionPrefix(unitSetId.replace(UNIT_TYPE_RE, ""))
  return splitWords(tail || unitSetId)
}

/**
 * A prime's playable-character name (e.g. `GuildBoss4MiniBoss1OrksBigMek` → `orksBigMek` → "Gibbascrapz"),
 * or `undefined` when the prime is not a playable character (Tyranid Warriors, Necron minions).
 * `charactersById` is keyed by the catalog character id.
 */
export function resolvePrimeName(
  unitSetId: string,
  charactersById: Map<string, { name: string }>
): string | undefined {
  const match = PRIME_TOKEN_RE.exec(unitSetId)
  if (!match) return undefined
  const token = match[1]
  const characterId = token.charAt(0).toLowerCase() + token.slice(1)
  return charactersById.get(characterId)?.name
}

/**
 * A field npc's roster name (e.g. `GuildBoss1Npc1TyranTermagantLeviathan` → "Termagant"), matched
 * fuzzily against the npc catalog by faction abbreviation, dropping the fleet skin. Falls back to a
 * humanized token when nothing resolves. Ported from V1 `fuzzyResolveNpc`.
 */
export function resolveFieldNpcName(
  fieldNpcId: string,
  bossFactionId: string,
  npcs: readonly { id: string; name: string }[]
): string {
  const prefixMatch = NPC_PREFIX_RE.exec(fieldNpcId)
  const abbreviation = FACTION_ABBREVIATIONS[bossFactionId]

  if (prefixMatch && abbreviation) {
    let rest = stripFactionPrefix(fieldNpcId.slice(prefixMatch[0].length))
    for (const fleet of FLEET_SUFFIXES) {
      if (rest.endsWith(fleet)) {
        rest = rest.slice(0, -fleet.length)
        break
      }
    }
    const fuzzy = new RegExp(
      `^${abbreviation}Npc\\d+${rest}(?:Leviathan|Kronos|Gorgon)?(?:_SyncPvp.*)?$`,
      "i"
    )
    const hit = npcs.find((npc) => fuzzy.test(npc.id))
    if (hit) return hit.name
  }

  return unitDisplayName(fieldNpcId)
}
