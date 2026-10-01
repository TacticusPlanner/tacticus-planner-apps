import type {
  CampaignBattleStorageModel,
  CampaignDefinitionStorageModel,
} from "@workspace/game-catalog"

import { battleEnemyTraits } from "../battle-enemy-traits"
import type { RuleNpc } from "../home-screen-event-rules"
import type {
  RaidsCampaignType,
  RaidsFilterBattle,
} from "./raids-filters.domain"

/** Indomitus, the campaign whose cheap opening nodes V1 calls Early / SuperEarly. */
const INDOMITUS_GROUP_ID = "campaign1"
const EARLY_ENERGY_COST = 5

/**
 * The one V1 campaign-type option a V2 battle belongs to, or `null` when it belongs to none
 * (Indomitus nodes below 5 energy, V1's "SuperEarly", which have no raid rewards). `releaseType` is
 * the battle's campaign group's (`standard` | `event`).
 */
export function raidsCampaignTypeOf(
  battle: { type: string; campaignGroupId: string; energyCost: number },
  releaseType: string | undefined
): RaidsCampaignType | null {
  switch (battle.type) {
    case "Elite":
    case "EliteMirror":
      return "Elite"
    case "Mirror":
      return "Mirror"
    case "Extremis":
      return "Extremis"
    case "Standard":
      if (releaseType === "event") return "Standard"
      if (battle.campaignGroupId === INDOMITUS_GROUP_ID) {
        if (battle.energyCost < EARLY_ENERGY_COST) return null
        if (battle.energyCost === EARLY_ENERGY_COST) return "Early"
      }
      return "Normal"
    default:
      return null
  }
}

/**
 * Every catalog battle as the filter matcher reads it, keyed by battle id. `npcsById` resolves the
 * enemy traits; while it is still loading (undefined) battles carry no traits.
 */
export function buildRaidsFilterBattles(
  battles: readonly CampaignBattleStorageModel[],
  definitions: readonly CampaignDefinitionStorageModel[],
  npcsById?: ReadonlyMap<string, Pick<RuleNpc, "traits">>
): Map<string, RaidsFilterBattle> {
  const releaseTypeByGroup = new Map(
    definitions.map((definition) => [
      definition.groupId,
      definition.releaseType,
    ])
  )
  return new Map(
    battles.map((battle) => [
      battle.id,
      {
        slots: battle.slots,
        alliesAlliance: battle.alliesAlliance,
        alliesFactions: battle.alliesFactions,
        enemiesAlliances: battle.enemiesAlliances,
        enemiesFactions: battle.enemiesFactions,
        enemiesTraits: npcsById ? battleEnemyTraits(battle, npcsById) : [],
        enemiesTotal: battle.enemiesTotal,
        enemiesTypes: battle.enemiesTypes,
        campaignType: raidsCampaignTypeOf(
          battle,
          releaseTypeByGroup.get(battle.campaignGroupId)
        ),
      },
    ])
  )
}
