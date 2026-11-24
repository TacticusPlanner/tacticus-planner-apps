import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import type { GoalSelectionPreset } from "@/features/goal-planning"
import { FloatingBar } from "@/shared/ui"

const PRESETS: readonly GoalSelectionPreset[] = [
  "all",
  "none",
  "Active",
  "Paused",
]

/**
 * The Goals selection bar, on the shared `FloatingBar` surface.
 *
 * `top` (desktop, Table and Cards): a sticky bar between the toolbar and the list, above every group,
 * like Gmail's. With nothing selected it holds only the select-all checkbox and its menu (All, None,
 * Active, Paused); from the first selection it adds the count, the bulk actions (`children`) and
 * Clear selection. `onDone` (Cards' select mode) adds Done, which ends the mode.
 *
 * `bottom` (phones): select mode's pill pinned to the bottom of the viewport: the count, Select all,
 * the bulk actions and Done.
 */
export function GoalsSelectBar({
  placement,
  count,
  total,
  onSelectAll,
  onPreset,
  onClear,
  onDone,
  children,
}: {
  placement: "top" | "bottom"
  count: number
  /** How many goals the list shows, for the select-all checkbox's state. */
  total: number
  onSelectAll: () => void
  onPreset: (preset: GoalSelectionPreset) => void
  onClear: () => void
  /** Ends select mode; absent where the checkboxes are always there (the desktop table). */
  onDone?: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const countText = (
    <p
      aria-live="polite"
      className="text-sm font-medium"
      data-testid="goals-select-count"
    >
      {t("goals.bulk.selected", { count })}
    </p>
  )
  const done = onDone ? (
    <Button data-testid="goals-select-done" onClick={onDone}>
      <Check data-icon="inline-start" />
      {t("goals.bulk.selectDone")}
    </Button>
  ) : null

  if (placement === "bottom") {
    return (
      <FloatingBar
        className="sticky bottom-3 flex flex-wrap items-center gap-3 p-2 pl-4"
        data-testid="goals-select-bar"
      >
        {countText}
        <Button
          data-testid="goals-select-bar-all"
          onClick={onSelectAll}
          variant="ghost"
        >
          {t("goals.bulk.selectAll")}
        </Button>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {children}
        </div>
        {done}
      </FloatingBar>
    )
  }

  const allSelected = total > 0 && count === total
  return (
    <FloatingBar
      className={cn(
        "sticky top-2 flex min-h-12 flex-wrap items-center gap-2 p-2",
        // Quiet until something is selected: the bar is always there on the desktop table.
        count === 0 && "bg-card shadow-none ring-border"
      )}
      data-testid="goals-select-bar"
      data-placement="top"
    >
      <div className="flex items-center rounded-md pl-2">
        <Checkbox
          aria-label={t("goals.bulk.selectAll")}
          checked={allSelected ? true : count > 0 ? "indeterminate" : false}
          data-testid="goals-select-all"
          disabled={total === 0}
          onCheckedChange={onSelectAll}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("goals.bulk.selectMenu")}
              data-testid="goals-select-menu"
              disabled={total === 0}
              size="icon-sm"
              variant="ghost"
            >
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PRESETS.map((preset) => (
              <DropdownMenuItem
                data-testid={`goals-select-preset-${preset}`}
                key={preset}
                onSelect={() => onPreset(preset)}
              >
                {t(`goals.bulk.presets.${preset}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {count > 0 ? (
        <>
          {countText}
          <div className="flex flex-1 flex-wrap items-center gap-1">
            {children}
          </div>
          <Button
            data-testid="goals-select-clear"
            onClick={onClear}
            variant="ghost"
          >
            <X data-icon="inline-start" />
            {t("goals.bulk.clearSelection")}
          </Button>
        </>
      ) : (
        <div className="flex-1" />
      )}
      {done}
    </FloatingBar>
  )
}
