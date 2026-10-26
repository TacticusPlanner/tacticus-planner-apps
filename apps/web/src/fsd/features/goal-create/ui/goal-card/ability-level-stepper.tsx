import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Minus, Plus } from "lucide-react"
import { maxAbilityLevel } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

/**
 * One ability track's target level (goal-target-editing: Ability levels use a stepper): decrease, the
 * level, increase, from `start` (no change on this track) to the highest level of any rarity, and the
 * quick picks "Next", "+5" and "Rarity cap" (hidden once the start is at or above that cap). A typed
 * value is passed on as is, so a level outside the range reaches the card's issues and shows the
 * range message there.
 */
export function AbilityLevelStepper({
  label,
  start,
  value,
  onChange,
  rarityCap,
  testId,
  fieldProps,
}: {
  label: string
  start: number
  value: number
  onChange: (value: number) => void
  /** The ability cap of the unit's current rarity. */
  rarityCap: number
  testId: string
  fieldProps?: {
    id?: string
    "aria-invalid"?: boolean
    "aria-describedby"?: string
  }
}) {
  const { t } = useTranslation()
  const generatedId = useId()
  const inputId = fieldProps?.id ?? generatedId
  const valid = Number.isInteger(value)
  const picks = [
    { key: "next", label: t("goals.card.ability.next"), level: start + 1 },
    {
      key: "plusFive",
      label: t("goals.card.ability.plusFive"),
      level: Math.min(start + 5, maxAbilityLevel),
    },
    ...(start < rarityCap
      ? [
          {
            key: "rarityCap",
            label: t("goals.card.ability.rarityCap"),
            level: rarityCap,
          },
        ]
      : []),
  ].filter((pick) => pick.level <= maxAbilityLevel)

  return (
    <div className="grid content-start gap-1.5" data-testid={testId}>
      <label className="text-xs text-muted-foreground" htmlFor={inputId}>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <Button
          aria-label={t("goals.card.ability.decrease", { track: label })}
          className="max-md:size-11"
          disabled={!valid || value <= start}
          onClick={() => onChange(Math.min(value - 1, maxAbilityLevel))}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Minus />
        </Button>
        <Input
          {...fieldProps}
          className="w-16 text-center tabular-nums max-md:h-11"
          id={inputId}
          inputMode="numeric"
          max={maxAbilityLevel}
          min={start}
          onChange={(event) => onChange(event.target.valueAsNumber)}
          type="number"
          value={valid ? String(value) : ""}
        />
        <Button
          aria-label={t("goals.card.ability.increase", { track: label })}
          className="max-md:size-11"
          disabled={valid && value >= maxAbilityLevel}
          onClick={() =>
            onChange(valid ? Math.max(value + 1, start + 1) : start + 1)
          }
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Plus />
        </Button>
        {value === start ? (
          <span className="text-xs text-muted-foreground">
            {t("goals.card.ability.noChange")}
          </span>
        ) : null}
      </div>
      {picks.length > 0 ? (
        <div
          aria-label={t("goals.card.ability.quickPicks", { track: label })}
          className="flex flex-wrap gap-1"
          role="group"
        >
          {picks.map((pick) => (
            <Button
              aria-pressed={value === pick.level}
              className="h-7 px-2 text-xs max-md:h-11"
              key={pick.key}
              onClick={() => onChange(pick.level)}
              type="button"
              variant={value === pick.level ? "secondary" : "outline"}
            >
              {pick.label}
              <span className="text-muted-foreground tabular-nums">
                {pick.level}
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
