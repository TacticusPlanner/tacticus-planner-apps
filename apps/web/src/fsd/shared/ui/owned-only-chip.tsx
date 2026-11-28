import { useId } from "react"
import { ToggleGroup } from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import { FILTER_CHIP_CLASS_NAME } from "./filter-chip"
import { HintedToggleGroupItem } from "./hinted-toggle-group-item"

/**
 * The "Owned only" filter chip: lists only the units the player owns. Without a synced roster
 * nothing can be owned, so pass `disabledReason`: the chip can't be pressed and says why on hover
 * and to screen readers (beside it as well, with `reasonVisible`). `disabled` turns the chip off
 * entirely, such as while the roster loads; a reason then shows only beside it.
 */
export function OwnedOnlyChip({
  label,
  on,
  onChange,
  disabledReason,
  reasonVisible = false,
  disabled = false,
  size,
  testId,
  reasonTestId,
}: {
  label: string
  on: boolean
  onChange: (on: boolean) => void
  disabledReason?: string
  reasonVisible?: boolean
  disabled?: boolean
  size?: "sm"
  testId?: string
  reasonTestId?: string
}) {
  const reasonId = useId()
  return (
    <>
      <ToggleGroup
        className="shrink-0"
        disabled={disabled}
        onValueChange={(values) => onChange(values.includes("owned"))}
        size={size}
        spacing={1}
        type="multiple"
        value={on ? ["owned"] : []}
        variant="outline"
      >
        <HintedToggleGroupItem
          aria-describedby={disabledReason ? reasonId : undefined}
          className={FILTER_CHIP_CLASS_NAME}
          data-testid={testId}
          // A disabled chip takes no hover, so its reason is only the text beside it.
          disabledReason={disabled ? undefined : disabledReason}
          value="owned"
        >
          {label}
        </HintedToggleGroupItem>
      </ToggleGroup>
      {disabledReason ? (
        <span
          className={cn(
            reasonVisible ? "shrink-0 text-sm text-muted-foreground" : "sr-only"
          )}
          data-testid={reasonTestId}
          id={reasonId}
        >
          {disabledReason}
        </span>
      ) : null}
    </>
  )
}
