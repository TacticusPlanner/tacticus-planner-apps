import { useTranslation } from "react-i18next"
import { CalendarRange } from "lucide-react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  SEASON_FIT_MODES,
  type SeasonFitMode,
  type SeasonFitState,
} from "@/features/goal-planning"

/**
 * The Goals toolbar's Season fit select (goal-season-fit spec): labelled on desktop, icon-only with an
 * accessible name on mobile like the Type/Group filters. A mode the catalog has no season dates for is
 * disabled with the reason; while the catalog loads every mode is disabled.
 */
export function SeasonFitSelect({
  value,
  onValueChange,
  state,
}: {
  value: SeasonFitMode
  onValueChange: (value: SeasonFitMode) => void
  state: SeasonFitState
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const optionLabel = (mode: SeasonFitMode) =>
    t(`goals.seasonFit.options.${mode}`)

  return (
    <Select
      onValueChange={(next) => onValueChange(next as SeasonFitMode)}
      value={value}
    >
      <SelectTrigger
        aria-describedby="goals-season-fit-value"
        aria-label={t("goals.seasonFit.label")}
        data-testid="goals-season-fit"
      >
        <CalendarRange />
        {isMobile ? null : <SelectValue />}
        <span className="sr-only" id="goals-season-fit-value">
          {optionLabel(value)}
        </span>
      </SelectTrigger>
      {/* `popper` for the same reason as GoalFilters: mobile hides SelectValue. */}
      <SelectContent position="popper">
        {SEASON_FIT_MODES.map((mode) => {
          const available =
            mode === "off" ||
            (state.status === "ready" && state.available[mode])
          return (
            <SelectItem disabled={!available} key={mode} value={mode}>
              {optionLabel(mode)}
              {!available && state.status === "ready" ? (
                <span className="text-xs text-muted-foreground">
                  {t("goals.seasonFit.unavailable")}
                </span>
              ) : null}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
