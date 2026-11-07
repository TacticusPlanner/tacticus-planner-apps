import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"
import {
  useGoalResourceChips,
  type GoalResourceChip,
  type GoalResourceChipsInput,
} from "./use-goal-resource-chips"

/** Icon chips for what a goal still needs (`goal-remaining-resources`). A goal card that splits them
 *  across rows calls `useGoalResourceChips` itself and renders each row with `GoalResourceChipList`. */
export function GoalResourceChips({
  className,
  ...input
}: GoalResourceChipsInput & { className?: string }) {
  const chips = useGoalResourceChips(input)
  return <GoalResourceChipList chips={chips} className={className} />
}

/** The chips of one goal, or any subset of them, in the order given. */
export function GoalResourceChipList({
  chips,
  className,
}: {
  chips: readonly GoalResourceChip[]
  className?: string
}) {
  const { t, i18n } = useTranslation(["common", "shops"])
  if (chips.length === 0) return null

  const format = new Intl.NumberFormat(i18n?.resolvedLanguage)
  const label = (chip: GoalResourceChip) =>
    chip.pool
      ? t("goals.resourceChips.poolLabel", {
          name: chip.name,
          available: format.format(chip.pool.available),
          needed: format.format(chip.pool.needed),
        })
      : t("goals.resourceChips.chipLabel", {
          name: chip.name,
          quantity: chip.text,
        })
  const tooltip = (chip: GoalResourceChip) =>
    chip.hint
      ? `${label(chip)}
${chip.hint}`
      : label(chip)
  return (
    <ul
      className={cn("flex flex-wrap gap-x-2.5 gap-y-1 text-sm", className)}
      data-testid="goal-resource-chips"
    >
      {chips.map((chip) => (
        <li data-testid="goal-resource-chip" key={chip.key}>
          {chip.parts ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label={t("goals.resourceChips.byRarityLabel", {
                    label: tooltip(chip),
                  })}
                  className="-mx-1 flex items-center gap-0.5 rounded-md px-1 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  data-testid="goal-resource-chip-group"
                  type="button"
                >
                  <ChipFace chip={chip} label={tooltip(chip)} />
                  <ChevronDown
                    aria-hidden="true"
                    className="size-3 text-muted-foreground"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto gap-2 p-3"
                data-testid="goal-resource-chip-breakdown"
              >
                <p className="font-medium">{chip.name}</p>
                <ul className="grid gap-1.5">
                  {chip.parts.map((part) => (
                    <li
                      className="flex items-center justify-between gap-4"
                      key={part.key}
                    >
                      <span className="flex items-center gap-2">
                        <ChipIcon chip={part} />
                        {part.name}
                      </span>
                      <span className="tabular-nums">
                        {part.display ?? part.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          ) : (
            <ChipFace chip={chip} label={tooltip(chip)} />
          )}
        </li>
      ))}
    </ul>
  )
}

function ChipIcon({ chip }: { chip: GoalResourceChip }) {
  return (
    <span className="relative inline-flex shrink-0">
      <EntityIcon alt="" className="size-6" src={chip.icon} />
      {chip.overlay ? (
        <img
          alt=""
          className="absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 object-contain"
          src={chip.overlay}
        />
      ) : null}
    </span>
  )
}

function ChipFace({ chip, label }: { chip: GoalResourceChip; label: string }) {
  return (
    <span
      aria-label={label}
      className="flex items-center gap-1 tabular-nums"
      role="img"
      title={label}
    >
      <ChipIcon chip={chip} />
      <span aria-hidden>{chip.display ?? chip.text}</span>
    </span>
  )
}
