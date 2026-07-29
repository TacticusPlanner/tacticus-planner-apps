import { cn } from "@workspace/ui/lib/utils"

import {
  getAccountAvatarColor,
  getAccountInitials,
} from "./account-avatar-model"

export function AccountAvatar({
  applicationAccountId,
  className,
  displayName,
}: {
  applicationAccountId: string | null
  className?: string
  displayName: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        applicationAccountId
          ? getAccountAvatarColor(applicationAccountId)
          : "bg-muted text-muted-foreground",
        className
      )}
      data-testid="auth-account-avatar"
    >
      {getAccountInitials(displayName)}
    </span>
  )
}
