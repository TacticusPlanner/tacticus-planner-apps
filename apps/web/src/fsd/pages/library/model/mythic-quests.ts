/**
 * A character's mythic quests, ported from V1 (`4-entities/mythic_quests`). The data ships as the
 * English game-text namespaces `mythicQuests` (character id -> quests) and `mythicQuestTasks` (task
 * loca key -> template with `{[VAR]}` tokens and i2p plurals, rendered by the ability-text renderer).
 */
export type MythicQuestTaskData = {
  locaKey: string
  target: number
  taskParameters: Record<string, string>
}

export type MythicQuestData = {
  number: number
  rewards: string[]
  tasks: MythicQuestTaskData[]
}

export type MythicQuestReward =
  | { kind: "mythicShards"; unitId: string; quantity?: number }
  | {
      kind: "ascensionOrb" | "abilityBadge"
      alliance: string
      quantity?: number
    }
  | { kind: "xp" | "gold"; quantity?: number }
  | { kind: "equipment"; equipmentId: string; quantity?: number }
  | { kind: "unknown"; raw: string; quantity?: number }

const ALLIANCE = "(Imperial|Chaos|Xenos)"

/** Parses "mythicShards_blackAbaddon:4", "gold:250000", a bare equipment id "I_Crit_M006", … (V1's
 *  `parseMythicQuestReward`, without the display strings, which the page localizes). */
export function parseMythicQuestReward(reward: string): MythicQuestReward {
  const colon = reward.indexOf(":")
  const type = colon === -1 ? reward : reward.slice(0, colon)
  const quantity =
    colon === -1 ? undefined : Number.parseInt(reward.slice(colon + 1), 10)

  const shard = /^mythicShards_(.+)$/.exec(type)
  if (shard) return { kind: "mythicShards", unitId: shard[1], quantity }
  const orb = new RegExp(`^heroAscensionOrbMythic_${ALLIANCE}$`).exec(type)
  if (orb) return { kind: "ascensionOrb", alliance: orb[1], quantity }
  const badge = new RegExp(`^abilityTokenMythic_${ALLIANCE}$`).exec(type)
  if (badge) return { kind: "abilityBadge", alliance: badge[1], quantity }
  if (type === "xpMythic") return { kind: "xp", quantity }
  if (type === "gold") return { kind: "gold", quantity }
  if (type.startsWith("I_") || type.startsWith("R_")) {
    return { kind: "equipment", equipmentId: type, quantity }
  }
  return { kind: "unknown", raw: type, quantity }
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
  for (const [key, value] of Object.entries(task.taskParameters)) {
    if (key === "heroId") variables.HERO_NAME = [nameOf(value)]
    else variables[toPlaceholder(key)] = [labelOf(key, value)]
  }
  return variables
}
