import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

import { goalTypeIcon, type GoalKind } from "@/entities/goal"
import { EntityIcon } from "@/shared/ui"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { InfoHint } from "../shared/info-hint"
import { GoalUnitIcon } from "../shared/goal-visuals"

/** The in-flight goal that holds a position, shown beside its number. */
type PriorityOccupant = {
  entityType: string
  entityId: string
  goalType: GoalKind
}

/** The Priority position select: 1..`total` over the account's in-flight goals (1 is the highest
 * priority). Saving a different position moves the goal there, like a drag reorder to that spot. Creation
 * reuses it for where the new goals go (`total` is then the in-flight count + 1, the last being "last").
 * `occupants[i]` is the goal at position i + 1: its unit portrait and goal-type icon follow the number. */
export function GoalEditPriorityField({
  position,
  total,
  onChange,
  portalContainer,
  testIdPrefix = "goal-edit",
  hint,
  compact = false,
  lastLabel = false,
  occupants = [],
}: {
  position: number
  total: number
  onChange: (position: number) => void
  portalContainer: HTMLElement | null
  testIdPrefix?: string
  hint?: string
  /** One row, label beside a narrow select (the create dialog's footer). */
  compact?: boolean
  /** Marks the last position as "last" (creation's default). */
  lastLabel?: boolean
  occupants?: readonly PriorityOccupant[]
}) {
  const { t } = useTranslation()
  const { getEntityName } = useGoalCatalog()
  const id = useId()

  return (
    <div
      className={cn("grid gap-1.5", compact && "flex items-center gap-2")}
      data-testid={`${testIdPrefix}-priority`}
    >
      <div className="flex items-center gap-1.5">
        <label
          className={cn(
            "font-semibold",
            compact && "text-sm font-normal text-muted-foreground"
          )}
          htmlFor={id}
        >
          {t("goals.edit.priority.label")}
        </label>
        <InfoHint text={hint ?? t("goals.edit.priority.hint")} />
      </div>
      <Select
        onValueChange={(next) => {
          // Radix can fire onValueChange("") while the option list regenerates; ignore non-options.
          if (next !== "") onChange(Number(next))
        }}
        value={String(position)}
      >
        <SelectTrigger
          className={cn("w-full max-w-xs", compact && "w-auto")}
          data-testid={`${testIdPrefix}-priority-select`}
          id={id}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={portalContainer ?? undefined}>
          {Array.from({ length: total }, (_, index) => index + 1).map(
            (option) => (
              <PriorityOption
                key={option}
                label={
                  lastLabel && option === total
                    ? t("goals.create.priorityLast", {
                        position: option,
                        total,
                      })
                    : t("goals.edit.priority.option", {
                        position: option,
                        total,
                      })
                }
                occupant={occupants[option - 1]}
                unitName={(occupant) =>
                  getEntityName(occupant.entityType, occupant.entityId)
                }
                value={option}
              />
            )
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

function PriorityOption({
  value,
  label,
  occupant,
  unitName,
}: {
  value: number
  label: string
  occupant: PriorityOccupant | undefined
  unitName: (occupant: PriorityOccupant) => string
}) {
  const { t } = useTranslation()
  const name = occupant ? unitName(occupant) : ""
  return (
    <SelectItem
      data-testid={`priority-option-${value}`}
      textValue={label}
      value={String(value)}
    >
      <span className="min-w-16 tabular-nums">{label}</span>
      {occupant ? (
        <span
          className="flex items-center gap-1"
          data-testid={`priority-option-occupant-${value}`}
          title={`${name} · ${t(`goals.create.goalTypes.${occupant.goalType}`)}`}
        >
          <GoalUnitIcon
            className="size-5"
            entityId={occupant.entityId}
            entityType={occupant.entityType}
            name={name}
          />
          <EntityIcon
            alt={t(`goals.create.goalTypes.${occupant.goalType}`)}
            className="size-5"
            src={goalTypeIcon(occupant.goalType, occupant.entityType)}
          />
        </span>
      ) : null}
    </SelectItem>
  )
}
