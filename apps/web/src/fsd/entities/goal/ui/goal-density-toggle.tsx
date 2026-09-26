import { useTranslation } from "react-i18next"
import { Rows3 } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { isGoalDensityValue, type GoalDensityValue } from "../model/types"

type Props = {
  value: GoalDensityValue
  onChange: (value: GoalDensityValue) => void
}

/**
 * The Goals page's row-density control (goal-list-layout: "The Goals page offers a row-density
 * preference"). Same icon-with-hidden-value-on-mobile shape as `GoalFilters`' selects: the accessible
 * name is the stable purpose ("Row density"), the current value is a screen-reader description.
 */
export function GoalDensityToggle({ value, onChange }: Props) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const valueLabel =
    value === "compact"
      ? t("goals.filters.densityCompact")
      : t("goals.filters.densityComfortable")

  return (
    <Select
      onValueChange={(next) => {
        if (isGoalDensityValue(next)) onChange(next)
      }}
      value={value}
    >
      <SelectTrigger
        aria-describedby="goals-density-value"
        aria-label={t("goals.filters.densityLabel")}
        data-testid="goals-density-toggle"
      >
        <Rows3 />
        {isMobile ? null : <SelectValue />}
        <span className="sr-only" id="goals-density-value">
          {valueLabel}
        </span>
      </SelectTrigger>
      {/* popper positioning: see `GoalFilters` — item-aligned needs the (mobile-hidden) SelectValue. */}
      <SelectContent position="popper">
        <SelectItem value="comfortable">
          {t("goals.filters.densityComfortable")}
        </SelectItem>
        <SelectItem value="compact">
          {t("goals.filters.densityCompact")}
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
