import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { cn } from "@workspace/ui/lib/utils"

import type { UnitTileUnit } from "@/entities/unit"

import type { CollectionSelection } from "../../model/collection-selection"

/**
 * A tile or roster row in select mode: the unit stays visible but inert (no link), covered by a
 * toggle button with a checkbox mark. Outside select mode it renders the unit as is.
 *
 * `checkbox` (the desktop Roster, like the Goals table): a leading checkbox always shown, with or
 * without select mode, and the row's link keeps working beside it.
 */
export function SelectableUnit({
  unit,
  selection,
  checkbox = false,
  children,
}: {
  unit: UnitTileUnit
  selection: CollectionSelection | undefined
  checkbox?: boolean
  children: ReactNode
}) {
  const { t } = useTranslation("common")
  if (selection && checkbox) {
    return (
      <div className="flex items-center gap-1 pl-2">
        <Checkbox
          aria-label={t("myGame.collection.select.unit", { name: unit.name })}
          checked={selection.isSelected(unit)}
          data-testid="collection-select-unit"
          onCheckedChange={() => selection.toggle(unit)}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    )
  }
  if (!selection?.active) return children
  const selected = selection.isSelected(unit)
  return (
    <div className="relative">
      <div inert>{children}</div>
      <button
        aria-label={t("myGame.collection.select.unit", { name: unit.name })}
        aria-pressed={selected}
        className={cn(
          "absolute inset-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selected && "bg-primary/10 ring-2 ring-primary"
        )}
        data-testid="collection-select-unit"
        onClick={() => selection.toggle(unit)}
        type="button"
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1 right-1 flex size-5 items-center justify-center rounded-sm border bg-background shadow-xs",
            selected && "border-primary bg-primary text-primary-foreground"
          )}
        >
          {selected ? <Check className="size-3.5" /> : null}
        </span>
      </button>
    </div>
  )
}
