import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"

import { RaidBossPortrait } from "@/entities/raid-boss"
import { formatRelativeTime } from "@/shared/lib"
import type { GuildRaidDifficulty } from "@/entities/guild-raid-status"

import type { GuildRaidSeasonView } from "../guild-raid-status-view-model"

// `season.difficulty.toLowerCase()` would widen to plain `string`, which the strictly-typed `dailies`
// i18next namespace rejects as a template-literal key — this keeps the lookup exhaustive and literal.
const difficultyKeys = {
  Common: "common",
  Uncommon: "uncommon",
  Rare: "rare",
  Epic: "epic",
  Legendary: "legendary",
  Mythic: "mythic",
} as const satisfies Record<GuildRaidDifficulty, string>

function SeasonEndsLabel({ season }: { season: GuildRaidSeasonView }) {
  const { t, i18n } = useTranslation("dailies")
  const { endsAt } = season

  const text =
    endsAt.kind === "pending"
      ? (() => {
          const relative = formatRelativeTime(endsAt.targetMs, i18n.language)
          return relative
            ? t("guildRaids.status.seasonEndsLabel", { time: relative })
            : t("guildRaids.status.seasonEndsUnavailable")
        })()
      : endsAt.kind === "due"
        ? t("guildRaids.status.seasonEndingSoon")
        : t("guildRaids.status.seasonEndsUnavailable")

  return (
    <span
      className="text-xs text-muted-foreground"
      data-testid="guild-raid-season-ends"
    >
      {text}
    </span>
  )
}

export function GuildRaidBossCard({
  isMobile,
  season,
}: {
  isMobile: boolean
  season: GuildRaidSeasonView
}) {
  const { t } = useTranslation("dailies")
  const { boss } = season
  const hpPercent =
    boss.maximumHp > 0
      ? Math.max(0, Math.min(100, (boss.remainingHp / boss.maximumHp) * 100))
      : 0

  const difficultyBadge = (
    <Badge data-testid="guild-raid-difficulty-badge" variant="outline">
      {t(`guildRaids.status.difficulty.${difficultyKeys[season.difficulty]}`)}
    </Badge>
  )
  const positionLabel = (
    <span
      className="text-xs text-muted-foreground"
      data-testid="guild-raid-position-label"
    >
      {t("guildRaids.status.positionLabel", {
        tier: season.tierNumber,
        set: season.setNumber,
        count: season.setCount,
      })}
    </span>
  )
  const upcomingBadge = boss.isUpcoming ? (
    <Badge data-testid="guild-raid-boss-upcoming-badge" variant="secondary">
      {t("guildRaids.status.upcomingBadge")}
    </Badge>
  ) : null
  const hpText = t("guildRaids.status.hp", {
    remaining: boss.remainingHp,
    max: boss.maximumHp,
  })

  if (isMobile) {
    return (
      <Card data-testid="guild-raid-boss-card">
        <CardContent className="flex items-center gap-3 p-3">
          <RaidBossPortrait
            className="size-10 shrink-0"
            name={boss.name}
            src={boss.portraitSrc}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{boss.name}</span>
              {upcomingBadge}
            </div>
            <div
              className="flex flex-col gap-0.5"
              data-testid="guild-raid-boss-hp"
            >
              <Progress
                className="h-1.5"
                indicatorClassName="bg-destructive"
                value={hpPercent}
              />
              <span className="text-xs text-muted-foreground">{hpText}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {difficultyBadge}
              {positionLabel}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="guild-raid-boss-card">
      <CardHeader className="flex-row items-center gap-3">
        <RaidBossPortrait
          name={boss.name}
          src={boss.portraitSrc}
          className="size-14"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <CardDescription>{t("guildRaids.status.bossLabel")}</CardDescription>
          <CardTitle className="truncate">{boss.name}</CardTitle>
        </div>
        {upcomingBadge}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {difficultyBadge}
          {positionLabel}
        </div>
        <div className="flex flex-col gap-1" data-testid="guild-raid-boss-hp">
          <Progress indicatorClassName="bg-destructive" value={hpPercent} />
          <span className="text-sm text-muted-foreground">{hpText}</span>
        </div>
        <SeasonEndsLabel season={season} />
      </CardContent>
    </Card>
  )
}
