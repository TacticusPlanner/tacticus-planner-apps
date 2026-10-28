import type { ComponentProps } from "react"
import { cn } from "@workspace/ui/lib/utils"

/** Page padding and width. A plain div: the shell owns the one `main` landmark around every route. */
export function PageContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-400 flex-col gap-6 p-4 sm:p-6",
        className
      )}
      {...props}
    />
  )
}
