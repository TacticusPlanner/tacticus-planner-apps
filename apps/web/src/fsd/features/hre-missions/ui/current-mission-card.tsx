import { CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
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

/** "+1" on every open objective, plus "+10" from a target of 20. */
const steps = (target: number) => (target >= 20 ? [1, 10] : [1])

/**
 * The current mission: the mission picker, each objective with its progress input (clamped to the
 * target, empty rather than a leading 0 so typing never reads "033"), "+1" (and "+10"), a one-click
 * "Mark done" and its bar, the objectives' tips, and "Mission complete" once both are at target,
 * followed by an Undo toast.
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
              <div className="flex flex-wrap items-center gap-2">
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
                  onFocus={(event) => event.target.select()}
                  placeholder="0"
                  type="number"
                  value={value > 0 ? value : ""}
                />
                <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                  {t("tracker.ofTarget", {
                    target: objective.target.toLocaleString(i18n.language),
                  })}
                </span>
                {done ? null : (
                  <div className="ml-auto flex gap-2">
                    {steps(objective.target).map((step) => (
                      <Button
                        aria-label={t("tracker.addLabel", {
                          amount: step,
                          objective: objectiveText(objective),
                        })}
                        data-testid={`${testId}-plus-${step}`}
                        key={step}
                        onClick={() =>
                          actions.setObjectiveProgress(
                            index as 0 | 1,
                            value + step
                          )
                        }
                        size="sm"
                        variant="outline"
                      >
                        {t("tracker.add", { amount: step })}
                      </Button>
                    ))}
                    <Button
                      aria-label={t("tracker.markDoneLabel", {
                        objective: objectiveText(objective),
                      })}
                      data-testid={`${testId}-mark-done`}
                      onClick={() =>
                        actions.setObjectiveProgress(
                          index as 0 | 1,
                          objective.target
                        )
                      }
                      size="sm"
                      variant="outline"
                    >
                      {t("tracker.markDone")}
                    </Button>
                  </div>
                )}
              </div>
              <Progress value={(value / objective.target) * 100} />
            </div>
          )
        })}
        <ObjectiveTips
          missionNumber={mission.number}
          objectives={mission.objectives}
          testId="hre-current-tips"
        />
        <Button
          data-testid="hre-mission-complete"
          disabled={!complete}
          onClick={() => {
            // Undo lives in this toast only (design D3), never in storage.
            const previous = state
            actions.completeMission()
            toast(
              t("tracker.completed", {
                mission: missionName(t, previous.mission),
              }),
              {
                action: {
                  label: t("tracker.undo"),
                  onClick: () => actions.restore(previous),
                },
              }
            )
          }}
        >
          {t("tracker.complete")}
        </Button>
      </CardContent>
    </Card>
  )
}
