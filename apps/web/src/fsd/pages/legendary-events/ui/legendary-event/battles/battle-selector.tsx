import { useTranslation } from "react-i18next"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import type { BattlePreviewViewModel } from "./battles.view-model"

/**
 * Picks the lane's battle (design D4). Desktop: one toggle per battle number, complete battles
 * marked with a check and sr-only "complete". Mobile: Previous / a "Battle N of M" menu listing
 * every battle / Next, the steppers disabled at the bounds.
 */
export function BattleSelector({
  battles,
  selectedIndex,
  onSelect,
  isMobile,
}: {
  battles: readonly BattlePreviewViewModel[]
  selectedIndex: number
  onSelect: (index: number) => void
  isMobile: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const total = battles.length
  const selected = battles[selectedIndex]

  if (!isMobile) {
    return (
      <ToggleGroup
        aria-label={t("battles.selector.label")}
        className="flex-wrap"
        data-testid="battle-selector"
        onValueChange={(value) => {
          // A pressed toggle stays pressed: single-choice, never empty.
          if (value) onSelect(Number(value))
        }}
        size="sm"
        spacing={1}
        type="single"
        value={String(selectedIndex)}
        variant="outline"
      >
        {battles.map((battle, index) => (
          <ToggleGroupItem
            aria-label={
              battle.complete
                ? t("battles.selector.itemComplete", { number: battle.number })
                : String(battle.number)
            }
            className="min-w-9 gap-0.5 tabular-nums"
            data-complete={battle.complete}
            data-testid="battle-selector-item"
            key={battle.id}
            value={String(index)}
          >
            {battle.number}
            {battle.complete ? (
              <CheckIcon aria-hidden className="size-3" />
            ) : null}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    )
  }

  return (
    <div className="flex items-center gap-2" data-testid="battle-selector">
      <Button
        aria-label={t("battles.selector.previous")}
        className="size-11"
        data-testid="battle-selector-previous"
        disabled={selectedIndex <= 0}
        onClick={() => onSelect(selectedIndex - 1)}
        size="icon"
        variant="outline"
      >
        <ChevronLeft />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-11 flex-1"
            data-testid="battle-selector-menu"
            variant="outline"
          >
            {t("battles.selector.position", {
              number: selected?.number ?? selectedIndex + 1,
              total,
            })}
            {selected?.complete ? (
              <>
                <CheckIcon aria-hidden className="size-4" />
                <span className="sr-only">
                  {" "}
                  {t("battles.selector.complete")}
                </span>
              </>
            ) : null}
            <ChevronDownIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-80 overflow-y-auto">
          <DropdownMenuRadioGroup
            onValueChange={(value) => onSelect(Number(value))}
            value={String(selectedIndex)}
          >
            {battles.map((battle, index) => (
              <DropdownMenuRadioItem
                className="min-h-11"
                data-testid="battle-selector-option"
                key={battle.id}
                value={String(index)}
              >
                {t("battles.battleTitle", { number: battle.number })}
                {battle.complete ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t("battles.selector.complete")}
                  </span>
                ) : null}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        aria-label={t("battles.selector.next")}
        className="size-11"
        data-testid="battle-selector-next"
        disabled={selectedIndex >= total - 1}
        onClick={() => onSelect(selectedIndex + 1)}
        size="icon"
        variant="outline"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
