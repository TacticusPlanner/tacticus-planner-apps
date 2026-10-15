import { cn } from "@workspace/ui/lib/utils"

import {
  getAccountAvatarColor,
  getAccountInitials,
} from "./account-avatar-model"

export function AccountAvatar({
  applicationAccountId,
  className,
  displayName,
  pending = false,
}: {
  applicationAccountId: string | null
  className?: string
  displayName: string
  /** The planner identity is still loading: a pulsing placeholder, never initials of a fallback label. */
  pending?: boolean
}) {
  if (pending) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 animate-pulse rounded-full bg-muted",
          className
        )}
        data-pending="true"
        data-testid="auth-account-avatar"
      />
    )
  }

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
