import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@workspace/ui/components/input"

import type { HseProjectionMode } from "../lib/hse-projection"
import {
  isHseManualTokenMode,
  type HseManualTokenMode,
  type HseTokenMode,
} from "../lib/hse-token-supply"
import { useModeName } from "./use-mode-name"

/** An input's text as an average: empty clears it (null), anything else a non-negative number. */
function parseAverage(raw: string): number | null {
  if (raw.trim() === "") return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.max(0, value) : null
}

/**
 * A whole-number input (milestones done, points in the current milestone, entered tokens), as raw
 * text so it can be cleared and retyped (an empty field means 0, shown as the placeholder). The text
 * follows the stored value when it changes from elsewhere (another instance).
 */
export function ProgressInput({
  value,
  onChange,
  label,
  testId,
  max,
  describedBy,
}: {
  value: number
  onChange: (value: number) => void
  label: string
  testId: string
  max?: number
  /** The id of the hint that explains the input. */
  describedBy?: string
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
      aria-describedby={describedBy}
      aria-label={label}
      className="h-7 w-20"
      data-testid={testId}
      inputMode="numeric"
      max={max}
      min={0}
      // Leaving the field shows the stored value (a typed 12.7 tokens is stored as 12).
      onBlur={() => setRaw(value === 0 ? "" : String(value))}
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

/** A mode's tokens: the synced count, or an input for a mode the API does not sync. */
export function TokensCell({
  mode,
  onChange,
}: {
  mode: HseProjectionMode
  onChange: (mode: HseManualTokenMode, value: number) => void
}) {
  const { t, i18n } = useTranslation("dailies")
  const modeName = useModeName()
  if (!isHseManualTokenMode(mode.mode))
    return <>{new Intl.NumberFormat(i18n.language).format(mode.tokens)}</>
  const manual = mode.mode
  // Inline, so the table's right-aligned tokens column lines it up with the synced counts.
  return (
    <span className="inline-block">
      <ProgressInput
        describedBy="hse-manual-tokens-hint"
        label={t("hse.projection.tokensLabel", { mode: modeName(manual) })}
        onChange={(value) => onChange(manual, value)}
        testId={`hse-projection-tokens-input-${manual}`}
        value={mode.tokens}
      />
    </span>
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
