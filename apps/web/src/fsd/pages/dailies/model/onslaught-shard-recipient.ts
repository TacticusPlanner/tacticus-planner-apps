import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  MowStorageModel,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import { ascensionResourceNeed } from "@/features/goal-farming"

import type { SalvageTrack } from "./salvage-recommendations.types"

/** Why a shard recipient was chosen over the other eligible Onslaught-farming Ascension goals. */
type OnslaughtShardRecipientReason =
  | "onlyCandidate"
  | "inSelectedProject"
  | "overallGoalPriority"
  | "fewestRemainingShards"

/** One unit that could receive the post-battle Onslaught shard reward. */
type OnslaughtShardCandidate = {
  unitId: string
  unitName: string
  unitKind: "character" | "mow"
  goalId: string
  /** Set only when the goal belongs to the currently selected project. */
  projectId?: string
  currentRarity: Rarity
  targetRarity: Rarity
  /** Shards the player already holds toward the relevant tier. */
  currentShards: number
  /** Total shards to reach the target rarity from the current one (`current + remaining`). */
  requiredShards: number
  /** Net shards still owed — always at least one for a candidate. */
  remainingShards: number
}

export type OnslaughtShardRecipientResult =
  | { status: "none" }
  | {
      status: "ready"
      recipient: OnslaughtShardCandidate & {
        reason: OnslaughtShardRecipientReason
      }
      /** The remaining eligible candidates, in the same ranked order (best first). */
      alternates: OnslaughtShardCandidate[]
    }

export type RecommendOnslaughtShardRecipientInput = {
  track: SalvageTrack
  /** Active Ascension goals across every alliance and both entity types — the service filters. */
  ascensionGoals: readonly GoalDetail[]
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  mowsById: ReadonlyMap<string, MowStorageModel>
  /** Owned characters' synced shard state, keyed by unit id. */
  playerCharacterById: ReadonlyMap<
    string,
    | { shards?: number; mythicShards?: number; progressionIndex?: string }
    | undefined
  >
  playerMowById: ReadonlyMap<
    string,
    | { shards?: number; mythicShards?: number; progressionIndex?: string }
    | undefined
  >
  ascensionCostsById: ReadonlyMap<string, AscensionCostStorageModel>
  /** The currently selected project, stamped on a recipient whose goal belongs to it. */
  selectedProjectId: string | undefined
  /** goalId -> priority for the goals in the currently selected project (lower = higher priority). */
  selectedProjectGoalPriority: ReadonlyMap<string, number>
  /** goalId order from the player's full goal list — the overall-priority tiebreak. */
  overallGoalOrder: readonly string[]
}

function rarityOf(progression: string): Rarity {
  return progression.split(":")[0] as Rarity
}

function hasOnslaughtSource(detail: GoalDetail): boolean {
  return Boolean(
    detail.config.acquisitionSources?.some(
      (source) => source.kind === "Onslaught"
    )
  )
}

/**
 * Recommends which owned character or Machine of War to select for the post-battle Onslaught shard
 * reward on the selected track. Candidates are the units of the track's alliance with an Active
 * Ascension goal that farms Onslaught and still owes shards toward its target rarity. They are
 * ranked by, in order: the goal belongs to the selected project; its priority within that project;
 * its position in the player's overall goal list; the smaller remaining shard count; then the goal
 * id for a deterministic final tiebreak. The panel this feeds renders even when the battle team is
 * incomplete, so this never depends on the team engine.
 */
export function recommendOnslaughtShardRecipient(
  input: RecommendOnslaughtShardRecipientInput
): OnslaughtShardRecipientResult {
  const candidates: OnslaughtShardCandidate[] = []

  for (const detail of input.ascensionGoals) {
    if (detail.status !== "Active" || detail.goalType !== "Ascension") continue
    if (!detail.config.progression || !hasOnslaughtSource(detail)) continue

    const isMow = detail.entityType === "Mow"
    const catalogUnit = isMow
      ? input.mowsById.get(detail.entityId)
      : input.charactersById.get(detail.entityId)
    if (!catalogUnit || catalogUnit.alliance !== input.track) continue

    const owned = isMow
      ? input.playerMowById.get(detail.entityId)
      : input.playerCharacterById.get(detail.entityId)
    if (!owned) continue

    const ownedShards = owned.shards ?? 0
    const ownedMythicShards = owned.mythicShards ?? 0
    const need = ascensionResourceNeed({
      start: detail.config.progression.start,
      end: detail.config.progression.end,
      entityId: detail.entityId,
      isMow,
      ownedShards,
      ownedMythicShards,
      currentProgression: owned.progressionIndex,
      ascensionCostsById: input.ascensionCostsById,
    })

    const remainingShards = need.shards + need.mythicShards
    if (remainingShards <= 0) continue

    const bothTiers = need.shards > 0 && need.mythicShards > 0
    const mythicOnly = need.mythicShards > 0 && need.shards === 0
    const currentShards = bothTiers
      ? ownedShards + ownedMythicShards
      : mythicOnly
        ? ownedMythicShards
        : ownedShards

    const projectId =
      input.selectedProjectId &&
      input.selectedProjectGoalPriority.has(detail.goalId)
        ? input.selectedProjectId
        : undefined

    candidates.push({
      unitId: detail.entityId,
      unitName: catalogUnit.name,
      unitKind: isMow ? "mow" : "character",
      goalId: detail.goalId,
      ...(projectId ? { projectId } : {}),
      currentRarity: rarityOf(
        owned.progressionIndex ?? detail.config.progression.start
      ),
      targetRarity: rarityOf(detail.config.progression.end),
      currentShards,
      requiredShards: currentShards + remainingShards,
      remainingShards,
    })
  }

  if (candidates.length === 0) return { status: "none" }

  const orderIndex = (goalId: string) => {
    const index = input.overallGoalOrder.indexOf(goalId)
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }
  const projectPriority = (goalId: string) =>
    input.selectedProjectGoalPriority.get(goalId) ?? Number.MAX_SAFE_INTEGER

  const ranked = [...candidates].sort((left, right) => {
    const leftInProject = input.selectedProjectGoalPriority.has(left.goalId)
    const rightInProject = input.selectedProjectGoalPriority.has(right.goalId)
    if (leftInProject !== rightInProject) return leftInProject ? -1 : 1
    if (leftInProject && rightInProject) {
      const byPriority =
        projectPriority(left.goalId) - projectPriority(right.goalId)
      if (byPriority !== 0) return byPriority
    }
    const byOrder = orderIndex(left.goalId) - orderIndex(right.goalId)
    if (byOrder !== 0) return byOrder
    if (left.remainingShards !== right.remainingShards) {
      return left.remainingShards - right.remainingShards
    }
    return left.goalId < right.goalId ? -1 : left.goalId > right.goalId ? 1 : 0
  })

  const [winner, runnerUp] = ranked
  let reason: OnslaughtShardRecipientReason
  if (!runnerUp) {
    reason = "onlyCandidate"
  } else if (input.selectedProjectGoalPriority.has(winner.goalId)) {
    reason = "inSelectedProject"
  } else if (orderIndex(winner.goalId) < orderIndex(runnerUp.goalId)) {
    reason = "overallGoalPriority"
  } else {
    reason = "fewestRemainingShards"
  }

  return {
    status: "ready",
    recipient: { ...winner, reason },
    alternates: ranked.slice(1),
  }
}
