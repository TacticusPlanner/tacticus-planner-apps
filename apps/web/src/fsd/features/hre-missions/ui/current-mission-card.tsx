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

import { hreMission } from "@/entities/hre-mission"
import type {
  HreMission,
  HreObjective,
  HreProgress,
} from "@/entities/hre-mission"
import type { HreProgressActions } from "../model/use-hre-progress"
import { useAnalyticsActions } from "@/shared/analytics"
import { EntityIcon } from "@/shared/ui"

import { missionName } from "./mission-name"
import { ObjectiveFolds } from "./objective-folds"
import type { ObjectiveSuggestions } from "./objective-folds"
import { ObjectiveInfo } from "./objective-guidance"
import { ReserveTip } from "./reserve-tip"

/** "+1" on every open objective, plus "+10" from a target of 20. */
const steps = (target: number) => (target >= 20 ? [1, 10] : [1])

/**
 * The current mission: the mission picker, each objective with its progress input (clamped to the
 * target, empty rather than a leading 0 so typing never reads "033"), "+1" (and "+10"), a one-click
 * "Mark done" and its bar, an 'i' button with the game's hint and our tip, the objective's
 * suggestions folded under it, the tokens to keep for a later mission, and "Mission complete",
 * always enabled (it fills both objectives), followed by an Undo toast.
 */
export function CurrentMissionCard({
  state,
  missions,
  actions,
  objectiveText,
  objectiveIcon,
  objectiveHint,
  objectiveSuggestions,
}: {
  state: HreProgress
  missions: readonly HreMission[]
  actions: HreProgressActions
  objectiveText: (objective: HreObjective) => string
  /** The game glyph shown before each objective. */
  objectiveIcon?: (objective: HreObjective) => string | undefined
  /** The game's hint for an objective, shown behind its 'i' button. */
  objectiveHint?: (objective: HreObjective) => string | undefined
  /** The suggestions folded under an objective (raids, battles by hand, teams), or null. */
  objectiveSuggestions?: (
    objective: HreObjective,
    index: number
  ) => ObjectiveSuggestions | null
}) {
  const { t, i18n } = useTranslation("hre")
  const { captureEvent } = useAnalyticsActions()
  const reportProgress = (
    objective: HreObjective,
    method: "step" | "markDone"
  ) =>
    captureEvent({
      type: "hre_objective_progress_changed",
      mission: state.mission,
      objectiveKind: objective.kind,
      method,
    })
  const mission = hreMission(missions, state.mission)

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
            {missions.map((item) => (
              <SelectItem key={item.number} value={String(item.number)}>
                {missionName(t, item.number, missions)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {mission.objectives.map((objective, index) => {
          // An objective with no recorded progress yet reads as 0.
          const value = state.progress[index] ?? 0
          const done = value >= objective.target
          const testId = `hre-objective-${index}`
          const suggestions = done
            ? null
            : (objectiveSuggestions?.(objective, index) ?? null)
          return (
            <div key={index} className="space-y-1.5" data-testid={testId}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <EntityIcon
                      size="inline"
                      alt=""
                      className="shrink-0"
                      src={objectiveIcon?.(objective)}
                    />
                    {objectiveText(objective)}
                  </p>
                  <ObjectiveInfo
                    hint={objectiveHint?.(objective)}
                    objective={objective}
                    objectiveText={objectiveText(objective)}
                    testId={testId}
                  />
                </div>
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
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10)
                    actions.setObjectiveProgress(
                      index as 0 | 1,
                      Number.isNaN(value) ? 0 : value
                    )
                  }}
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
                        onClick={() => {
                          actions.setObjectiveProgress(
                            index as 0 | 1,
                            value + step
                          )
                          reportProgress(objective, "step")
                        }}
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
                      onClick={() => {
                        actions.setObjectiveProgress(
                          index as 0 | 1,
                          objective.target
                        )
                        reportProgress(objective, "markDone")
                      }}
                      size="sm"
                      variant="outline"
                    >
                      {t("tracker.markDone")}
                    </Button>
                  </div>
                )}
              </div>
              <Progress value={(value / objective.target) * 100} />
              {suggestions ? (
                <ObjectiveFolds
                  // A new mission starts with every fold closed.
                  key={`${state.mission}-${objective.kind}`}
                  suggestions={suggestions}
                  onOpen={(fold) =>
                    captureEvent({
                      type: "hre_fold_opened",
                      mission: state.mission,
                      objectiveKind: objective.kind,
                      suggestion: fold.suggestion,
                      spare: fold.spare ?? false,
                    })
                  }
                  testId={testId}
                />
              ) : null}
            </div>
          )
        })}
        <ReserveTip
          missionNumber={mission.number}
          missions={missions}
          testId="hre-current-reserve"
        />
        <Button
          data-testid="hre-mission-complete"
          onClick={() => {
            // Undo lives in this toast only (design D3), never in storage.
            const previous = state
            actions.completeMission()
            captureEvent({
              type: "hre_mission_completed",
              mission: previous.mission,
            })
            toast(
              t("tracker.completed", {
                mission: missionName(t, previous.mission, missions),
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
