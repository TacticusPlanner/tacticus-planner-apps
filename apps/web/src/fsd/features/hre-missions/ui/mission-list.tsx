import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"
import { lockIcon } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import type { HreMission, HreObjective } from "../model/hre-missions"
import { missionStatus } from "../model/hre-progress"
import { missionName } from "./mission-name"
import { ObjectiveTips } from "./objective-tips"

/**
 * Every mission with both objectives. Each one expands to its tips; done missions carry a check and
 * locked ones a lock. `current` null lists them read-only for a preview.
 */
export function MissionList({
  current,
  missions,
  objectiveText,
  objectiveIcon,
}: {
  current: number | null
  missions: readonly HreMission[]
  objectiveText: (objective: HreObjective) => string
  /** The game glyph shown before each objective. */
  objectiveIcon?: (objective: HreObjective) => string | undefined
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
                        alt=""
                        className="size-4 shrink-0"
                        src={objectiveIcon?.(objective)}
                      />
                      {objectiveText(objective)}
                    </span>
                  ))}
                </span>
                {status === "done" ? (
                  <Check
                    aria-label={t("tracker.done")}
                    className="size-4 shrink-0 text-primary"
                    role="img"
                  />
                ) : status === "locked" ? (
                  <EntityIcon
                    alt={t("tracker.locked")}
                    className="size-4 shrink-0"
                    src={lockIcon()}
                  />
                ) : null}
              </summary>
              <div className="mt-2 pl-24">
                <ObjectiveTips
                  missionNumber={mission.number}
                  missions={missions}
                  objectives={mission.objectives}
                  testId={`${testId}-tips`}
                />
              </div>
            </details>
          </li>
        )
      })}
    </ol>
  )
}
