import { Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"

import { nextOnslaughtMission, nextTokenReserve } from "@/entities/hre-mission"
import type { HreMission } from "@/entities/hre-mission"
import { missionName } from "./mission-name"

function Tip({ text, testId }: { text: string; testId: string }) {
  return (
    <p
      className="flex gap-2 text-xs text-muted-foreground"
      data-testid={testId}
    >
      <Lightbulb aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>{text}</span>
    </p>
  )
}

/**
 * The tokens to keep for the first later mission with a token objective ("Keep 4 Arena tokens for
 * Mission 10"); nothing after the last token mission. On a mission Onslaught pays off little for,
 * also the later mission to keep Onslaught tokens for (`nextOnslaughtMission`). Each objective's own
 * tip is in its guidance.
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
  const onslaught = nextOnslaughtMission(missionNumber, missions)
  if (!reserve && onslaught === null) return null
  return (
    <>
      {reserve ? (
        <Tip
          testId={testId}
          text={t("tips.reserve", {
            count: reserve.tokens,
            mode: t(`tokens.modes.${reserve.mode}`),
            mission: missionName(t, reserve.missionNumber, missions),
          })}
        />
      ) : null}
      {onslaught === null ? null : (
        <Tip
          testId={`${testId}-onslaught`}
          text={t("tips.saveOnslaught", {
            mode: t("tokens.modes.onslaught"),
            mission: missionName(t, onslaught, missions),
          })}
        />
      )}
    </>
  )
}
