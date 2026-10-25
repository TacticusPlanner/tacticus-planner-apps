import { useTranslation } from "react-i18next"

import {
  isKnownObjectiveType,
  objectiveTraitId,
} from "../model/quest-objectives"

export type Objective = { type: string; target?: string | null; score: number }

/** One objective's localized wording, or its raw type when the tab does not know it. */
export function useObjectiveWording() {
  const { t } = useTranslation(["quest", "traits", "factions", "damageTypes"])
  return (objective: Objective): string => {
    const target = objective.target ?? ""
    if (!isKnownObjectiveType(objective.type)) return objective.type
    return t(`quest:objectives.${objective.type}` as never, {
      trait: t(`traits:${objectiveTraitId(target)}` as never, {
        defaultValue: target,
      }),
      faction: t(`factions:${target}` as never, { defaultValue: target }),
      damageType: t(`damageTypes:${target}` as never, { defaultValue: target }),
      count: Number(target) || 0,
    })
  }
}
