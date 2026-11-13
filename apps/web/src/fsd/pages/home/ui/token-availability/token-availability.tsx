import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { gameModeTokenIcon, type GameModeToken } from "@workspace/game-catalog"
import {
  getPlayerDataMetadata,
  type PlayerDataChunkDto,
} from "@workspace/player-data"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { combineReadStates, useReadState } from "@/shared/lib"
import { usePlayerChunk } from "@/shared/local-data"
import { EntityIcon, LocalReadFailure } from "@/shared/ui"

import {
  homeRememberedCounts,
  rememberCount,
  rememberedCount,
} from "../../model/remembered-count"
import { formatExactCountdown } from "./format-exact-countdown"
import {
  cappedFirst,
  tokenCountdown,
  tokenFillPercent,
  tokenFullAtMs,
  type TokenBucketData,
} from "./token-countdown"

const NOW_TICK_MS = 1000

type GameModeTokens = PlayerDataChunkDto<"live-progress">["gameModeTokens"]

type TokenLabelKey = GameModeToken

type TokenEntry = {
  key: string
  labelKey: TokenLabelKey
  bucket: TokenBucketData
}

const tokenLabelI18nKeys = {
  arena: "home.tokens.labels.arena",
  guildRaid: "home.tokens.labels.guildRaid",
  bombTokens: "home.tokens.labels.bombTokens",
  onslaught: "home.tokens.labels.onslaught",
  salvageRun: "home.tokens.labels.salvageRun",
} as const satisfies Record<TokenLabelKey, string>

function collectTokenEntries(tokens: GameModeTokens): TokenEntry[] {
  const entries: TokenEntry[] = []
  if (tokens.arena)
    entries.push({ key: "arena", labelKey: "arena", bucket: tokens.arena })
  if (tokens.guildRaid) {
    entries.push({
      key: "guildRaid",
      labelKey: "guildRaid",
      bucket: tokens.guildRaid.tokens,
    })
    entries.push({
      key: "bombTokens",
      labelKey: "bombTokens",
      bucket: tokens.guildRaid.bombTokens,
    })
  }
  if (tokens.onslaught) {
    entries.push({
      key: "onslaught",
      labelKey: "onslaught",
      bucket: tokens.onslaught,
    })
  }
  if (tokens.salvageRun) {
    entries.push({
      key: "salvageRun",
      labelKey: "salvageRun",
      bucket: tokens.salvageRun,
    })
  }
  return entries
}

function TokenRow({
  entry,
  nowMs,
  observedAtMs,
}: {
  entry: TokenEntry
  nowMs: number
  observedAtMs: number
}) {
  const { t } = useTranslation("common")
  const countdown = tokenCountdown(entry.bucket, observedAtMs, nowMs)

  const countdownText = (() => {
    switch (countdown.kind) {
      case "full":
        return t("home.tokens.full")
      case "due":
        return t("home.tokens.due")
      case "pending":
        return formatExactCountdown(countdown.targetMs, nowMs)
      case "unavailable":
        return null
    }
  })()

  const isCapped = countdown.kind === "full"
  const fullAtMs = tokenFullAtMs(entry.bucket, observedAtMs)
  const fullInSeconds =
    fullAtMs === undefined ? 0 : Math.ceil((fullAtMs - nowMs) / 1000)

  // A ring meter: the conic fill is current/max, red once capped (state by color and text, not motion).
  return (
    <div
      className="flex min-w-0 flex-col items-center gap-1 text-center"
      data-capped={isCapped}
      data-testid={`token-row-${entry.key}`}
    >
      <div
        aria-hidden="true"
        className={cn(
          "grid size-14 place-items-center rounded-full",
          isCapped
            ? "[--token-ring:var(--destructive)]"
            : "[--token-ring:var(--primary)]"
        )}
        style={{
          background: `conic-gradient(var(--token-ring) ${tokenFillPercent(entry.bucket)}%, var(--muted) 0)`,
        }}
      >
        <div className="grid size-11 place-items-center rounded-full bg-card">
          <EntityIcon
            alt=""
            className="size-8"
            src={gameModeTokenIcon(entry.labelKey)}
          />
        </div>
      </div>
      <span className="w-full truncate text-xs text-muted-foreground">
        {t(tokenLabelI18nKeys[entry.labelKey])}
      </span>
      <span className="text-sm leading-none font-semibold tabular-nums">
        {entry.bucket.current}/{entry.bucket.max}
      </span>
      {countdownText ? (
        <span
          className={cn(
            "text-xs tabular-nums",
            isCapped
              ? "font-semibold tracking-wide text-destructive uppercase"
              : "text-muted-foreground"
          )}
        >
          {countdownText}
        </span>
      ) : null}
      {fullInSeconds > 0 ? (
        <span
          className="text-xs/tight text-muted-foreground uppercase tabular-nums"
          data-testid={`token-full-in-${entry.key}`}
        >
          {t("home.tokens.fullIn", {
            hours: Math.floor(fullInSeconds / 3600),
            minutes: String(Math.floor((fullInSeconds % 3600) / 60)).padStart(
              2,
              "0"
            ),
          })}
        </span>
      ) : null}
    </div>
  )
}

/** Token status for the Right now band: one ring per synced token type, capped ones first. */
export function TokenAvailability() {
  const { t } = useTranslation("common")
  // `getPlayerDataMetadata` (not the app-shell's sync-status context, which `pages/home` can't
  // import per this repo's FSD layering) gives the same "live-progress" chunk observation time
  // the Guild Raids page's token countdowns use — see guild-raid-status-view-model.ts. It is a
  // metadata read, so a composite one (every sync refreshes it).
  const read = combineReadStates(
    usePlayerChunk("live-progress"),
    useReadState("player-data-metadata", getPlayerDataMetadata, [])
  )
  const [nowMs, setNowMs] = useState(() => Date.now())
  // As many placeholder rings as there were tokens last time, so the band keeps its height.
  const [placeholders] = useState(() =>
    rememberedCount(homeRememberedCounts.tokens)
  )
  const tokenCount =
    read.status === "ready"
      ? read.data[0]
        ? collectTokenEntries(read.data[0].gameModeTokens).length
        : 0
      : null
  useEffect(() => {
    if (tokenCount !== null) {
      rememberCount(homeRememberedCounts.tokens, tokenCount)
    }
  }, [tokenCount])

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), NOW_TICK_MS)
    return () => window.clearInterval(interval)
  }, [])

  const body = (() => {
    if (read.status === "error") return <LocalReadFailure retry={read.retry} />
    if (read.status === "loading") {
      if (placeholders === 0) {
        // Last time there was no token data: hold the one-line empty state's height.
        return (
          <p
            className="text-sm text-muted-foreground"
            data-testid="token-availability-loading"
            role="status"
          >
            {t("home.tokens.loading")}
          </p>
        )
      }
      // The rings' own footprint, so the band (and Home below it) doesn't grow when they arrive.
      return (
        <div
          className="grid grid-cols-5 gap-1 sm:gap-3"
          data-testid="token-availability-loading"
          role="status"
        >
          <span className="sr-only">{t("home.tokens.loading")}</span>
          {Array.from({ length: placeholders }, (_, index) => (
            <div
              aria-hidden="true"
              className="flex flex-col items-center gap-1"
              key={index}
            >
              <Skeleton className="size-14 rounded-full" />
              <Skeleton className="h-4 w-10 rounded-md" />
              <Skeleton className="h-3.5 w-8 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
          ))}
        </div>
      )
    }

    const [liveProgress, metadata] = read.data
    const entries = liveProgress
      ? collectTokenEntries(liveProgress.gameModeTokens)
      : []
    if (entries.length === 0) {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="token-availability-empty"
        >
          {t("home.tokens.empty")}
        </p>
      )
    }

    const observedAt = metadata.get("live-progress")?.updatedAt
    const observedAtMs = observedAt ? Date.parse(observedAt) : nowMs

    return (
      <div className="grid grid-cols-5 gap-1 sm:gap-3">
        {cappedFirst(entries).map((entry) => (
          <TokenRow
            entry={entry}
            key={entry.key}
            nowMs={nowMs}
            observedAtMs={observedAtMs}
          />
        ))}
      </div>
    )
  })()

  return (
    <section
      aria-label={t("home.tokens.title")}
      data-testid="token-availability"
    >
      {body}
    </section>
  )
}
