import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  getPlayerDataMetadata,
  type PlayerDataChunkDto,
} from "@workspace/player-data"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import { combineReadStates, useReadState } from "@/shared/lib"
import { usePlayerChunk } from "@/shared/local-data"
import { EntityIcon, LocalReadFailure } from "@/shared/ui"

import arenaTokenIcon from "./assets/arena-token.png"
import bombTokenIcon from "./assets/bomb-token.png"
import guildRaidTokenIcon from "./assets/guild-raid-token.png"
import onslaughtTokenIcon from "./assets/onslaught-token.png"
import salvageRunTokenIcon from "./assets/salvage-run-token.png"
import { formatExactCountdown } from "./format-exact-countdown"
import { tokenCountdown, type TokenBucketData } from "./token-countdown"

const NOW_TICK_MS = 1000

type GameModeTokens = PlayerDataChunkDto<"live-progress">["gameModeTokens"]

type TokenLabelKey =
  "arena" | "guildRaid" | "bombTokens" | "onslaught" | "salvageRun"

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

// Same icon set V1 used per token type (ui_icon_resource_token_*.png / ui_icon_bomb.png).
const tokenIcons = {
  arena: arenaTokenIcon,
  guildRaid: guildRaidTokenIcon,
  bombTokens: bombTokenIcon,
  onslaught: onslaughtTokenIcon,
  salvageRun: salvageRunTokenIcon,
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

  return (
    <div
      className="flex items-center gap-2"
      data-testid={`token-row-${entry.key}`}
    >
      <EntityIcon
        alt=""
        className={cn(
          "size-9 shrink-0",
          isCapped && "animate-pulse drop-shadow-[0_0_6px_var(--destructive)]"
        )}
        src={tokenIcons[entry.labelKey]}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">
          {t(tokenLabelI18nKeys[entry.labelKey])}
        </span>
        <span className="text-base font-semibold tabular-nums">
          {entry.bucket.current} / {entry.bucket.max}
        </span>
        {countdownText ? (
          <span
            className={cn(
              "text-xs",
              isCapped
                ? "font-semibold tracking-wide text-destructive uppercase"
                : "text-muted-foreground"
            )}
          >
            {countdownText}
          </span>
        ) : null}
      </div>
    </div>
  )
}

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

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), NOW_TICK_MS)
    return () => window.clearInterval(interval)
  }, [])

  const body = (() => {
    if (read.status === "error") return <LocalReadFailure retry={read.retry} />
    if (read.status === "loading") {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="token-availability-loading"
        >
          {t("home.tokens.loading")}
        </p>
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
      <div className="flex flex-wrap gap-4">
        {entries.map((entry) => (
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
    <Card data-testid="token-availability">
      <CardHeader>
        <CardTitle>{t("home.tokens.title")}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
