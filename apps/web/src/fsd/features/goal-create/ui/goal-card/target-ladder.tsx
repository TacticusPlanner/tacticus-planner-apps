import { useRef, type KeyboardEvent, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

export type LadderStep = {
  key: string
  /** The visible step (an icon and a short label). */
  label: ReactNode
  /** The step's spoken name, e.g. "Gold II". */
  name: string
  tier: string
  /** The tier's heading, shown once above its steps (omitted when the steps name their tier). */
  tierLabel?: string
}

type StepState = {
  index: number
  current: boolean
  taken: boolean
  selected: boolean
  inRange: boolean
  disabled: boolean
}

/**
 * A track's steps as one radio group, grouped by tier (goal-target-editing: targets are picked on a
 * ladder). The start is marked Current, steps an in-flight goal already holds are marked "Already a
 * goal", and the steps from the start to the selected one are highlighted. Steps at or below the start
 * and taken steps stay announced but `aria-disabled`. Arrow keys move between selectable steps (one
 * tab stop, a roving tabindex); Enter or Space selects. Tiers share one wrapping row at 768px and
 * wider, and take a row each below it, with 44px steps.
 */
export function TargetLadder({
  steps,
  startKey,
  valueKey,
  takenKeys,
  onChange,
  label,
  testId,
  fieldProps,
}: {
  steps: readonly LadderStep[]
  startKey: string
  valueKey: string
  takenKeys: ReadonlySet<string>
  onChange: (key: string) => void
  label: string
  testId: string
  /** `id`, `aria-invalid` and `aria-describedby` from the card's issues. */
  fieldProps?: {
    id?: string
    "aria-invalid"?: boolean
    "aria-describedby"?: string
  }
}) {
  const { t } = useTranslation()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const startIndex = steps.findIndex((step) => step.key === startKey)
  const valueIndex = steps.findIndex((step) => step.key === valueKey)

  const states: StepState[] = steps.map((step, index) => {
    const taken = step.key !== valueKey && takenKeys.has(step.key)
    return {
      index,
      current: index === startIndex,
      taken,
      selected: index === valueIndex,
      inRange:
        valueIndex > startIndex && index >= startIndex && index <= valueIndex,
      disabled: index <= startIndex || taken,
    }
  })
  const selectable = states.filter((state) => !state.disabled)
  // The one tab stop: the selected step when it can be chosen, else the first one that can.
  const tabStop =
    states[valueIndex] && !states[valueIndex].disabled
      ? valueIndex
      : (selectable[0]?.index ?? valueIndex)

  const move = (event: KeyboardEvent, from: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown"
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp"
    let next: StepState | undefined
    if (forward) next = selectable.find((state) => state.index > from)
    else if (back) next = selectable.findLast((state) => state.index < from)
    else if (event.key === "Home") next = selectable[0]
    else if (event.key === "End") next = selectable.at(-1)
    else return
    event.preventDefault()
    if (next) buttons.current[next.index]?.focus()
  }

  const tiers: { tier: string; label?: string; states: StepState[] }[] = []
  for (const state of states) {
    const step = steps[state.index]!
    const last = tiers.at(-1)
    if (last?.tier === step.tier) last.states.push(state)
    else tiers.push({ tier: step.tier, label: step.tierLabel, states: [state] })
  }

  return (
    <div
      aria-label={label}
      className="flex flex-wrap gap-x-3 gap-y-2 max-md:grid"
      data-testid={testId}
      role="radiogroup"
      {...fieldProps}
    >
      {tiers.map((tier) => (
        <div className="grid content-start gap-1" key={tier.tier}>
          {tier.label ? (
            <span aria-hidden className="text-xs text-muted-foreground">
              {tier.label}
            </span>
          ) : null}
          <div className="flex flex-wrap gap-1">
            {tier.states.map((state) => {
              const step = steps[state.index]!
              const note = state.current
                ? t("goals.card.ladder.current")
                : state.taken
                  ? t("goals.card.ladder.taken")
                  : null
              return (
                <button
                  aria-checked={state.selected}
                  aria-disabled={state.disabled || undefined}
                  aria-label={note ? `${step.name}, ${note}` : step.name}
                  className={cn(
                    "grid min-h-9 min-w-14 content-center justify-items-center gap-0.5 rounded-xl border px-1.5 py-1 text-xs transition-colors outline-none max-md:min-h-11",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    state.inRange && "border-primary/40 bg-primary/10",
                    state.selected &&
                      "border-primary bg-primary text-primary-foreground",
                    state.disabled && !state.selected
                      ? "cursor-not-allowed opacity-60"
                      : "hover:border-primary",
                    state.current && "border-dashed opacity-100"
                  )}
                  data-state={
                    state.selected
                      ? "selected"
                      : state.current
                        ? "current"
                        : state.taken
                          ? "taken"
                          : undefined
                  }
                  data-in-range={state.inRange || undefined}
                  data-step={step.key}
                  key={step.key}
                  onClick={() => {
                    if (!state.disabled) onChange(step.key)
                  }}
                  onKeyDown={(event) => move(event, state.index)}
                  ref={(node) => {
                    buttons.current[state.index] = node
                  }}
                  role="radio"
                  tabIndex={state.index === tabStop ? 0 : -1}
                  type="button"
                >
                  {step.label}
                  {note ? (
                    <span
                      aria-hidden
                      className={cn(
                        "text-[0.625rem] leading-none",
                        !state.selected && "text-muted-foreground"
                      )}
                    >
                      {note}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
