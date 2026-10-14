import { useTranslation } from "react-i18next"
import {
  abilityBadgeIcon,
  equipmentSlotIcon,
  goldIcon,
  orbIcon,
  shardIcon,
  xpBookIcon,
  type EquipmentStorageModel,
} from "@workspace/game-catalog"

import { AbilityText } from "@/shared/ability-text"
import { EntityIcon } from "@/shared/ui"

import {
  mythicTaskVariables,
  parseMythicQuestReward,
  type MythicQuestData,
  type MythicQuestReward,
} from "../../model/mythic-quests"

function RewardChip({
  reward,
  equipment,
}: {
  reward: MythicQuestReward
  equipment: readonly EquipmentStorageModel[]
}) {
  const { t } = useTranslation(["library", "characters", "equipmentItems"])
  let icon: string | undefined
  let label: string
  switch (reward.kind) {
    case "mythicShards":
      icon = shardIcon("Mythic")
      label = t("characterUnit.mythic.rewards.mythicShards", {
        name: t(`characters:${reward.unitId}`, { defaultValue: reward.unitId }),
      })
      break
    case "ascensionOrb":
      icon = orbIcon("Mythic")
      label = t("characterUnit.mythic.rewards.ascensionOrb", {
        alliance: t(`npcs.alliances.${reward.alliance}`, {
          defaultValue: reward.alliance,
        }),
      })
      break
    case "abilityBadge":
      icon = abilityBadgeIcon("Mythic", reward.alliance)
      label = t("characterUnit.mythic.rewards.abilityBadge", {
        alliance: t(`npcs.alliances.${reward.alliance}`, {
          defaultValue: reward.alliance,
        }),
      })
      break
    case "xp":
      icon = xpBookIcon("Mythic")
      label = t("characterUnit.mythic.rewards.xp")
      break
    case "gold":
      icon = goldIcon()
      label = t("characterUnit.mythic.rewards.gold")
      break
    case "equipment": {
      const item = equipment.find((entry) => entry.id === reward.equipmentId)
      icon = item ? equipmentSlotIcon(item.type) : undefined
      label = t(`equipmentItems:${reward.equipmentId}`, {
        defaultValue: item?.name ?? reward.equipmentId,
      })
      break
    }
    default:
      label = reward.raw
  }
  const format = new Intl.NumberFormat()
  return (
    <li className="inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-semibold">
      {icon ? <EntityIcon src={icon} alt="" className="size-4" /> : null}
      {reward.quantity !== undefined
        ? `${format.format(reward.quantity)} × ${label}`
        : label}
    </li>
  )
}

/**
 * Up to five quest rows: number badge, task text (V1's templates with the task's values), and
 * reward chips. Not rendered for a character without quest data.
 */
export function MythicQuestsList({
  quests,
  template,
  unitName,
  nameOf,
  equipment,
}: {
  quests: readonly MythicQuestData[]
  template: (locaKey: string) => string | undefined
  unitName: string
  nameOf: (unitId: string) => string
  equipment: readonly EquipmentStorageModel[]
}) {
  const { t } = useTranslation(["traits", "damageTypes"])
  const labelOf = (key: string, value: string) => {
    if (key === "trait") return t(`traits:${value}`, { defaultValue: value })
    if (key === "damageProfileType")
      return t(`damageTypes:${value}`, { defaultValue: value })
    return value
  }

  return (
    <ol
      className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-x-6"
      data-testid="unit-mythic-quests"
    >
      {quests.map((quest) => (
        <li
          key={quest.number}
          className="flex gap-3 border-t py-3"
          data-testid={`unit-mythic-quest-${quest.number}`}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
            {quest.number}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            {quest.tasks.map((task, index) => {
              const text = template(task.locaKey)
              return text ? (
                <AbilityText
                  key={index}
                  text={text}
                  level={1}
                  variables={mythicTaskVariables(task, nameOf, labelOf)}
                  rarity="Mythic"
                  unitName={unitName}
                  className="text-sm leading-[1.45]"
                />
              ) : null
            })}
            <ul className="flex flex-wrap gap-1.5">
              {quest.rewards.map((reward) => (
                <RewardChip
                  key={reward}
                  reward={parseMythicQuestReward(reward)}
                  equipment={equipment}
                />
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  )
}
