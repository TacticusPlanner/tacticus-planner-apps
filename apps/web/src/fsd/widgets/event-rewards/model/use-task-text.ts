import { useTranslation } from "react-i18next"
import type { GameCatalogEventShopTask } from "@workspace/game-catalog"

import { fillGameText } from "../lib/event-mission-text"

import { numberFormat } from "@/shared/lib"

/** A task's game text with its target and parameters filled in, or with the target left out. */
export function useTaskText() {
  const { i18n } = useTranslation("eventMissions")
  const read = (key: string): string | undefined => {
    const value: unknown =
      i18n.getResource(i18n.language, "eventMissions", key) ??
      i18n.getResource("en", "eventMissions", key)
    return typeof value === "string" ? value : undefined
  }
  const gameMode = (mode: string) => read(`gameModes.${mode}`) ?? mode
  const values = (task: GameCatalogEventShopTask) => {
    const parameters = task.parameters ?? {}
    const modes = parameters.gameModes
    const filled: Record<string, string> = {}
    if (typeof parameters.gameMode === "string") {
      filled.GAME_MODE = gameMode(parameters.gameMode)
    }
    if (modes !== undefined) {
      filled.GAME_MODES = (Array.isArray(modes) ? modes : [modes])
        .map(gameMode)
        .join(", ")
    }
    if (typeof parameters.factionTrait === "string") {
      filled.FACTION_TRAIT = parameters.factionTrait
    }
    return filled
  }
  const template = (task: GameCatalogEventShopTask) =>
    read(`tasks.${task.taskId}`) ?? task.taskId
  return {
    task: (task: GameCatalogEventShopTask) =>
      fillGameText(
        template(task),
        {
          ...values(task),
          TARGET_AMOUNT: numberFormat(i18n.language).format(task.target),
        },
        task.target
      ),
    /** "Deal Damage using Abilities": the chain's task without one mission's target. */
    taskName: (task: GameCatalogEventShopTask) =>
      fillGameText(template(task), { ...values(task), TARGET_AMOUNT: "" }, 2)
        .replaceAll(/\s{2,}/g, " ")
        .trim(),
  }
}
