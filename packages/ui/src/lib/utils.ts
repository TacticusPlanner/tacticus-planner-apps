import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The icon size tokens (`size-icon`, `size-icon-sm`, `size-icon-xs`) are named spacing values in
// globals.css; tailwind-merge has to know them, or `cn("size-icon", "size-8")` keeps both.
const twMerge = extendTailwindMerge({
  extend: { theme: { spacing: ["icon", "icon-sm", "icon-xs"] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
