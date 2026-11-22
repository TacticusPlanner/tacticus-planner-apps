import { useId } from "react"
import type { ReactElement, ReactNode } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import { hasNode } from "../lib"

type DetailsProps = {
  title: ReactNode
  /** One line under the title. With `descriptionHidden` it only names the panel for screen readers. */
  description?: ReactNode
  descriptionHidden?: boolean
  /** The tapped item. Leave out when the caller opens the panel from its own state. */
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  testId?: string
  children: ReactNode
}

/**
 * Details of one tapped item on a phone (ui-style-guide rule 8): a bottom sheet as tall as its
 * content (up to 90% of the screen, the rest scrolls), with a drag handle and the page still visible
 * above it. Swipe down, tap outside or Escape closes it.
 */
export function DetailsSheet({
  title,
  description,
  descriptionHidden = false,
  trigger,
  open,
  onOpenChange,
  testId,
  children,
}: DetailsProps) {
  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent
        className="data-[vaul-drawer-direction=bottom]:max-h-[90vh]"
        data-testid={testId}
      >
        <DrawerHeader className="px-2 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {hasNode(description) ? (
            <DrawerDescription className={cn(descriptionHidden && "sr-only")}>
              {description}
            </DrawerDescription>
          ) : null}
        </DrawerHeader>
        <div
          className="min-h-0 flex-1 overflow-y-auto px-2 pb-2"
          data-slot="details-sheet-body"
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * Details of one tapped item: a popover beside the item on desktop, a `DetailsSheet` on a phone.
 * `size="card"` widens the popover for a unit or enemy card (rule 8 widths).
 */
export function DetailsOverlay({
  size = "default",
  trigger,
  ...props
}: DetailsProps & { trigger: ReactElement; size?: "default" | "card" }) {
  const isMobile = useIsMobile()
  const titleId = useId()
  if (isMobile) return <DetailsSheet trigger={trigger} {...props} />

  const { title, description, descriptionHidden, open, onOpenChange, testId } =
    props
  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        aria-labelledby={titleId}
        className={cn(
          "flex max-h-(--radix-popover-content-available-height) max-w-[calc(100vw-2rem)] flex-col gap-3 overflow-y-auto",
          size === "card" ? "w-80" : "w-72"
        )}
        data-testid={testId}
      >
        <PopoverHeader>
          <PopoverTitle id={titleId}>{title}</PopoverTitle>
          {hasNode(description) ? (
            <PopoverDescription
              className={cn("text-xs", descriptionHidden && "sr-only")}
            >
              {description}
            </PopoverDescription>
          ) : null}
        </PopoverHeader>
        {props.children}
      </PopoverContent>
    </Popover>
  )
}
