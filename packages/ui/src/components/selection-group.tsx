import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

/**
 * Pick one of a set of items that keep their own look: day cards, colour swatches, unit portraits,
 * map nodes (ui-style-guide rule 3). It gives the items the toggle group's semantics and keyboard
 * (radios with one tab stop and arrow keys between them) and no styling of its own: render each
 * `SelectionItem` `asChild` around its `Pressable`, which keeps its classes.
 *
 * Radix emits `""` when the picked item is pressed again; ignore it when a pick is required, or map
 * it to "none" when the pick can be cleared. For 2–4 labelled options use the segmented
 * `ToggleGroup`; for picking several items give each one `role="checkbox"` and `aria-checked`.
 */
function SelectionGroup(
  props: Omit<
    React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
    "type" | "value" | "defaultValue" | "onValueChange"
  > & {
    value: string
    onValueChange: (value: string) => void
  }
) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="selection-group"
      type="single"
      {...props}
    />
  )
}

function SelectionItem(
  props: React.ComponentProps<typeof ToggleGroupPrimitive.Item>
) {
  return <ToggleGroupPrimitive.Item data-slot="selection-item" {...props} />
}

export { SelectionGroup, SelectionItem }
