import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The icon and portrait size tokens (`size-icon-*`, `size-portrait-*`) are named spacing values in
// globals.css; tailwind-merge has to know them, or `cn("size-icon", "size-icon-lg")` keeps both.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [
        "icon-xs",
        "icon-sm",
        "icon",
        "icon-md",
        "icon-lg",
        "icon-xl",
        "icon-2xl",
        "portrait-sm",
        "portrait-md",
        "portrait-lg",
        "portrait-xl",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
