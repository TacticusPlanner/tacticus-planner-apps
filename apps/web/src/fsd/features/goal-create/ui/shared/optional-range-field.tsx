import { useId, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { UpgradeRange } from "@/entities/goal"

const UNSET = "unset"

/** An optional start/end range over an ordered list of values (rank indices or ability levels): picking a
 * start turns the range on, "Not set" turns it off, and the end only offers values above the start. */
export function OptionalRangeField({
  label,
  options,
  value,
  onChange,
  portalContainer,
  testId,
}: {
  label: string
  /** The selectable values in ascending order, each with how to show it. */
  options: { value: number; label: ReactNode }[]
  value: UpgradeRange | null
  onChange: (range: UpgradeRange | null) => void
  portalContainer?: HTMLElement | null
  testId: string
}) {
  const { t } = useTranslation()
  const id = useId()
  const startOptions = options.slice(0, -1)
  const endOptions = options.filter(
    (option) => option.value > (value?.start ?? Infinity)
  )

  return (
    <div className="grid gap-1.5" data-testid={testId}>
      <Label className="text-xs text-muted-foreground" id={id}>
        {label}
      </Label>
      <div className="grid grid-cols-2 gap-3">
        <Select
          onValueChange={(next) => {
            if (next === UNSET) return onChange(null)
            const start = Number(next)
            const end =
              value && value.end > start
                ? value.end
                : (options.find((option) => option.value > start)?.value ??
                  start)
            onChange({ start, end })
          }}
          value={value ? String(value.start) : UNSET}
        >
          <SelectTrigger
            aria-label={t("goals.create.upgrade.range.start", { label })}
            className="w-full"
            data-testid={`${testId}-start`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={portalContainer ?? undefined}>
            <SelectItem value={UNSET}>
              {t("goals.create.upgrade.range.unset")}
            </SelectItem>
            {startOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          disabled={!value}
          onValueChange={(next) =>
            value && onChange({ start: value.start, end: Number(next) })
          }
          value={value ? String(value.end) : ""}
        >
          <SelectTrigger
            aria-label={t("goals.create.upgrade.range.end", { label })}
            className="w-full"
            data-testid={`${testId}-end`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent container={portalContainer ?? undefined}>
            {endOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
