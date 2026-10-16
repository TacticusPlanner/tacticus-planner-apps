import { Minus, Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/**
 * "− Lv 58 +": an ability or relic level, changed one step at a time (the chart sets any level
 * directly). The level is announced as it changes.
 */
export function LevelStepper({
  level,
  max,
  label,
  levelText,
  lowerLabel,
  raiseLabel,
  onChange,
  "data-testid": testId,
}: {
  level: number
  max: number
  /** What the stepper changes, e.g. "Storm of Wrath level". */
  label: string
  levelText: string
  lowerLabel: string
  raiseLabel: string
  onChange: (level: number) => void
  "data-testid": string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-1"
      data-testid={testId}
    >
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={lowerLabel}
        disabled={level <= 1}
        onClick={() => onChange(level - 1)}
      >
        <Minus />
      </Button>
      <output
        aria-live="polite"
        className="min-w-12 text-center text-sm font-semibold tabular-nums"
        data-testid={`${testId}-value`}
      >
        {levelText}
      </output>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={raiseLabel}
        disabled={level >= max}
        onClick={() => onChange(level + 1)}
      >
        <Plus />
      </Button>
    </div>
  )
}
