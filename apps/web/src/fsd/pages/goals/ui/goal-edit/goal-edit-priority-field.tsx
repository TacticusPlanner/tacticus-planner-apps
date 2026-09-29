import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

/** The Priority position select: 1..`total` over the account's in-flight goals (1 is the highest
 * priority). Saving a different position moves the goal there, like a drag reorder to that spot. */
export function GoalEditPriorityField({
  position,
  total,
  onChange,
  portalContainer,
}: {
  position: number
  total: number
  onChange: (position: number) => void
  portalContainer: HTMLElement | null
}) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <div className="grid gap-2" data-testid="goal-edit-priority">
      <label className="font-semibold" htmlFor={id}>
        {t("goals.edit.priority.label")}
      </label>
      <Select
        onValueChange={(next) => {
          // Radix can fire onValueChange("") while the option list regenerates; ignore non-options.
          if (next !== "") onChange(Number(next))
        }}
        value={String(position)}
      >
        <SelectTrigger
          className="w-full"
          data-testid="goal-edit-priority-select"
          id={id}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={portalContainer ?? undefined}>
          {Array.from({ length: total }, (_, index) => index + 1).map(
            (option) => (
              <SelectItem key={option} value={String(option)}>
                {t("goals.edit.priority.option", { position: option, total })}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">
        {t("goals.edit.priority.hint")}
      </span>
    </div>
  )
}
