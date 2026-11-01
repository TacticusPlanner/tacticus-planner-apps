import { withSupport } from "@/entities/legendary-event"

import type { IncursionBattle, IncursionTier } from "./incursions.model"

/** Heroes a run brings (the MoW comes on top). */
export const INCURSION_TEAM_SIZE = 5

/**
 * The share of the team's HP a battle as strong as the team costs. Damage carries over from battle
 * to battle until the run ends, so a team that wins each battle on its own can still run out of HP.
 * A web constant, not catalog data: uncalibrated, like the LRE power ratio.
 */
export const DAMAGE_SHARE = 0.3

/** How much less damage a team with a useful Healer (or a Mechanic with a Mechanical ally) keeps. */
export const SUPPORT_SUSTAIN = 0.25

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

/** How far a team is estimated to get through a tier's run. */
export type TierRunEstimate = {
  /** Battles won in a row from the first. */
  wins: number
  battles: number
  cleared: boolean
  /** The team's HP left after the last battle won, in whole percent. */
  hpLeftPct: number
}

/**
 * Plays the path in order with HP that carries over: before each battle the team fights at its
 * power × the HP it has left, which must reach the battle's power; the battle then costs
 * `DAMAGE_SHARE` × its power ÷ the team's power of the HP, less `SUPPORT_SUSTAIN` with support.
 * A battle that would take the last of the HP is lost.
 */
export function estimateTierRun(
  teamPower: number,
  path: readonly PathBattle[],
  sustained: boolean
): TierRunEstimate {
  let hp = 1
  let wins = 0
  if (teamPower > 0) {
    for (const { power } of path) {
      if (teamPower * hp < power) break
      const cost =
        ((DAMAGE_SHARE * power) / teamPower) *
        (sustained ? 1 - SUPPORT_SUSTAIN : 1)
      if (cost >= hp) break
      hp -= cost
      wins++
    }
  }
  return {
    wins,
    battles: path.length,
    cleared: wins === path.length,
    hpLeftPct: wins > 0 ? Math.round(hp * 100) : 100,
  }
}

/** A hero the team suggestion can pick. */
export type IncursionCandidate = {
  id: string
  faction: string
  traits: readonly string[]
  power: number
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

/**
 * The suggested team: the strongest heroes of the allowed factions, with a Healer (then a Mechanic)
 * swapped in for the weakest plain member when the team has none, since HP carries over between
 * battles (the LRE support rule). Null when the roster holds fewer heroes than a run needs.
 */
export function suggestIncursionTeam(
  candidates: readonly IncursionCandidate[],
  allowedFactions: readonly string[],
  minMembers: number
): IncursionCandidate[] | null {
  const allowed = new Set(allowedFactions)
  const pool = candidates
    .filter((unit) => allowed.has(unit.faction) && unit.power > 0)
    .toSorted((a, b) => b.power - a.power || a.id.localeCompare(b.id))
  if (pool.length === 0 || pool.length < minMembers) return null
  return withSupport(
    pool.slice(0, INCURSION_TEAM_SIZE),
    pool,
    INCURSION_TEAM_SIZE
  )
}

export const teamPowerOf = (team: readonly IncursionCandidate[]) =>
  team.reduce((sum, unit) => sum + unit.power, 0)
