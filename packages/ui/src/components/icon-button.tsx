"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { Kbd } from "@workspace/ui/components/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useLongPress } from "@workspace/ui/hooks/use-long-press"
import { cn } from "@workspace/ui/lib/utils"

type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "aria-label" | "size" | "title"
> & {
  /** The button's name: its accessible name and its tooltip. */
  label: string
  /** A keyboard shortcut shown after the label in the tooltip ("Ctrl+B"). */
  shortcut?: string
  /** Why the button can't be used now. The button stays focusable and hoverable (`aria-disabled`
   *  rather than `disabled`) so the reason can show; a click does nothing. */
  disabledReason?: string
  size?: "icon" | "icon-xs" | "icon-sm" | "icon-lg"
  side?: React.ComponentProps<typeof TooltipContent>["side"]
}

/**
 * An icon-only button named by a tooltip. Mouse: hover shows the label. Keyboard: focus shows it.
 * Touch: a tap runs the action and a long-press shows the label instead. With `asChild` (an icon
 * link) a long-press is left to the phone's own link menu. With `disabledReason`, every pointer
 * (a tap too) shows the reason, since the button has nothing else to do.
 */
function IconButton({
  label,
  shortcut,
  disabledReason,
  size = "icon",
  variant = "ghost",
  side,
  asChild = false,
  className,
  onClick,
  ...props
}: IconButtonProps) {
  const [open, setOpen] = React.useState(false)
  const reasonId = React.useId()
  const longPress = useLongPress({ onLongPress: () => setOpen(true) })
  const blocked = disabledReason !== undefined

  return (
    <>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild disableTouchToggle={!blocked}>
          <Button
            {...(asChild || blocked ? {} : longPress)}
            {...props}
            aria-describedby={blocked ? reasonId : props["aria-describedby"]}
            aria-disabled={blocked ? true : props["aria-disabled"]}
            aria-label={label}
            asChild={asChild}
            className={cn(
              "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
              className
            )}
            onPointerDown={(event) => {
              // Keep the reason open under a mouse press (Radix closes a tooltip on pointerdown).
              if (blocked && event.pointerType !== "touch")
                event.preventDefault()
              if (!asChild && !blocked) longPress.onPointerDown(event)
              props.onPointerDown?.(event)
            }}
            onClick={(event) => {
              if (blocked) {
                event.preventDefault()
                return
              }
              onClick?.(event)
            }}
            size={size}
            variant={variant}
          />
        </TooltipTrigger>
        <TooltipContent
          className={blocked ? "flex-col items-start" : undefined}
          side={side}
        >
          <span className={blocked ? "font-medium" : undefined}>{label}</span>
          {shortcut && !blocked ? <Kbd>{shortcut}</Kbd> : null}
          {blocked ? <span>{disabledReason}</span> : null}
        </TooltipContent>
      </Tooltip>
      {blocked ? (
        <span hidden id={reasonId}>
          {disabledReason}
        </span>
      ) : null}
    </>
  )
}

export { IconButton, type IconButtonProps }
