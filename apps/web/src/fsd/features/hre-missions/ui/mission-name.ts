import type { TFunction } from "i18next"

import { HRE_BONUS_MISSION } from "../model/hre-missions"

/** "Mission 5", or "Bonus" for mission 21. */
export function missionName(t: TFunction<"hre">, number: number): string {
  return number === HRE_BONUS_MISSION
    ? t("missions.bonus")
    : t("missions.number", { number })
}
