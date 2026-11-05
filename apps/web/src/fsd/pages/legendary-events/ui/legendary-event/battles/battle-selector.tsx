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
 * Picks the lane's battle (design D4). Desktop: Previous / one toggle per battle number, complete
 * battles marked with a check and sr-only "complete" / Next. Mobile: Previous / a "Battle N of M"
 * menu listing every battle / Next. The steppers are disabled at the bounds.
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

  const previous = (
    <StepButton
      direction="previous"
      disabled={selectedIndex <= 0}
      isMobile={isMobile}
      onPress={() => onSelect(selectedIndex - 1)}
    />
  )
  const next = (
    <StepButton
      direction="next"
      disabled={selectedIndex >= total - 1}
      isMobile={isMobile}
      onPress={() => onSelect(selectedIndex + 1)}
    />
  )

  if (!isMobile) {
    return (
      <div className="flex min-w-0 items-start gap-1">
        {previous}
        <ToggleGroup
          aria-label={t("battles.selector.label")}
          className="min-w-0 flex-wrap"
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
                  ? t("battles.selector.itemComplete", {
                      number: battle.number,
                    })
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
        {next}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2" data-testid="battle-selector">
      {previous}
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
      {next}
    </div>
  )
}

function StepButton({
  direction,
  disabled,
  isMobile,
  onPress,
}: {
  direction: "previous" | "next"
  disabled: boolean
  isMobile: boolean
  onPress: () => void
}) {
  const { t } = useTranslation("legendaryEvents")
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight
  return (
    <Button
      aria-label={t(`battles.selector.${direction}`)}
      className={isMobile ? "size-11" : "size-8 shrink-0"}
      data-testid={`battle-selector-${direction}`}
      disabled={disabled}
      onClick={onPress}
      size="icon"
      variant="outline"
    >
      <Icon />
    </Button>
  )
}
