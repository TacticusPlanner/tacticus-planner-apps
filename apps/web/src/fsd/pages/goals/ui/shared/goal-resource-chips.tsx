import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, HintLines, HintTrigger } from "@/shared/ui"
import { numberFormat } from "@/shared/lib"
import { useGoalResourceChips } from "./use-goal-resource-chips"
import type {
  GoalResourceChip,
  GoalResourceChipsInput,
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

  const format = numberFormat(i18n.resolvedLanguage)
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
                  className="-mx-1 flex items-center gap-0.5 rounded-md interactive-surface px-1"
                  data-testid="goal-resource-chip-group"
                  type="button"
                >
                  <ChipFace chip={chip} />
                  <ChevronDown
                    aria-hidden="true"
                    className="size-icon-sm text-muted-foreground"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="gap-2"
                data-testid="goal-resource-chip-breakdown"
              >
                <PopoverTitle>{chip.name}</PopoverTitle>
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
            <HintTrigger
              className="gap-1 tabular-nums"
              hint={<HintLines lines={tooltip(chip).split("\n")} />}
              label={tooltip(chip)}
            >
              <ChipFace chip={chip} />
            </HintTrigger>
          )}
        </li>
      ))}
    </ul>
  )
}

function ChipIcon({ chip }: { chip: GoalResourceChip }) {
  return (
    <span className="relative inline-flex shrink-0">
      <EntityIcon size="icon" alt="" src={chip.icon} />
      {chip.overlay ? (
        <img
          alt=""
          className="absolute top-1/2 left-1/2 size-[70%] -translate-1/2 object-contain"
          src={chip.overlay}
        />
      ) : null}
    </span>
  )
}

/** A chip's icon and figure. Its name is on the control around it (a hint or the rarity popover). */
function ChipFace({ chip }: { chip: GoalResourceChip }) {
  return (
    <span aria-hidden className="flex items-center gap-1 tabular-nums">
      <ChipIcon chip={chip} />
      <span>{chip.display ?? chip.text}</span>
    </span>
  )
}
