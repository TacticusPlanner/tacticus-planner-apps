import type { ComponentProps } from "react"
import { cn } from "@workspace/ui/lib/utils"

export function PageContainer({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-400 flex-col gap-6 p-4 sm:p-6",
        className
      )}
      {...props}
    />
  )
}
