import type {
  GameCatalogMythicQuest,
  GameCatalogMythicQuestReward,
} from "@workspace/game-catalog"

/**
 * A character's mythic quests, served by the game catalog's `mythic-quests` dataset (ported from V1's
 * `4-entities/mythic_quests`). Task text comes from the English game-text namespace `mythicQuestTasks`
 * (task loca key -> template with `{[VAR]}` tokens and i2p plurals, rendered by the ability-text renderer).
 */
export type MythicQuestData = GameCatalogMythicQuest

export type MythicQuestTaskData = MythicQuestData["tasks"][number]

export type MythicQuestReward =
  | { kind: "mythicShards"; unitId: string; quantity: number }
  | {
      kind: "ascensionOrb" | "abilityBadge"
      alliance: string
      quantity: number
    }
  | { kind: "xp" | "gold"; quantity: number }
  | { kind: "equipment"; equipmentId: string; quantity: number }

/** The reward chip's view of a served reward record (the catalog's set of reward types is closed). */
export function mythicQuestReward(
  reward: GameCatalogMythicQuestReward
): MythicQuestReward {
  switch (reward.type) {
    case "MythicShards":
      return {
        kind: "mythicShards",
        unitId: reward.unitId,
        quantity: reward.amount,
      }
    case "AscensionOrb":
      return {
        kind: "ascensionOrb",
        alliance: reward.alliance,
        quantity: reward.amount,
      }
    case "AbilityBadge":
      return {
        kind: "abilityBadge",
        alliance: reward.alliance,
        quantity: reward.amount,
      }
    case "XpBook":
      return { kind: "xp", quantity: reward.amount }
    case "Gold":
      return { kind: "gold", quantity: reward.amount }
    case "Equipment":
      return {
        kind: "equipment",
        equipmentId: reward.equipmentId,
        quantity: reward.amount,
      }
  }
}

/** `damageProfileType` -> `DAMAGE_PROFILE_TYPE`, the template's placeholder form. */
function toPlaceholder(key: string): string {
  return key.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()
}

/**
 * The template variables for one task, as V1 builds them: `TARGET_AMOUNT` from the target, one
 * placeholder per task parameter, and `HERO_NAME` from `heroId` (named by `nameOf`, usually the
 * character itself, sometimes a summoned unit). Traits and damage types go through `labelOf` so
 * they read as the rest of the page does.
 */
export function mythicTaskVariables(
  task: MythicQuestTaskData,
  nameOf: (unitId: string) => string,
  labelOf: (key: string, value: string) => string
): Record<string, (string | number)[]> {
  const variables: Record<string, (string | number)[]> = {
    TARGET_AMOUNT: [task.target],
  }
  for (const [key, value] of Object.entries(task.parameters)) {
    if (key === "heroId") variables.HERO_NAME = [nameOf(value)]
    else variables[toPlaceholder(key)] = [labelOf(key, value)]
  }
  return variables
}
