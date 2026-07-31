"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

const HEX_COLOR = /^#[0-9a-f]{6}$/i
const FALLBACK_COLOR = "#ffffff"

export type ColorPickerProps = Omit<
  React.ComponentProps<typeof Button>,
  "value" | "onChange" | "onBlur"
> & {
  value: string
  onChange: (value: string) => void
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  name?: string
}

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    {
      value,
      onChange,
      onBlur,
      name,
      className,
      disabled,
      style,
      "aria-label": ariaLabel,
      ...buttonProps
    },
    forwardedRef
  ) => {
    const normalizedValue = value.trim().toLowerCase()
    const parsedValue = HEX_COLOR.test(normalizedValue)
      ? normalizedValue
      : FALLBACK_COLOR
    const [draft, setDraft] = React.useState(parsedValue)

    React.useEffect(() => setDraft(parsedValue), [parsedValue])

    const updateDraft = (next: string) => {
      const normalized = next.trim().toLowerCase()
      setDraft(normalized)
      if (HEX_COLOR.test(normalized)) onChange(normalized)
    }

    const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
      if (!HEX_COLOR.test(draft)) setDraft(parsedValue)
      onBlur?.(event)
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            {...buttonProps}
            aria-label={ariaLabel}
            className={cn("size-7 rounded-full p-0", className)}
            disabled={disabled}
            style={{ ...style, backgroundColor: parsedValue }}
            type="button"
            variant="outline"
          >
            <span className="sr-only">{ariaLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <HexColorPicker color={parsedValue} onChange={updateDraft} />
          <Input
            aria-invalid={!HEX_COLOR.test(draft)}
            aria-label={ariaLabel}
            disabled={disabled}
            maxLength={7}
            name={name}
            onBlur={handleBlur}
            onChange={(event) => updateDraft(event.currentTarget.value)}
            ref={forwardedRef}
            spellCheck={false}
            value={draft}
          />
        </PopoverContent>
      </Popover>
    )
  }
)
ColorPicker.displayName = "ColorPicker"
