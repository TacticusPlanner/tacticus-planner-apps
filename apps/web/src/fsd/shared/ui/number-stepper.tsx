import { useState, type KeyboardEvent } from "react"
import { Minus, Plus, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

import { parseStepperInput, stepStepperValue } from "./number-stepper.model"

type NumberStepperLabels = {
  /** Accessible name of the number input. */
  value: string
  decrease: string
  increase: string
  /** Accessible name of the clear control (rendered with `clearable` while a value is set). */
  clear?: string
}

/**
 * "− input +" over an integer `min..max` (extracted from the progress page's event card pattern).
 * `value` null renders an empty input; + then starts at `min`. With `clearable`, a clear control
 * (and an emptied input) sets null. Typed entries commit on blur or Enter, clamped.
 */
export function NumberStepper({
  value,
  min,
  max,
  onChange,
  labels,
  clearable = false,
  disabled = false,
  placeholder,
  className,
  "data-testid": testId,
}: {
  value: number | null
  min: number
  max: number
  onChange: (value: number | null) => void
  labels: NumberStepperLabels
  clearable?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  "data-testid"?: string
}) {
  // The typed text while the input has focus; null otherwise, when the input shows `value`.
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (value === null ? "" : String(value))

  const commit = (next: number | null) => {
    if (next !== value) onChange(next)
  }
  const commitDraft = () => {
    if (draft === null) return
    const parsed = parseStepperInput(draft, min, max, clearable)
    setDraft(null)
    if (parsed !== undefined) commit(parsed)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      commitDraft()
    }
  }

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      data-testid={testId}
    >
      <Button
        aria-label={labels.decrease}
        data-testid="number-stepper-decrease"
        disabled={disabled || value === null || value <= min}
        onClick={() => commit(stepStepperValue(value, -1, min, max))}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <Minus />
      </Button>
      <Input
        aria-label={labels.value}
        className="w-14 text-center tabular-nums"
        data-testid="number-stepper-input"
        disabled={disabled}
        inputMode="numeric"
        max={max}
        min={min}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={() => setDraft(shown)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        type="number"
        value={shown}
      />
      <Button
        aria-label={labels.increase}
        data-testid="number-stepper-increase"
        disabled={disabled || (value !== null && value >= max)}
        onClick={() => commit(stepStepperValue(value, 1, min, max))}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <Plus />
      </Button>
      {clearable && value !== null ? (
        <Button
          aria-label={labels.clear}
          data-testid="number-stepper-clear"
          disabled={disabled}
          onClick={() => commit(null)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      ) : null}
    </div>
  )
}
