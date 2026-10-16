import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import type { LegendaryEventAnnotationStatus } from "@/entities/legendary-event"

import { AnnotationMarkIcon } from "./annotation-mark"

/**
 * An incomplete battle row's action (design D9): Maybe clear, Stop here or Clear marks for every
 * not-cleared cell of the battle at once. `trigger` is the row's control — the "⋯" button at the
 * end of a desktop row, the battle-number button on a mobile row — and must be a single focusable
 * element; `touch` gives the menu rows 40px.
 */
export function BattleAnnotationMenu({
  battle,
  trigger,
  onChange,
  touch = false,
}: {
  /** 1-based battle number. */
  battle: number
  trigger: ReactNode
  onChange: (status: LegendaryEventAnnotationStatus | null) => void
  touch?: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  const row = cn(touch && "min-h-10")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid="battle-annotation-menu">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("annotations.battleMenuLabel", { battle })}
        </DropdownMenuLabel>
        <DropdownMenuItem
          className={row}
          data-testid="battle-annotation-maybeClear"
          onSelect={() => onChange("maybeClear")}
        >
          <AnnotationMarkIcon status="maybeClear" />
          {t("annotations.maybeClear")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={row}
          data-testid="battle-annotation-stopHere"
          onSelect={() => onChange("stopHere")}
        >
          <AnnotationMarkIcon status="stopHere" />
          {t("annotations.stopHere")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={row}
          data-testid="battle-annotation-clear"
          onSelect={() => onChange(null)}
        >
          {t("annotations.clearMarks")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
