import type { IncursionStorageModel } from "@workspace/game-catalog"

export type Incursion = IncursionStorageModel
export type IncursionTier = Incursion["tiers"][number]
export type IncursionBattle = IncursionTier["battles"][number]
export type IncursionNode = IncursionTier["nodes"][number]
export type IncursionEnhancement = Incursion["enhancements"][string]

/** A game reward string ("type", "type:N" or "type:N-M") as an id and an amount range. */
export type ParsedReward = { id: string; min: number; max: number }

const AMOUNT = /^(\d+)(?:-(\d+))?$/

/** Parses a game reward string; an absent or unreadable amount counts as 1. */
export function parseReward(reward: string): ParsedReward {
  const at = reward.lastIndexOf(":")
  if (at < 0) return { id: reward, min: 1, max: 1 }
  const match = AMOUNT.exec(reward.slice(at + 1))
  if (!match) return { id: reward, min: 1, max: 1 }
  const min = Number(match[1])
  return { id: reward.slice(0, at), min, max: Number(match[2] ?? min) }
}

/** Parses and sums rewards by id, keeping the order each id first appears in. */
export function sumRewards(rewards: readonly string[]): ParsedReward[] {
  const byId = new Map<string, ParsedReward>()
  for (const reward of rewards.map(parseReward)) {
    const existing = byId.get(reward.id)
    byId.set(
      reward.id,
      existing
        ? {
            id: reward.id,
            min: existing.min + reward.min,
            max: existing.max + reward.max,
          }
        : reward
    )
  }
  return [...byId.values()]
}

export type ShardYield = { shards: number; mythicShards: number }

const NO_SHARDS: ShardYield = { shards: 0, mythicShards: 0 }

/** The MoW's own shards and mythic shards among `rewards` (the minimum of any range). */
export function shardYield(
  mowId: string,
  rewards: readonly string[]
): ShardYield {
  let shards = 0
  let mythicShards = 0
  for (const { id, min } of rewards.map(parseReward)) {
    if (id === `shards_${mowId}`) shards += min
    else if (id === `mythicShards_${mowId}`) mythicShards += min
  }
  return { shards, mythicShards }
}

/** Every reward a node pays once: a battle's base and 1-3 star rewards, or a chest's contents. */
function nodeRewards(
  node: IncursionNode,
  battlesById: ReadonlyMap<string, IncursionBattle>
): string[] {
  if (node.kind === "chest") return node.chest?.rewards ?? []
  if (node.kind !== "battle" || !node.battleId) return []
  const battle = battlesById.get(node.battleId)
  return battle ? [...battle.baseRewards, ...battle.starRewards] : []
}

const totalShards = (value: ShardYield) => value.shards + value.mythicShards

const better = (a: ShardYield, b: ShardYield) =>
  totalShards(a) !== totalShards(b)
    ? totalShards(a) > totalShards(b)
    : a.mythicShards > b.mythicShards

const add = (a: ShardYield, b: ShardYield): ShardYield => ({
  shards: a.shards + b.shards,
  mythicShards: a.mythicShards + b.mythicShards,
})

/**
 * The most MoW shards (then mythic shards) one path through the tier's run map pays when every
 * battle on it is cleared with 3 stars: each node adds its own rewards to the best path into it.
 */
export function bestPathShards(mowId: string, tier: IncursionTier): ShardYield {
  const battlesById = new Map(tier.battles.map((battle) => [battle.id, battle]))
  const best = new Map<number, ShardYield>()
  const byDepth = [...tier.nodes].sort((a, b) => a.depth - b.depth)
  for (const node of byDepth) {
    const into = node.unlockedBy
      .map((parent) => best.get(parent))
      .filter((value): value is ShardYield => value !== undefined)
      .reduce((top, value) => (better(value, top) ? value : top), NO_SHARDS)
    best.set(
      node.index,
      add(into, shardYield(mowId, nodeRewards(node, battlesById)))
    )
  }
  return [...best.values()].reduce(
    (top, value) => (better(value, top) ? value : top),
    NO_SHARDS
  )
}

/** One depth of the run map. `choice` marks a depth whose nodes all lock each other out. */
export type RunStep = {
  depth: number
  choice: boolean
  nodes: IncursionNode[]
}

export function runSteps(tier: IncursionTier): RunStep[] {
  const byDepth = new Map<number, IncursionNode[]>()
  for (const node of tier.nodes) {
    byDepth.set(node.depth, [...(byDepth.get(node.depth) ?? []), node])
  }
  return [...byDepth.entries()]
    .sort(([a], [b]) => a - b)
    .map(([depth, nodes]) => ({
      depth,
      nodes,
      choice:
        nodes.length > 1 &&
        nodes.every((node) =>
          nodes.every(
            (other) =>
              other === node || node.exclusiveWith.includes(other.index)
          )
        ),
    }))
}

export type TierSummary = {
  battles: number
  challenges: number
  chests: number
  enhancements: number
  bestPath: ShardYield
}

export function tierSummary(mowId: string, tier: IncursionTier): TierSummary {
  return {
    battles: tier.battles.length,
    challenges: tier.battles.filter((battle) => battle.challenge).length,
    chests: tier.nodes.filter((node) => node.kind === "chest").length,
    enhancements: tier.nodes.filter((node) => node.kind === "enhancement")
      .length,
    bestPath: bestPathShards(mowId, tier),
  }
}

/** A tier's rarity and its 1-based number among the tiers of that rarity ("Epic 2"). */
export function tierLabels(
  tiers: readonly IncursionTier[]
): Map<number, { rarity: string; number: number }> {
  const seen = new Map<string, number>()
  return new Map(
    tiers.map((tier) => {
      const number = (seen.get(tier.rarity) ?? 0) + 1
      seen.set(tier.rarity, number)
      return [tier.index, { rarity: tier.rarity, number }]
    })
  )
}

/** Newest first: the latest debut or revamp leads, then by MoW id. */
export function orderIncursions(incursions: readonly Incursion[]): Incursion[] {
  return [...incursions].sort(
    (a, b) =>
      b.availableFromUtc.localeCompare(a.availableFromUtc) ||
      a.mowId.localeCompare(b.mowId)
  )
}

/** The unit an enhancement summons or the trait it adds, from its ability id ("EnhancementSummon:Havoc"). */
export function enhancementSubject(
  enhancement: IncursionEnhancement
): string | undefined {
  const at = enhancement.abilityId?.indexOf(":") ?? -1
  return at >= 0 ? enhancement.abilityId!.slice(at + 1) : undefined
}

/**
 * The stat row an enemy level points at, read the way campaign battles read it: a boss's level is
 * 1-based, any other npc's 0-based, both capped at the last row. `undefined` without stats.
 */
export function enemyStatRow<T>(
  npc: { id: string; stats: readonly T[] },
  level: number
): T | undefined {
  if (npc.stats.length === 0) return undefined
  const index = npc.id.includes("Boss") ? level - 1 : level
  return npc.stats[Math.max(0, Math.min(index, npc.stats.length - 1))]
}
