import { useTranslation } from "react-i18next"

import {
  isKnownObjectiveType,
  objectiveTraitId,
} from "../model/quest-objectives"

export type Objective = { type: string; target?: string | null; score: number }

/** One objective's localized wording, or its raw type when the tab does not know it; `reason` words
 *  why the featured hero fails a restriction ("Nubari has Flying"). */
export function useObjectiveWording() {
  const { t } = useTranslation(["quest", "traits", "factions", "damageTypes"])
  const values = (objective: Objective) => {
    const target = objective.target ?? ""
    return {
      trait: t(`traits:${objectiveTraitId(target)}` as never, {
        defaultValue: target,
      }),
      faction: t(`factions:${target}` as never, { defaultValue: target }),
      damageType: t(`damageTypes:${target}` as never, { defaultValue: target }),
      count: Number(target) || 0,
    }
  }
  const word = (objective: Objective): string =>
    isKnownObjectiveType(objective.type)
      ? t(`quest:objectives.${objective.type}` as never, values(objective))
      : objective.type
  const reason = (objective: Objective, hero: string): string =>
    t(`quest:team.unreachable.${objective.type}` as never, {
      ...values(objective),
      hero,
      defaultValue: hero,
    })
  return Object.assign(word, { reason })
}
