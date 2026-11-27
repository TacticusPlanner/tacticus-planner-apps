import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const pressableVariants = cva(
  "cursor-pointer text-left disabled:cursor-default",
  {
    variants: {
      variant: {
        // A card, tile, list row or chip that acts: the shared gold hover tint and focus ring.
        surface: "interactive-surface",
        // A target that is all art (a portrait with nothing around it): no fill would show.
        art: "rounded-sm hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
      },
    },
    defaultVariants: {
      variant: "surface",
    },
  }
)

/**
 * A `<button>` that is not shaped like a button: a card, tile, row, chip or portrait the user
 * presses (ui-style-guide rule 14). Layout, padding and radius come from `className`; the hover,
 * press and focus styles come from the variant. Text actions use `Button variant="link"` and
 * icon-only actions use `IconButton` instead.
 */
function Pressable({
  className,
  variant,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof pressableVariants>) {
  return (
    <button
      data-slot="pressable"
      data-variant={variant ?? "surface"}
      type={type}
      className={cn(pressableVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Pressable }
