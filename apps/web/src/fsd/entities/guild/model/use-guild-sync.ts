import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"

import { ApiError } from "@/shared/api"

import { syncMyGuild, type RegisteredGuild } from "../api/guild.api"

/** Used when a 429 carries no usable Retry-After (the API always sends one; this is a fallback). */
const DEFAULT_COOLDOWN_SECONDS = 60

const issueOf = (error: unknown) =>
  error instanceof ApiError ? error.issueCode : undefined
const isCooldown = (error: unknown) =>
  issueOf(error) === "guildSyncCooldown" || issueOf(error) === "rateLimited"

/**
 * `POST guild/sync` for both Sync buttons. A 429 (`guildSyncCooldown`: someone synced this guild
 * within the last minute, or the caller's `rateLimited` upstream budget) starts a countdown from its
 * `Retry-After`; while it runs the button stays disabled and the message names the seconds left. A
 * 403 (the caller is no longer Leader/Co-Leader) reads as its own translated message; anything else
 * shows the server's text.
 */
export function useGuildSync(onSynchronized: (guild: RegisteredGuild) => void) {
  const { t } = useTranslation()
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  // Which 429 started the countdown: this guild's sync cooldown, or the caller's own request budget.
  const [rateLimited, setRateLimited] = useState(false)
  const mutation = useMutation({
    mutationFn: syncMyGuild,
    onSuccess: onSynchronized,
    onError: (error) => {
      if (isCooldown(error)) {
        setRateLimited(issueOf(error) === "rateLimited")
        setCooldownSeconds(
          (error as ApiError).retryAfterSeconds || DEFAULT_COOLDOWN_SECONDS
        )
      }
    },
  })

  const coolingDown = cooldownSeconds > 0
  useEffect(() => {
    if (!coolingDown) return
    const timer = setInterval(
      () => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)),
      1000
    )
    return () => clearInterval(timer)
  }, [coolingDown])

  const error = mutation.error
  const errorMessage = coolingDown
    ? t(
        rateLimited
          ? "guild.summary.syncRateLimited"
          : "guild.summary.syncCooldown",
        { count: cooldownSeconds }
      )
    : !error || isCooldown(error)
      ? null
      : issueOf(error) === "forbidden"
        ? t("guild.summary.syncForbidden")
        : error instanceof ApiError
          ? error.message
          : t("guild.summary.syncError")

  return {
    sync: () => {
      if (!mutation.isPending && !coolingDown) mutation.mutate()
    },
    syncing: mutation.isPending,
    coolingDown,
    errorMessage,
  }
}
