import type { BattleId, CampaignId } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

/** Why a standing campaign track can't be played yet. */
export type CampaignLockReason =
  | { kind: "MissingCoreCharacters"; unitIds: string[] }
  | {
      kind: "RequiredCampaignNotCleared"
      campaignGroupId: CampaignId
      type: string
      /** Battles left on that campaign, the frontier node included. */
      battlesLeft: number
    }
  | { kind: "PowerLevelTooLow"; required: number; current: number }

/** The parts of a campaign definition the gate reads. */
export interface GateCampaignDefinition {
  groupId: CampaignId
  releaseType: string
  coreCharacters: readonly string[]
  types: readonly string[]
  requiredCampaignGroupId: CampaignId | null
}

/** A campaign track's progress: `highestCompletedBattleIndex` is the frontier (see
 *  `isStandingBattleReached`). */
type TrackProgress = { highestCompletedBattleIndex: number }

/** What the gate needs to know about the player and the catalog. */
export interface CampaignGateContext {
  /** Last `battleIndex` per standing track (`${campaignGroupId}:${type}`). */
  lastIndexByKey: ReadonlyMap<string, number>
  campaignProgressByKey: ReadonlyMap<string, TrackProgress>
  definitionsByGroupId: ReadonlyMap<string, GateCampaignDefinition>
  /** Owned character ids; undefined skips the core-character check. */
  ownedUnitIds: ReadonlySet<string> | undefined
  powerLevel: number | undefined
  eliteCampaignMinPowerLevel: number | undefined
  isElite: (campaignGroupId: CampaignId) => boolean
}

export interface CampaignTrackGate {
  /** Missing core heroes (this campaign's and every campaign it follows), the campaign it follows
   *  when that isn't cleared, and the Elite Power Level threshold. */
  lockReasons: CampaignLockReason[]
  /** Battles left on every campaign that must be cleared before this one opens, followed back
   *  through the chain (Elite Mirror → Mirror). */
  prerequisiteBattles: number
}

/** Last `battleIndex` per standing track; campaign-event groups are left out. */
export function lastIndexByTrack(
  allBattlesById: ReadonlyMap<BattleId, Battle>,
  definitionsByGroupId: ReadonlyMap<string, GateCampaignDefinition>
): Map<string, number> {
  const last = new Map<string, number>()
  for (const battle of allBattlesById.values()) {
    const definition = definitionsByGroupId.get(battle.campaignGroupId)
    if (!definition || definition.releaseType === "event") continue
    const key = trackKey(battle.campaignGroupId, battle.type)
    last.set(key, Math.max(last.get(key) ?? -1, battle.battleIndex))
  }
  return last
}

const trackKey = (campaignGroupId: string, type: string) =>
  `${campaignGroupId}:${type}`

/** Battles left on a track, the frontier node included; 0 once cleared. */
function trackBattlesLeft(
  key: string,
  context: Pick<CampaignGateContext, "lastIndexByKey" | "campaignProgressByKey">
): number {
  const last = context.lastIndexByKey.get(key)
  if (last === undefined) return 0
  const frontier =
    context.campaignProgressByKey.get(key)?.highestCompletedBattleIndex ?? 0
  return Math.max(0, last - frontier + 1)
}

/**
 * What stands between the player and a standing campaign beyond its own nodes: core heroes not
 * owned, the campaign it follows not cleared (`requiredCampaignGroupId`, from the datamine) and,
 * for Elite, a Power Level below the game's threshold. Shared by "Unlocks at" and Campaigns to
 * push so both measure the same distance.
 */
export function campaignTrackGate(
  campaignGroupId: CampaignId,
  context: CampaignGateContext
): CampaignTrackGate {
  const lockReasons: CampaignLockReason[] = []
  const missing = new Set<string>()
  let prerequisiteBattles = 0
  const visited = new Set<string>()

  let groupId: CampaignId | null = campaignGroupId
  let direct = true
  while (groupId && !visited.has(groupId)) {
    visited.add(groupId)
    const definition = context.definitionsByGroupId.get(groupId)
    if (!definition) break
    if (context.ownedUnitIds) {
      for (const unitId of definition.coreCharacters) {
        if (!context.ownedUnitIds.has(unitId)) missing.add(unitId)
      }
    }
    const required = definition.requiredCampaignGroupId
    if (!required) break
    const requiredType =
      context.definitionsByGroupId.get(required)?.types[0] ?? "Standard"
    const requiredKey = trackKey(required, requiredType)
    const left = trackBattlesLeft(requiredKey, context)
    if (left > 0) {
      prerequisiteBattles += left
      if (direct) {
        lockReasons.push({
          kind: "RequiredCampaignNotCleared",
          campaignGroupId: required,
          type: requiredType,
          battlesLeft: left,
        })
      }
    }
    direct = false
    groupId = required
  }

  if (missing.size > 0) {
    lockReasons.unshift({
      kind: "MissingCoreCharacters",
      unitIds: [...missing],
    })
  }
  if (
    context.isElite(campaignGroupId) &&
    context.powerLevel !== undefined &&
    context.eliteCampaignMinPowerLevel !== undefined &&
    context.powerLevel < context.eliteCampaignMinPowerLevel
  ) {
    lockReasons.push({
      kind: "PowerLevelTooLow",
      required: context.eliteCampaignMinPowerLevel,
      current: context.powerLevel,
    })
  }
  return { lockReasons, prerequisiteBattles }
}
