import { useTranslation } from "react-i18next"

import { NumberStepper } from "@/shared/ui"

/**
 * A team's clear depth for the current run (design D8): "− number +" bounded 1..`battleCount`
 * with a clear control that sets null. Every edit is a manual value; there is no estimate.
 */
export function ClearDepthStepper({
  value,
  battleCount,
  onChange,
  disabled = false,
  "data-testid": testId = "clear-depth-stepper",
}: {
  value: number | null
  battleCount: number
  onChange: (depth: number | null) => void
  disabled?: boolean
  "data-testid"?: string
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <NumberStepper
      clearable
      data-testid={testId}
      disabled={disabled}
      labels={{
        value: t("teams.depth.label"),
        decrease: t("teams.depth.decrease"),
        increase: t("teams.depth.increase"),
        clear: t("teams.depth.clear"),
      }}
      max={Math.max(1, battleCount)}
      min={1}
      onChange={onChange}
      placeholder="–"
      value={value}
    />
  )
}
