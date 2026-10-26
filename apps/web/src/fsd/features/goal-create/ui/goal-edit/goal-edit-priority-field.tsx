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

import { InfoHint } from "../shared/info-hint"

/** The Priority position select: 1..`total` over the account's in-flight goals (1 is the highest
 * priority). Saving a different position moves the goal there, like a drag reorder to that spot. Creation
 * reuses it for where the new goals go (`total` is then the in-flight count + 1, the last being "last"). */
export function GoalEditPriorityField({
  position,
  total,
  onChange,
  portalContainer,
  testIdPrefix = "goal-edit",
  hint,
  compact = false,
  lastLabel = false,
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
}) {
  const { t } = useTranslation()
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
              <SelectItem key={option} value={String(option)}>
                {lastLabel && option === total
                  ? t("goals.create.priorityLast", { position: option, total })
                  : t("goals.edit.priority.option", {
                      position: option,
                      total,
                    })}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
