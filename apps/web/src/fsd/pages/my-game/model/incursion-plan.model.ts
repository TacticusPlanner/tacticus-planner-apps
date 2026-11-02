import type { Progression, Rank } from "@workspace/game-domain"

import { withSupport } from "@/entities/legendary-event"

import type { IncursionBattle, IncursionTier } from "./incursions.model"

/** Heroes a run brings (the MoW comes on top). */
const INCURSION_TEAM_SIZE = 5

/** The power a battle needs: every enemy's power × its count, scaled by the battle's difficulty. */
export function incursionBattlePower(
  battle: Pick<IncursionBattle, "enemies" | "difficultyMultiplier">,
  enemyPower: (npcId: string, level: number) => number | null
): number | null {
  let total = 0
  for (const enemy of battle.enemies) {
    const power = enemyPower(enemy.npcId, enemy.level)
    if (power === null) return null
    total += power * enemy.count
  }
  return (total * battle.difficultyMultiplier) / 100
}

/** One battle on the path a run takes, with the power it needs. */
export type PathBattle = { battleId: string; power: number }

/**
 * The run through the tier's map that faces the least total enemy power: each node keeps the
 * lightest path into it, and the run ends at the deepest node. Null while a battle's power is
 * unknown.
 */
export function lightestPath(
  tier: IncursionTier,
  powerOf: (battle: IncursionBattle) => number | null
): PathBattle[] | null {
  const battlesById = new Map(tier.battles.map((battle) => [battle.id, battle]))
  const best = new Map<number, { load: number; path: PathBattle[] }>()
  for (const node of [...tier.nodes].sort((a, b) => a.depth - b.depth)) {
    const into = node.unlockedBy
      .map((parent) => best.get(parent))
      .filter((value) => value !== undefined)
      .reduce<{ load: number; path: PathBattle[] } | undefined>(
        (top, value) => (!top || value.load < top.load ? value : top),
        undefined
      ) ?? { load: 0, path: [] }
    const battle =
      node.kind === "battle" && node.battleId
        ? battlesById.get(node.battleId)
        : undefined
    if (!battle) {
      best.set(node.index, into)
      continue
    }
    const power = powerOf(battle)
    if (power === null) return null
    best.set(node.index, {
      load: into.load + power,
      path: [...into.path, { battleId: battle.id, power }],
    })
  }
  const lastDepth = Math.max(...tier.nodes.map((node) => node.depth))
  return (
    tier.nodes
      .filter((node) => node.depth === lastDepth)
      .map((node) => best.get(node.index))
      .filter((value) => value !== undefined)
      .reduce<{ load: number; path: PathBattle[] } | undefined>(
        (top, value) => (!top || value.load < top.load ? value : top),
        undefined
      )?.path ?? []
  )
}

/** A tier's enemy power: every battle's, and the toughest on the easiest path through it. */
export type TierPower = {
  battles: ReadonlyMap<string, number>
  /** The path through the map that faces the least enemy power in all, in order. */
  path: readonly PathBattle[]
  /** The strongest battle on the path that faces the least enemy power in all. */
  peakPower: number
}

/** Every battle's power and the easiest path's toughest battle; null while a power is unknown. */
export function tierPower(
  tier: IncursionTier,
  powerOf: (battle: IncursionBattle) => number | null
): TierPower | null {
  const battles = new Map<string, number>()
  for (const battle of tier.battles) {
    const power = powerOf(battle)
    if (power === null) return null
    battles.set(battle.id, power)
  }
  const path = lightestPath(tier, (battle) => battles.get(battle.id) ?? null)
  if (!path) return null
  return {
    battles,
    path,
    peakPower: Math.max(0, ...path.map((step) => step.power)),
  }
}

/** How hard one battle is for a team, as a colour guide. */
export type PowerStanding = "even" | "harder" | "hard"

/**
 * How a battle compares with a team, on the estimate's scale: "even" up to half of what a fresh team
 * can win, "harder" up to that, "hard" beyond (lost even at full HP).
 */
export function powerStanding(
  battlePower: number,
  teamPower: number
): PowerStanding {
  const need = battlePower / ENEMY_POWER_DIVISOR
  if (need <= teamPower / 2) return "even"
  return need <= teamPower ? "harder" : "hard"
}

/**
 * How much summed enemy power one unit of hero power stands up to: a battle's power adds up every
 * enemy on the board, so the team faces `E / ENEMY_POWER_DIVISOR`. Tuned on a reported Tier 13 clear
 * (three runs at about 1.3M against battles up to 6.2M); a web constant, retuned here.
 */
export const ENEMY_POWER_DIVISOR = 5

/** The share of the team's HP a battle as strong as the team costs; damage carries over in a run. */
export const HP_LOSS_SHARE = 0.3

/** How much less HP a team with a useful Healer (or a Mechanic with a Mechanical ally) loses. */
const SUPPORT_SUSTAIN = 0.25

/** How a team is estimated to fare in a tier over as many runs as it takes. */
export type TierRunsEstimate =
  /** `runs` runs clear the tier; the first run wins `firstRunWins` battles. */
  | { status: "clears"; runs: number; firstRunWins: number; battles: number }
  /** Even a fresh run loses the battle numbered `battle` (the game's battle number). */
  | { status: "stuck"; battle: string; firstRunWins: number; battles: number }

/**
 * Plays the path run by run. In a run the team starts at full HP and fights each battle at its
 * power × the HP left, which must reach the battle's power ÷ `ENEMY_POWER_DIVISOR`; a win costs
 * `HP_LOSS_SHARE` × that ÷ the team's power of the HP (less `SUPPORT_SUSTAIN` with support), and a
 * battle that would take the last of it is lost. Battles won stay won, so the next run starts at the
 * battle lost, with full HP.
 */
export function estimateTierRuns(
  teamPower: number,
  path: readonly PathBattle[],
  sustained: boolean
): TierRunsEstimate {
  const battles = path.length
  let at = 0
  let runs = 0
  let firstRunWins = 0
  while (at < battles) {
    runs++
    let hp = 1
    const start = at
    while (at < battles) {
      const need = path[at]!.power / ENEMY_POWER_DIVISOR
      if (teamPower <= 0 || teamPower * hp < need) break
      const cost =
        ((HP_LOSS_SHARE * need) / teamPower) *
        (sustained ? 1 - SUPPORT_SUSTAIN : 1)
      if (cost >= hp) break
      hp -= cost
      at++
    }
    if (runs === 1) firstRunWins = at
    if (at === start) {
      return {
        status: "stuck",
        battle: path[at]?.battleId ?? String(at + 1),
        firstRunWins,
        battles,
      }
    }
  }
  return { status: "clears", runs: Math.max(1, runs), firstRunWins, battles }
}

/** A hero the team suggestion can pick. */
export type IncursionCandidate = {
  id: string
  faction: string
  traits: readonly string[]
  power: number
  /** The hero's synced rank and rarity/stars, for display. */
  rank?: Rank
  progression?: Progression
}

const has = (unit: IncursionCandidate, trait: string) =>
  unit.traits.includes(trait)

/** Whether the team holds a Healer with a non-Mechanical ally or a Mechanic with a Mechanical one. */
export function hasSustain(team: readonly IncursionCandidate[]): boolean {
  return team.some(
    (support) =>
      (has(support, "Healer") &&
        team.some((ally) => ally !== support && !has(ally, "Mechanical"))) ||
      (has(support, "Mechanic") &&
        team.some((ally) => ally !== support && has(ally, "Mechanical")))
  )
}

/** The heroes of the allowed factions with a known power, strongest first. */
export function eligibleCandidates(
  candidates: readonly IncursionCandidate[],
  allowedFactions: readonly string[]
): IncursionCandidate[] {
  const allowed = new Set(allowedFactions)
  return candidates
    .filter((unit) => allowed.has(unit.faction) && unit.power > 0)
    .toSorted((a, b) => b.power - a.power || a.id.localeCompare(b.id))
}

/**
 * The suggested team (from `eligibleCandidates`): the strongest heroes of the allowed factions, with a Healer (then a Mechanic)
 * swapped in for the weakest plain member when the team has none, since HP carries over between
 * battles (the LRE support rule). Null when the roster holds fewer heroes than a run needs.
 */
export function suggestIncursionTeam(
  pool: readonly IncursionCandidate[],
  minMembers: number
): IncursionCandidate[] | null {
  if (pool.length === 0 || pool.length < minMembers) return null
  return withSupport(
    pool.slice(0, INCURSION_TEAM_SIZE),
    pool,
    INCURSION_TEAM_SIZE
  )
}

export const teamPowerOf = (team: readonly IncursionCandidate[]) =>
  team.reduce((sum, unit) => sum + unit.power, 0)

/** Adds or removes a hero from a team being tried out; a full team ignores more additions. */
export function toggleTeamMember(
  team: readonly string[],
  id: string
): string[] {
  if (team.includes(id)) return team.filter((member) => member !== id)
  return team.length >= INCURSION_TEAM_SIZE ? [...team] : [...team, id]
}
