"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

// Radix's Tooltip only opens on hover/focus and explicitly ignores touch pointers (there's no
// hover on touch devices), so tapping a trigger on mobile never shows it. This context lets
// TooltipTrigger toggle `open` itself on tap, alongside Radix's own hover/focus handling for
// mouse/keyboard users, and TooltipContent closes it again on the next tap anywhere else.
const TooltipTouchContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

function Tooltip({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false
  )
  const open = openProp ?? uncontrolledOpen
  const setOpen = React.useCallback(
    (value: boolean) => {
      setUncontrolledOpen(value)
      onOpenChange?.(value)
    },
    [onOpenChange]
  )

  return (
    <TooltipTouchContext.Provider value={{ open, setOpen }}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        onOpenChange={setOpen}
        {...props}
      />
    </TooltipTouchContext.Provider>
  )
}

function TooltipTrigger({
  onClick,
  onPointerDown,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const context = React.useContext(TooltipTouchContext)
  const isTouchRef = React.useRef(false)

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onPointerDown={(event) => {
        onPointerDown?.(event)
        isTouchRef.current = event.pointerType === "touch"
      }}
      onClick={(event) => {
        onClick?.(event)
        // Radix ignores touch pointers when deciding whether hover opened it — toggle ourselves.
        if (isTouchRef.current) context?.setOpen(!context.open)
      }}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const context = React.useContext(TooltipTouchContext)

  // While a touch-opened tooltip is showing, close it on the next tap anywhere else. Deferred by
  // a tick so the very tap that opened it doesn't immediately close it too.
  React.useEffect(() => {
    if (!context?.open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return
      context.setOpen(false)
    }
    const id = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [context])

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=left]:translate-x-[-1.5px] data-[side=right]:translate-x-[1.5px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
