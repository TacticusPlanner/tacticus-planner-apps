import type { ComponentProps, Ref } from "react"
import { TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The one tab strip for views inside a page or a dialog (ui-style-guide rule 4): left-aligned
 * underline tabs at their natural width, with no border under the strip. When the tabs don't fit,
 * the strip scrolls sideways (on phones too) instead of turning into a select or wrapping. Goes
 * inside a `Tabs` root.
 */
export function PageTabsList({
  className,
  scrollRef,
  scrollTestId,
  ...props
}: Omit<ComponentProps<typeof TabsList>, "variant"> & {
  /** On the scroll box, to keep the selected tab in view. */
  scrollRef?: Ref<HTMLDivElement>
  scrollTestId?: string
}) {
  return (
    // The padding keeps the active tab's underline and the touch hit area inside the scroll box.
    // overflow-y-hidden: overflow-x-auto alone makes overflow-y compute as auto too, which shows a
    // stray vertical scrollbar on a sub-pixel overflow.
    <div
      className="min-w-0 overflow-x-auto overflow-y-hidden pt-1 pb-1.5"
      data-slot="page-tabs-scroll"
      data-testid={scrollTestId}
      ref={scrollRef}
    >
      <TabsList
        className={cn("w-max min-w-full justify-start", className)}
        variant="line"
        {...props}
      />
    </div>
  )
}

/** One tab of a `PageTabsList`: its label's width, never stretched. */
export function PageTabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger className={cn("flex-none px-2.5", className)} {...props} />
  )
}
