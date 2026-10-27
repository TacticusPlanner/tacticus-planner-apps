// Type-only: the catalog's HSE values pull in zod, and this module is on the Today and Home raids
// path. Reading the rule from `config.hse` lives in `home-screen-event-raid-rule.ts`.
import type {
  GameCatalogHseRestriction,
  GameCatalogHseTracker,
  GameCatalogHseUnitFilter,
} from "@workspace/game-catalog"

/** What a rule reads of an npc record (the catalog `npcs` dataset). */
export type RuleNpc = {
  factionId: string
  alliance: string
  traits: readonly string[]
}

/** What the points calculation reads of a campaign battle. */
export type RuleBattle = {
  type: string
  campaignGroupId: string
  detailedEnemyTypes: readonly { id: string; count: number }[]
}

/**
 * The raid-point rule of a Home Screen Event occurrence: the `KillUnits` trackers of its served
 * `config.hse` variant that score in a campaign mode and do not depend on the deployed team.
 */
export type HseRaidRule = {
  trackers: readonly GameCatalogHseTracker[]
}

export const CAMPAIGN_GAME_MODES = [
  "Campaign",
  "MirrorCampaign",
  "EliteCampaign",
  "MirrorEliteCampaign",
  "CampaignEvent",
]

const CAMPAIGN_GAME_MODE_BY_TYPE: Readonly<Record<string, string>> = {
  Standard: "Campaign",
  Mirror: "MirrorCampaign",
  Elite: "EliteCampaign",
  EliteMirror: "MirrorEliteCampaign",
}

/**
 * The catalog game mode a raid of `battle` plays: `CampaignEvent` for every node of an event campaign
 * (Extremis nodes only exist there), else the mode of its campaign type. Null for an unknown type.
 */
export function campaignBattleGameMode(
  battle: Pick<RuleBattle, "type" | "campaignGroupId">,
  eventGroupIds: ReadonlySet<string>
): string | null {
  if (eventGroupIds.has(battle.campaignGroupId) || battle.type === "Extremis")
    return "CampaignEvent"
  return CAMPAIGN_GAME_MODE_BY_TYPE[battle.type] ?? null
}

/** The group ids of the event campaigns, whose nodes score as `CampaignEvent`. */
export function eventCampaignGroupIds(
  definitions: readonly { groupId: string; releaseType?: string | null }[]
): ReadonlySet<string> {
  return new Set(
    definitions
      .filter((definition) => definition.releaseType === "event")
      .map((definition) => definition.groupId)
  )
}

/** True when `value` passes the restriction (null passes everything), as the catalog's own check. */
export function restrictionPasses(
  restriction: GameCatalogHseRestriction | null,
  value: string
): boolean {
  return restrictionPassesAny(restriction, [value])
}

/** True when any of `values` is allowed and none is disallowed (null passes everything). */
function restrictionPassesAny(
  restriction: GameCatalogHseRestriction | null,
  values: readonly string[]
): boolean {
  if (!restriction) return true
  if (values.some((value) => restriction.disallowed?.includes(value)))
    return false
  return restriction.allowed
    ? values.some((value) => restriction.allowed!.includes(value))
    : true
}

/** `tags` match the npc's traits or its alliance, `factionIds` its faction, `unitIds` its id. */
function enemyMatches(
  filter: GameCatalogHseUnitFilter | null,
  id: string,
  npc: RuleNpc
): boolean {
  if (!filter) return true
  if (filter.unitIds && !filter.unitIds.includes(id)) return false
  return (
    restrictionPassesAny(filter.tags, [...npc.traits, npc.alliance]) &&
    restrictionPasses(filter.factionIds, npc.factionId)
  )
}

/**
 * Points one raid of `battle` earns under the rule: each tracker that scores the battle's game mode
 * adds its points per enemy its filter matches (the served trackers exclude Summon and Steppable
 * enemies themselves). An enemy id the `npcs` dataset cannot resolve counts as zero (never guessed).
 */
export function battleEventPoints(
  rule: HseRaidRule | null,
  battle: RuleBattle,
  npcsById: ReadonlyMap<string, RuleNpc>,
  eventGroupIds: ReadonlySet<string>
): number {
  if (!rule) return 0
  const gameMode = campaignBattleGameMode(battle, eventGroupIds)
  if (!gameMode) return 0
  const trackers = rule.trackers.filter((tracker) =>
    restrictionPasses(tracker.gameModes, gameMode)
  )
  let points = 0
  for (const enemy of battle.detailedEnemyTypes) {
    const npc = npcsById.get(enemy.id)
    if (!npc) continue
    for (const tracker of trackers) {
      if (enemyMatches(tracker.enemy, enemy.id, npc))
        points += tracker.points * enemy.count
    }
  }
  return points
}
