import type { TFunction } from "i18next"

import type { HreMission } from "../model/hre-missions"

/** "Mission 5", or "Bonus" for the Bonus mission. */
export function missionName(
  t: TFunction<"hre">,
  number: number,
  missions: readonly Pick<HreMission, "number" | "bonus">[]
): string {
  return missions.some((mission) => mission.number === number && mission.bonus)
    ? t("missions.bonus")
    : t("missions.number", { number })
}
