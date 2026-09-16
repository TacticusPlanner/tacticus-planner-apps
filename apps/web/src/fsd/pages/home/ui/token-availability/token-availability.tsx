import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { getPlayerDataMetadata } from "@workspace/player-data"
import { getLiveProgress } from "@workspace/player-data/queries"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { formatRelativeTime } from "@/shared/lib"

import { tokenCountdown, type TokenBucketData } from "./token-countdown"

const NOW_TICK_MS = 30 * 1000
const STALE_THRESHOLD_MS = 5 * 60 * 1000

type GameModeTokens = NonNullable<
  Awaited<ReturnType<typeof getLiveProgress>>
>["gameModeTokens"]

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
  const { t, i18n } = useTranslation("common")
  const countdown = tokenCountdown(entry.bucket, observedAtMs, nowMs)

  const countdownText = (() => {
    switch (countdown.kind) {
      case "full":
        return t("home.tokens.full")
      case "due":
        return t("home.tokens.due")
      case "pending": {
        const relative = formatRelativeTime(countdown.targetMs, i18n.language)
        return relative ? t("home.tokens.nextLabel", { time: relative }) : null
      }
      case "unavailable":
        return null
    }
  })()

  return (
    <div
      className="flex flex-col gap-0.5"
      data-testid={`token-row-${entry.key}`}
    >
      <span className="text-xs text-muted-foreground">
        {t(tokenLabelI18nKeys[entry.labelKey])}
      </span>
      <span className="text-base font-semibold tabular-nums">
        {entry.bucket.current} / {entry.bucket.max}
      </span>
      {countdownText ? (
        <span className="text-xs text-muted-foreground">{countdownText}</span>
      ) : null}
    </div>
  )
}

export function TokenAvailability() {
  const { i18n, t } = useTranslation("common")
  const liveProgress = useLiveQuery(() => getLiveProgress(), [])
  // `getPlayerDataMetadata` (not the app-shell's sync-status context, which `pages/home` can't
  // import per this repo's FSD layering) gives the same "live-progress" chunk observation time
  // the Guild Raids page's token countdowns use — see guild-raid-status-view-model.ts.
  const metadata = useLiveQuery(() => getPlayerDataMetadata(), [])
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), NOW_TICK_MS)
    return () => window.clearInterval(interval)
  }, [])

  const body = (() => {
    if (liveProgress === undefined || metadata === undefined) {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="token-availability-loading"
        >
          {t("home.tokens.loading")}
        </p>
      )
    }

    const entries = collectTokenEntries(liveProgress.gameModeTokens)
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
    const isStale = nowMs - observedAtMs > STALE_THRESHOLD_MS
    const anyCapped = entries.some(
      (entry) =>
        tokenCountdown(entry.bucket, observedAtMs, nowMs).kind === "full"
    )

    return (
      <div className="flex flex-col gap-3">
        {anyCapped && isStale ? (
          <div
            className="flex flex-col gap-0.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2"
            data-testid="token-availability-stale-banner"
          >
            <p className="text-sm font-medium">
              {t("home.tokens.syncBanner.title")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("home.tokens.syncBanner.description", {
                time: formatRelativeTime(observedAtMs, i18n.language) ?? "",
              })}
            </p>
          </div>
        ) : null}
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
