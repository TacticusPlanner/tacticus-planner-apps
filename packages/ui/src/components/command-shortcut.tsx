import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

// Kept apart from command.tsx so a keyboard hint (e.g. in the app shell) does not pull cmdk into
// the importing chunk; command.tsx re-exports it.
function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { CommandShortcut }
