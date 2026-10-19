import { CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Progress } from "@workspace/ui/components/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  HRE_MISSIONS,
  hreMission,
  type HreObjective,
} from "../model/hre-missions"
import { isMissionComplete, type HreProgress } from "../model/hre-progress"
import type { HreProgressActions } from "../model/use-hre-progress"
import { missionName } from "./mission-name"
import { ObjectiveTips } from "./objective-tips"

/**
 * The current mission: the mission picker, each objective with its progress input (clamped to the
 * target) and bar, the objectives' tips, and "Mission complete" once both are at target.
 */
export function CurrentMissionCard({
  state,
  actions,
  objectiveText,
}: {
  state: HreProgress
  actions: HreProgressActions
  objectiveText: (objective: HreObjective) => string
}) {
  const { t, i18n } = useTranslation("hre")
  const mission = hreMission(state.mission)
  const complete = isMissionComplete(state)

  return (
    <Card data-testid="hre-current-mission">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{t("tracker.current")}</CardTitle>
        <Select
          onValueChange={(value) => actions.setMission(Number(value))}
          value={String(state.mission)}
        >
          <SelectTrigger
            aria-label={t("tracker.pick")}
            className="w-36"
            data-testid="hre-mission-picker"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HRE_MISSIONS.map((item) => (
              <SelectItem key={item.number} value={String(item.number)}>
                {missionName(t, item.number)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {mission.objectives.map((objective, index) => {
          const value = state.progress[index]!
          const done = value >= objective.target
          const testId = `hre-objective-${index}`
          return (
            <div key={index} className="space-y-1.5" data-testid={testId}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">
                  {objectiveText(objective)}
                </p>
                {done ? (
                  <CheckCircle2
                    aria-label={t("tracker.objectiveDone")}
                    className="size-4 shrink-0 text-primary"
                    data-testid={`${testId}-done`}
                    role="img"
                  />
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  aria-label={t("tracker.progressLabel", {
                    objective: objectiveText(objective),
                  })}
                  className="w-28 tabular-nums"
                  data-testid={`${testId}-input`}
                  inputMode="numeric"
                  max={objective.target}
                  min={0}
                  onChange={(event) =>
                    actions.setObjectiveProgress(
                      index as 0 | 1,
                      Number.parseInt(event.target.value, 10) || 0
                    )
                  }
                  type="number"
                  value={value}
                />
                <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                  {t("tracker.ofTarget", {
                    target: objective.target.toLocaleString(i18n.language),
                  })}
                </span>
              </div>
              <Progress value={(value / objective.target) * 100} />
            </div>
          )
        })}
        <ObjectiveTips
          objectives={mission.objectives}
          testId="hre-current-tips"
        />
        <Button
          data-testid="hre-mission-complete"
          disabled={!complete}
          onClick={actions.completeMission}
        >
          {t("tracker.complete")}
        </Button>
      </CardContent>
    </Card>
  )
}
