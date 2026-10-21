import type { BattleId } from "@workspace/game-domain"

import type { MissionDeploy } from "./mission-raids"

/** The by-hand battles that one team can fight: the nodes whose campaigns allow the same factions. */
export type MissionDeployGroup = {
  factions: readonly string[]
  /** The most deployment slots among the group's nodes: the team's size. */
  slots: number
  /** The fewest deployment slots among the group's nodes: those take the team's first units. */
  fewestSlots: number
  /** The campaign names of the group's nodes, in list order. */
  campaigns: string[]
}

/**
 * Groups the battles to fight by hand by the allied factions their campaign lets you deploy, in
 * list order, so each group gets a team that can play every node in it. Rows without deployment
 * rules are left out.
 */
export function missionDeployGroups(
  rows: readonly { battleId: BattleId; deploy?: MissionDeploy }[],
  campaignName: (battleId: BattleId) => string | undefined
): MissionDeployGroup[] {
  const groups = new Map<string, MissionDeployGroup>()
  for (const row of rows) {
    if (!row.deploy) continue
    const factions = [...row.deploy.factions].sort()
    const key = factions.join("|")
    const group = groups.get(key) ?? {
      factions,
      slots: 0,
      fewestSlots: row.deploy.slots,
      campaigns: [],
    }
    group.slots = Math.max(group.slots, row.deploy.slots)
    group.fewestSlots = Math.min(group.fewestSlots, row.deploy.slots)
    const name = campaignName(row.battleId)
    if (name && !group.campaigns.includes(name)) group.campaigns.push(name)
    groups.set(key, group)
  }
  return [...groups.values()]
}
