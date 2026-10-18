import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { cn } from "@workspace/ui/lib/utils"

import {
  useMissionLabel,
  type LegendaryEventMission,
  type LegendaryEventRun,
} from "@/entities/legendary-event"
import { NumberStepper } from "@/shared/ui"

/**
 * One track's missions in a run (spec: the Run status card opens a run inputs drawer): a
 * collapsible checklist with a Done tick per mission, then the Plan to complete count, which never
 * drops below the ticked count. `onTick` receives the mission's catalog index.
 */
export function MissionChecklist({
  run,
  field,
  testId,
  missions,
  completed,
  count,
  defaultOpen,
  touch,
  onTick,
  onCountChange,
}: {
  run: LegendaryEventRun
  /** The track's name ("Regular missions"). */
  field: string
  testId: string
  missions: readonly LegendaryEventMission[]
  completed: readonly number[]
  count: number
  defaultOpen: boolean
  touch: boolean
  onTick: (index: number, done: boolean) => void
  onCountChange: (count: number) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const missionLabel = useMissionLabel()
  const [open, setOpen] = useState(defaultOpen)
  const listId = useId()
  const ticked = missions.filter((mission) =>
    completed.includes(mission.index)
  ).length
  const planField = t("runInputs.planToComplete", { field })
  return (
    <div className="flex flex-col gap-2" data-testid={testId}>
      <button
        aria-controls={listId}
        aria-expanded={open}
        className={cn(
          "flex items-center justify-between gap-2 rounded-md text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          touch && "min-h-11"
        )}
        data-testid={`${testId}-toggle`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>
          {field}{" "}
          <span
            className="text-muted-foreground tabular-nums"
            data-testid={`${testId}-ticked`}
          >
            {t("runInputs.ticked", { done: ticked, total: missions.length })}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <ul
          aria-label={t("runInputs.fieldLabel", { field, run })}
          className="flex flex-col gap-1"
          id={listId}
        >
          {missions.map((mission) => (
            <MissionRow
              done={completed.includes(mission.index)}
              key={mission.index}
              label={missionLabel(mission)}
              onChange={(done) => onTick(mission.index, done)}
              testId={`${testId}-mission`}
              touch={touch}
            />
          ))}
        </ul>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <span aria-hidden="true" className="text-sm">
          {t("runInputs.planToCompleteShort")}
        </span>
        <NumberStepper
          data-testid={`${testId}-count`}
          labels={{
            value: t("runInputs.fieldLabel", { field: planField, run }),
            decrease: t("runInputs.decrease", { field: planField, run }),
            increase: t("runInputs.increase", { field: planField, run }),
          }}
          max={missions.length}
          min={ticked}
          onChange={(value) => onCountChange(Math.max(value ?? 0, ticked))}
          touch={touch}
          value={count}
        />
      </div>
    </div>
  )
}

function MissionRow({
  label,
  done,
  touch,
  testId,
  onChange,
}: {
  label: string
  done: boolean
  touch: boolean
  testId: string
  onChange: (done: boolean) => void
}) {
  const id = useId()
  return (
    <li
      className={cn("flex items-center gap-3 text-sm", touch && "min-h-11")}
      data-done={done}
      data-testid={testId}
    >
      <Checkbox
        checked={done}
        className={cn(touch && "size-6")}
        id={id}
        onCheckedChange={(state) => onChange(state === true)}
      />
      <label className="min-w-0 flex-1 leading-snug" htmlFor={id}>
        {label}
      </label>
    </li>
  )
}
