import type { BattleId, CampaignId } from "@workspace/game-domain"

import { dropRate } from "@/features/campaign-insights/@x/goal-planning"
import type {
  EstimateOutcome,
  EstimateResourceId,
  GoalInventoryAllocation,
  GoalNeed,
} from "@/features/goal-farming/@x/goal-planning"
import type { Battle, FarmLocation } from "@/shared/lib"

import {
  campaignTrackGate,
  type GateCampaignDefinition,
} from "../unlock-paths/campaign-track-gate"
import { netGoalNeeds } from "./plan-bottlenecks"
import type { PlanCampaignProgression } from "./use-plan-insights.domain"

const TOP_CAMPAIGNS = 5

/** The parts of a campaign definition the progression reads. */
export type ProgressionCampaignDefinition = GateCampaignDefinition

type Need = { count: number; goalIds: Set<string> }

/**
 * "Campaigns to push" (UserJot "Bring back Campaign Progression", V1's Campaign Progression page):
 * the standing-campaign tracks (one {group, type}, e.g. Fall of Cadia Elite) the player hasn't
 * cleared, ranked by what clearing them does for the scoped goals.
 *
 * - **Unblocks**: needs no reachable node drops (`NoFarmLocation` blockers) that one of the track's
 *   locked nodes drops, with the battles to beat to reach the closest such node.
 * - **Energy saved**: for every still-farmed need of a goal that doesn't pin its farming locations,
 *   `count × (energy per item now − energy per item with the track open)` at the cheapest node
 *   (energy ÷ drop rate), the same first-order cost `computeBottlenecks` ranks by, so it ignores
 *   daily attempt caps and is a relative signal rather than an exact figure.
 *
 * Tracks that do neither are left out; the rest sort by unblocked needs, then energy saved. Each
 * track also says why it can't be played yet: core characters not owned, the campaign it follows
 * not cleared, or (Elite) the player's Power Level below the game's threshold. Campaign events are
 * not tracks here: they're farmable only while running, which no progress changes.
 */
export function computeCampaignProgression(params: {
  goalNeeds: readonly GoalNeed[]
  allocations: ReadonlyMap<string, GoalInventoryAllocation>
  estimates: ReadonlyMap<string, EstimateOutcome>
  farmLocationsById: ReadonlyMap<
    EstimateResourceId,
    { farmLocations: readonly FarmLocation[] }
  >
  battlesById: ReadonlyMap<BattleId, Battle>
  allBattlesById: ReadonlyMap<BattleId, Battle>
  campaignProgressByKey: ReadonlyMap<
    string,
    { highestCompletedBattleIndex: number }
  >
  definitionsByGroupId: ReadonlyMap<string, ProgressionCampaignDefinition>
  /** Owned character ids; undefined skips the core-character check. */
  ownedUnitIds: ReadonlySet<string> | undefined
  powerLevel: number | undefined
  eliteCampaignMinPowerLevel: number | undefined
  isElite: (campaignGroupId: CampaignId) => boolean
  label: (resourceId: EstimateResourceId) => string
}): PlanCampaignProgression[] {
  const blocked = new Map<EstimateResourceId, Need>()
  const farmed = new Map<EstimateResourceId, Need>()
  const add = (
    map: Map<EstimateResourceId, Need>,
    id: EstimateResourceId,
    count: number,
    goalId: string
  ) => {
    const need = map.get(id) ?? { count: 0, goalIds: new Set<string>() }
    need.count += count
    need.goalIds.add(goalId)
    map.set(id, need)
  }
  for (const goal of params.goalNeeds) {
    const estimate = params.estimates.get(goal.goalId)
    const blockedIds = new Set<EstimateResourceId>()
    if (estimate?.status === "Blocked") {
      for (const blocker of estimate.blockers ?? []) {
        blockedIds.add(blocker.resourceId)
        if (blocker.reason === "NoFarmLocation") {
          add(blocked, blocker.resourceId, blocker.remaining, goal.goalId)
        }
      }
      if (!estimate.blockers) continue
    }
    // A goal pinned to its own nodes keeps farming there whatever opens up.
    if (goal.farmingLocationIds?.length) continue
    const net = netGoalNeeds(
      goal,
      params.allocations.get(goal.goalId),
      estimate
    )
    for (const [id, count] of net) {
      if (!blockedIds.has(id)) add(farmed, id, count, goal.goalId)
    }
  }
  if (blocked.size === 0 && farmed.size === 0) return []

  type TrackBattle = { battleId: BattleId; battle: Battle }
  const tracks = new Map<string, TrackBattle[]>()
  for (const [battleId, battle] of params.allBattlesById) {
    const definition = params.definitionsByGroupId.get(battle.campaignGroupId)
    if (!definition || definition.releaseType === "event") continue
    const key = `${battle.campaignGroupId}:${battle.type}`
    const list = tracks.get(key) ?? []
    list.push({ battleId, battle })
    tracks.set(key, list)
  }

  const frontierOf = (key: string) =>
    params.campaignProgressByKey.get(key)?.highestCompletedBattleIndex
  const lastIndexByKey = new Map(
    [...tracks].map(([key, list]) => [
      key,
      Math.max(...list.map(({ battle }) => battle.battleIndex)),
    ])
  )
  const lastIndexOf = (key: string) => lastIndexByKey.get(key) ?? -1
  const isCleared = (key: string) =>
    tracks.has(key) && (frontierOf(key) ?? 0) > lastIndexOf(key)

  const bestEnergy = (
    id: EstimateResourceId,
    usable: (battleId: BattleId) => boolean
  ) => {
    let best = Infinity
    for (const location of params.farmLocationsById.get(id)?.farmLocations ??
      []) {
      if (!usable(location.battleId)) continue
      const battle = params.allBattlesById.get(location.battleId)
      const rate = dropRate(location)
      if (!battle || battle.energyCost <= 0 || rate <= 0) continue
      best = Math.min(best, battle.energyCost / rate)
    }
    return best
  }

  const results: PlanCampaignProgression[] = []
  for (const [key, battles] of tracks) {
    if (isCleared(key)) continue
    const { campaignGroupId, type } = battles[0]!.battle
    const frontier = frontierOf(key) ?? 0
    const locked = new Map(
      battles
        .filter(({ battleId }) => !params.battlesById.has(battleId))
        .map(({ battleId, battle }) => [battleId, battle])
    )
    if (locked.size === 0) continue
    const withTrack = (battleId: BattleId) =>
      params.battlesById.has(battleId) || locked.has(battleId)

    const { lockReasons, prerequisiteBattles } = campaignTrackGate(
      campaignGroupId,
      {
        lastIndexByKey,
        campaignProgressByKey: params.campaignProgressByKey,
        definitionsByGroupId: params.definitionsByGroupId,
        ownedUnitIds: params.ownedUnitIds,
        powerLevel: params.powerLevel,
        eliteCampaignMinPowerLevel: params.eliteCampaignMinPowerLevel,
        isElite: params.isElite,
      }
    )
    const unblocks: PlanCampaignProgression["unblocks"] = []
    for (const [id, need] of blocked) {
      let closest: number | undefined
      for (const location of params.farmLocationsById.get(id)?.farmLocations ??
        []) {
        const battle = locked.get(location.battleId)
        if (!battle || battle.energyCost <= 0 || dropRate(location) <= 0) {
          continue
        }
        closest = Math.min(closest ?? Infinity, battle.battleIndex)
      }
      if (closest === undefined) continue
      unblocks.push({
        resourceId: id,
        label: params.label(id),
        count: need.count,
        battlesToGo: prerequisiteBattles + Math.max(1, closest - frontier + 1),
        goalIds: [...need.goalIds],
      })
    }

    let energySaved = 0
    for (const [id, need] of farmed) {
      const now = bestEnergy(id, (battleId) => params.battlesById.has(battleId))
      const open = bestEnergy(id, withTrack)
      if (Number.isFinite(open) && open < now && Number.isFinite(now)) {
        energySaved += need.count * (now - open)
      }
    }
    energySaved = Math.round(energySaved)
    if (unblocks.length === 0 && energySaved <= 0) continue

    unblocks.sort((a, b) => a.battlesToGo - b.battlesToGo)
    results.push({
      key,
      campaignGroupId,
      type,
      battlesLeft: lastIndexOf(key) - frontier + 1,
      started: params.campaignProgressByKey.has(key),
      energySaved,
      unblocks,
      lockReasons,
    })
  }

  return results
    .sort(
      (a, b) =>
        b.unblocks.length - a.unblocks.length || b.energySaved - a.energySaved
    )
    .slice(0, TOP_CAMPAIGNS)
}
