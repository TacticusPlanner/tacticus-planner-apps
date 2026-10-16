import { X } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

/** A selected member (or the reserve) above the picker grid, with its remove button. */
export function SelectedChip({
  unitId,
  label,
  removeLabel,
  onRemove,
  reserve = false,
}: {
  unitId: string
  label: string
  removeLabel: string
  onRemove: () => void
  reserve?: boolean
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-1 rounded-full border bg-muted/40 py-0.5 pr-0.5 pl-0.5 text-xs",
        reserve && "border-dashed"
      )}
      data-reserve={reserve ? "true" : undefined}
      data-testid="team-picker-selected-unit"
      data-unit={unitId}
    >
      <EntityIcon
        alt=""
        className="size-5 rounded-full"
        src={characterIcon(unitId as UnitId)}
      />
      <span className="max-w-32 truncate">{label}</span>
      <Button
        aria-label={removeLabel}
        onClick={onRemove}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <X />
      </Button>
    </li>
  )
}
