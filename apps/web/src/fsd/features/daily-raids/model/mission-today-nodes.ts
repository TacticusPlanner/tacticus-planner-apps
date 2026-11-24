import type { BattleId } from "@workspace/game-domain"

import type { MissionRaidsRequest } from "./mission-raids"

/** The most energy a raid may cost for the node to count as cheap: 5 and 6 energy nodes. */
const CHEAP_NODE_ENERGY = 6

/** Today's node rules for the current HRE mission (`calculateDailyRaids`'s `missionToday`). */
export type MissionTodayNodes = {
  nodeFilter?: (battleId: BattleId) => boolean
  preferredBattleIds?: ReadonlySet<BattleId>
}

/**
 * How the HRE tab narrows Today's run for the current mission, like a quick filter (Severyn,
 * 2026-11): for lightning victories only event-campaign nodes count, so only they are raided; for
 * campaign wins and raids any node counts, so each material is farmed at a cheap node (5 or 6
 * energy) when one drops it, for more battles per energy, or at the running campaign event's node
 * with "CE nodes first" on. Battles fought by hand for the manual objectives start from the same
 * run. None without battles to go or a manual objective.
 */
export function missionTodayNodes(
  request: MissionRaidsRequest | undefined,
  battles: readonly {
    id: string
    campaignGroupId: string
    energyCost: number
  }[],
  eventGroupIds: ReadonlySet<string>,
  ceNodesFirst?: ReadonlySet<BattleId>
): MissionTodayNodes | undefined {
  if (!request || (request.battlesToGo <= 0 && !request.manual))
    return undefined
  if (request.eventOnly) {
    const eventIds = new Set(
      battles
        .filter((battle) => eventGroupIds.has(battle.campaignGroupId))
        .map((battle) => battle.id)
    )
    return { nodeFilter: (battleId) => eventIds.has(battleId) }
  }
  if (ceNodesFirst) return { preferredBattleIds: ceNodesFirst }
  return {
    preferredBattleIds: new Set(
      battles
        .filter(
          (battle) =>
            battle.energyCost > 0 && battle.energyCost <= CHEAP_NODE_ENERGY
        )
        .map((battle) => battle.id as BattleId)
    ),
  }
}
