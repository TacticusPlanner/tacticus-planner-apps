import type { ReactNode } from "react"
import { Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  HRE_OBJECTIVE_KINDS,
  type HreMission,
  type HreObjective,
  type HreObjectiveKind,
} from "../model/hre-missions"
import { isTokenObjective, nextTokenReserve } from "../model/hre-objectives"
import { missionName } from "./mission-name"

type TipKind = Exclude<
  HreObjectiveKind,
  "arenaBattles" | "guildRaids" | "onslaught" | "salvageRuns"
>

const hasTip = (kind: HreObjectiveKind): kind is TipKind =>
  HRE_OBJECTIVE_KINDS.includes(kind) && !isTokenObjective(kind)

/**
 * One static strategy tip per objective kind (which units help, never where to play: the
 * suggestions say that), then the tokens to keep for the next token mission after this one. A token
 * objective gets no tip of its own; an unknown kind shows none.
 */
export function ObjectiveTips({
  missionNumber,
  missions,
  objectives,
  testId,
}: {
  missionNumber: number
  missions: readonly HreMission[]
  objectives: readonly HreObjective[]
  testId: string
}) {
  const { t } = useTranslation("hre")
  const kinds = [
    ...new Set(objectives.map((objective) => objective.kind).filter(hasTip)),
  ]
  const reserve = nextTokenReserve(missionNumber, missions)
  if (kinds.length === 0 && !reserve) return null
  return (
    <ul className="space-y-1" data-testid={testId}>
      {kinds.map((kind) => (
        <Tip key={kind} testId={`${testId}-${kind}`}>
          {t(`tips.${kind}`)}
        </Tip>
      ))}
      {reserve ? (
        <Tip testId={`${testId}-reserve`}>
          {t("tips.reserve", {
            count: reserve.tokens,
            mode: t(`tokens.modes.${reserve.mode}`),
            mission: missionName(t, reserve.missionNumber, missions),
          })}
        </Tip>
      ) : null}
    </ul>
  )
}

function Tip({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <li
      className="flex gap-2 text-xs text-muted-foreground"
      data-testid={testId}
    >
      <Lightbulb aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </li>
  )
}
