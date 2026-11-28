import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import { lockIcon } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type { HreMission, HreObjective } from "@/entities/hre-mission"
import { missionStatus } from "@/entities/hre-mission"
import { missionName } from "../model/mission-name"
import { ObjectiveGuidance } from "./objective-guidance"
import { ReserveTip } from "./reserve-tip"

/**
 * Every mission with both objectives. Each one expands to each objective's game hint and our tip,
 * then the tokens to keep for a later mission; done missions carry a check and locked ones a lock.
 * `current` null lists them read-only for a preview.
 */
export function MissionList({
  current,
  missions,
  objectiveText,
  objectiveIcon,
  objectiveHint,
}: {
  current: number | null
  missions: readonly HreMission[]
  objectiveText: (objective: HreObjective) => string
  /** The game glyph shown before each objective. */
  objectiveIcon?: (objective: HreObjective) => string | undefined
  /** The game's hint for an objective. */
  objectiveHint?: (objective: HreObjective) => string | undefined
}) {
  const { t } = useTranslation("hre")
  return (
    <ol className="grid gap-1.5" data-testid="hre-mission-list">
      {missions.map((mission) => {
        const status = missionStatus(mission.number, current)
        const testId = `hre-mission-${mission.number}`
        return (
          <li key={mission.number} data-status={status} data-testid={testId}>
            <details
              className={cn(
                "group rounded-lg border px-3 py-2",
                status === "current" && "border-primary",
                status === "done" && "opacity-70"
              )}
            >
              <summary className="flex cursor-pointer list-none items-start gap-2">
                <span className="w-22 shrink-0 text-sm font-medium whitespace-nowrap">
                  {missionName(t, mission.number, missions)}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  {mission.objectives.map((objective) => (
                    <span
                      key={objective.kind}
                      className="flex items-center gap-1.5"
                    >
                      <EntityIcon
                        size="icon"
                        alt=""
                        className="shrink-0"
                        src={objectiveIcon?.(objective)}
                      />
                      {objectiveText(objective)}
                    </span>
                  ))}
                </span>
                {status === "done" ? (
                  <Check
                    aria-label={t("tracker.done")}
                    className="size-icon shrink-0 text-primary"
                    role="img"
                  />
                ) : status === "locked" ? (
                  <EntityIcon
                    size="icon"
                    alt={t("tracker.locked")}
                    className="shrink-0"
                    src={lockIcon()}
                  />
                ) : null}
              </summary>
              <div className="mt-2 space-y-2 pl-24">
                {mission.objectives.map((objective, index) => (
                  <ObjectiveGuidance
                    hint={objectiveHint?.(objective)}
                    key={index}
                    objective={objective}
                    testId={`${testId}-guidance-${index}`}
                  />
                ))}
                <ReserveTip
                  missionNumber={mission.number}
                  missions={missions}
                  testId={`${testId}-reserve`}
                />
              </div>
            </details>
          </li>
        )
      })}
    </ol>
  )
}
