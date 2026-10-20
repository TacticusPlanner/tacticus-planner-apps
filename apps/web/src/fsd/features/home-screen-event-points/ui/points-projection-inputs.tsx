import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@workspace/ui/components/input"

import type { HseProjectionMode } from "../lib/hse-projection"
import type { HseTokenMode } from "../lib/hse-token-supply"
import { useModeName } from "./use-mode-name"

/** An input's text as an average: empty clears it (null), anything else a non-negative number. */
function parseAverage(raw: string): number | null {
  if (raw.trim() === "") return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.max(0, value) : null
}

/**
 * A whole-number progress input (milestones done, points in the current milestone), as raw text so it
 * can be cleared and retyped (an empty field means 0, shown as the placeholder). The text follows the
 * stored value when it changes from elsewhere (another instance).
 */
export function ProgressInput({
  value,
  onChange,
  label,
  testId,
  max,
}: {
  value: number
  onChange: (value: number) => void
  label: string
  testId: string
  max?: number
}) {
  const [raw, setRaw] = useState(() => (value === 0 ? "" : String(value)))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if ((parseAverage(raw) ?? 0) !== value)
      setRaw(value === 0 ? "" : String(value))
  }
  return (
    <Input
      aria-describedby="hse-progress-hint"
      aria-label={label}
      className="h-7 w-20"
      data-testid={testId}
      inputMode="numeric"
      max={max}
      min={0}
      onChange={(event) => {
        setRaw(event.target.value)
        onChange(parseAverage(event.target.value) ?? 0)
      }}
      placeholder="0"
      type="number"
      value={raw}
    />
  )
}

export function AverageInput({
  mode,
  onChange,
}: {
  mode: HseProjectionMode
  onChange: (mode: HseTokenMode, value: number | null) => void
}) {
  const { t } = useTranslation("dailies")
  const modeName = useModeName()
  if (mode.fixedAverage)
    return (
      <span data-testid={`hse-projection-average-${mode.mode}`}>
        {t("hse.projection.averageFixed")}
      </span>
    )
  return (
    <span className="flex items-center gap-1.5">
      <Input
        aria-label={t("hse.projection.averageLabel", {
          unit: t(`hse.projection.unit.${mode.unit}`),
          mode: modeName(mode.mode),
        })}
        aria-invalid={mode.average === null || undefined}
        className="h-7 w-20"
        data-testid={`hse-projection-average-${mode.mode}`}
        inputMode="decimal"
        min={0}
        onChange={(event) =>
          onChange(mode.mode, parseAverage(event.target.value))
        }
        placeholder={t("hse.projection.averageNeeded")}
        step="any"
        type="number"
        value={mode.average ?? ""}
      />
      <span className="text-xs text-muted-foreground">
        {t(`hse.projection.unit.${mode.unit}`)}
      </span>
    </span>
  )
}
