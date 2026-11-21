import { useId } from "react"
import { useTranslation } from "react-i18next"
import { CalendarRange } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { SEASON_FIT_MODES } from "@/features/goal-planning"
import { ToolbarField, useViewPlacement } from "@/shared/ui"
import type { SeasonFitState } from "@/features/goal-planning"

import type { TargetedFitChoice } from "./targeted-fit-choice"

/**
 * The Goals toolbar's Season fit select (goal-season-fit spec), in the View slot: labelled "Season
 * fit" outside the trigger, and showing its value on every viewport (full width in the mobile View
 * sheet). A mode the catalog has no season dates for is
 * disabled with the reason; while the catalog loads every mode is disabled. In a project scope with
 * a target, `projectDeadline` adds that project's deadline as the first option (project-deadline-fit).
 */
export function SeasonFitSelect<Value extends TargetedFitChoice>({
  value,
  onValueChange,
  state,
  projectDeadline = false,
}: {
  value: Value
  onValueChange: (value: Value) => void
  state: SeasonFitState
  projectDeadline?: boolean
}) {
  const { t } = useTranslation()
  const labelId = useId()
  const inSheet = useViewPlacement() === "sheet"
  const optionLabel = (mode: TargetedFitChoice) =>
    t(`goals.seasonFit.options.${mode}`)

  return (
    <ToolbarField label={t("goals.seasonFit.label")} labelId={labelId}>
      <Select
        onValueChange={(next) => onValueChange(next as Value)}
        value={value}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          className={inSheet ? "w-full" : undefined}
          data-testid="goals-season-fit"
        >
          <CalendarRange />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {projectDeadline ? (
            <SelectItem value="projectDeadline">
              {optionLabel("projectDeadline")}
            </SelectItem>
          ) : null}
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
    </ToolbarField>
  )
}
