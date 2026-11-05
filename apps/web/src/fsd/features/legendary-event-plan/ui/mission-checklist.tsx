import { useId, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import {
  doneMissionCount,
  useMissionLabel,
  type LegendaryEventMission,
  type LegendaryEventRun,
} from "@/entities/legendary-event"
import { NumberStepper } from "@/shared/ui"

/**
 * One track's missions in a run (spec: missions are done in order): the game unlocks them one at a
 * time, so the player sets how many are done rather than ticking each. A collapsible list shows the
 * done missions struck through, the current one marked Now and the rest in turn; picking a mission
 * sets Done up to it (picking the last done one undoes it). Then the Done and Plan to complete
 * counts; Plan to complete never drops below Done.
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
  onDoneChange,
  onCountChange,
}: {
  run: LegendaryEventRun
  /** The track's name ("Regular missions"). */
  field: string
  testId: string
  missions: readonly LegendaryEventMission[]
  /** The stored Done missions (their count is what counts). */
  completed: readonly number[]
  count: number
  defaultOpen: boolean
  touch: boolean
  onDoneChange: (done: number) => void
  onCountChange: (count: number) => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const missionLabel = useMissionLabel()
  const [open, setOpen] = useState(defaultOpen)
  const listId = useId()
  const done = doneMissionCount(missions, completed)
  const planField = t("runInputs.planToComplete", { field })
  const doneField = t("runInputs.doneCount", { field })
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
            {t("runInputs.ticked", { done, total: missions.length })}
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
        <ol
          aria-label={t("runInputs.fieldLabel", { field, run })}
          className="flex flex-col gap-0.5"
          id={listId}
        >
          {missions.map((mission, position) => (
            <MissionRow
              key={mission.index}
              label={missionLabel(mission)}
              number={position + 1}
              onPick={() =>
                onDoneChange(position + 1 === done ? position : position + 1)
              }
              state={
                position < done
                  ? "done"
                  : position === done
                    ? "current"
                    : "later"
              }
              testId={`${testId}-mission`}
              touch={touch}
            />
          ))}
        </ol>
      ) : null}
      <CountField label={t("runInputs.doneShort")}>
        <NumberStepper
          data-testid={`${testId}-done`}
          labels={{
            value: t("runInputs.fieldLabel", { field: doneField, run }),
            decrease: t("runInputs.decrease", { field: doneField, run }),
            increase: t("runInputs.increase", { field: doneField, run }),
          }}
          max={missions.length}
          min={0}
          onChange={(value) => onDoneChange(value ?? 0)}
          touch={touch}
          value={done}
        />
      </CountField>
      <CountField label={t("runInputs.planToCompleteShort")}>
        <NumberStepper
          data-testid={`${testId}-count`}
          labels={{
            value: t("runInputs.fieldLabel", { field: planField, run }),
            decrease: t("runInputs.decrease", { field: planField, run }),
            increase: t("runInputs.increase", { field: planField, run }),
          }}
          max={missions.length}
          min={done}
          onChange={(value) => onCountChange(Math.max(value ?? 0, done))}
          touch={touch}
          value={count}
        />
      </CountField>
    </div>
  )
}

function CountField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span aria-hidden="true" className="text-sm">
        {label}
      </span>
      {children}
    </div>
  )
}

function MissionRow({
  label,
  number,
  state,
  touch,
  testId,
  onPick,
}: {
  label: string
  number: number
  state: "done" | "current" | "later"
  touch: boolean
  testId: string
  onPick: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <li data-state={state} data-testid={testId}>
      <button
        aria-label={t(`runInputs.missionState.${state}`, {
          number,
          mission: label,
        })}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          touch && "min-h-11",
          state === "current" && "bg-primary/10 font-medium",
          state === "done" && "text-muted-foreground"
        )}
        onClick={onPick}
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
            state === "done" &&
              "border-primary bg-primary text-primary-foreground",
            state === "current" && "border-primary text-primary"
          )}
        >
          {state === "done" ? <Check className="size-3.5" /> : number}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 leading-snug",
            state === "done" && "line-through"
          )}
        >
          {label}
        </span>
        {state === "current" ? (
          <span className="text-xs text-primary" aria-hidden="true">
            {t("runInputs.now")}
          </span>
        ) : null}
      </button>
    </li>
  )
}
