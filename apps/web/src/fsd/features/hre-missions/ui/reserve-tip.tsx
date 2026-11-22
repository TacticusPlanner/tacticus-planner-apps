import { Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"

import { nextTokenReserve } from "@/entities/hre-mission"
import type { HreMission } from "@/entities/hre-mission"
import { missionName } from "./mission-name"

/**
 * The tokens to keep for the first later mission with a token objective ("Keep 4 Arena tokens for
 * Mission 10"); nothing after the last token mission. Each objective's own tip is in its guidance.
 */
export function ReserveTip({
  missionNumber,
  missions,
  testId,
}: {
  missionNumber: number
  missions: readonly HreMission[]
  testId: string
}) {
  const { t } = useTranslation("hre")
  const reserve = nextTokenReserve(missionNumber, missions)
  if (!reserve) return null
  return (
    <p
      className="flex gap-2 text-xs text-muted-foreground"
      data-testid={testId}
    >
      <Lightbulb aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>
        {t("tips.reserve", {
          count: reserve.tokens,
          mode: t(`tokens.modes.${reserve.mode}`),
          mission: missionName(t, reserve.missionNumber, missions),
        })}
      </span>
    </p>
  )
}
