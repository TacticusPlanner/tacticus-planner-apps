import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon, factionIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { formatEventCountdown, getDeviceLocale } from "@/shared/lib"
import { EntityIcon, EventIcon } from "@/shared/ui"

import type { QuestInstanceState } from "../model/use-quest-instance"

/** Whether the player owns the shown hero and their current shards; null without synced data. */
export type QuestHeroOwnership = { owned: boolean; shards: number } | null

function FactionList({
  label,
  ids,
  testId,
}: {
  label: string
  ids: readonly string[]
  testId: string
}) {
  const { t } = useTranslation("factions")
  if (ids.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid={testId}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {ids.map((id) => (
        <Badge className="gap-1" key={id} variant="secondary">
          <EntityIcon alt="" className="size-4" src={factionIcon(id)} />
          {t(id as never, { defaultValue: id })}
        </Badge>
      ))}
    </div>
  )
}

/**
 * The Quest tab's header: the featured hero (portrait, localized name, owned or not and shards), the
 * allowed and enemy factions, the lineup rule, and for the current quest its window and countdown,
 * a claim-window warning, or a preview label. `browsing` (another quest picked) drops the window and
 * countdown. An unresolved hero id shows the raw id with no portrait. `picker` sits on the title row.
 */
export function QuestHeader({
  state,
  heroId,
  heroName,
  ownership,
  allowedFactionIds,
  enemyFactionIds,
  browsing,
  picker,
}: {
  state: QuestInstanceState
  heroId: string | null
  /** The catalog name when the id resolves, else undefined (raw id shown, no portrait). */
  heroName: string | undefined
  ownership: QuestHeroOwnership
  allowedFactionIds: readonly string[]
  enemyFactionIds: readonly string[]
  browsing: boolean
  picker: ReactNode
}) {
  const { t, i18n } = useTranslation(["quest", "characters"])

  if (state.status === "loading" && !browsing) {
    return (
      <Skeleton className="h-20 w-full" data-testid="quest-header-loading" />
    )
  }
  if (state.status === "error" && !browsing) {
    return (
      <Alert data-testid="quest-header-error" variant="destructive">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {t("quest:status.error")}
          <Button onClick={state.retry} size="sm" variant="outline">
            {t("quest:status.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  const instance = state.status === "ready" && !browsing ? state.instance : null
  if (!heroId) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-sm text-muted-foreground"
          data-testid="quest-header-none"
        >
          {t("quest:status.none")}
        </p>
        {picker}
      </div>
    )
  }

  const name = heroName
    ? t(`characters:${heroId}`, { defaultValue: heroName })
    : heroId
  const icon = heroName ? characterIcon(heroId as UnitId) : undefined
  const number = new Intl.NumberFormat(i18n.language)
  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString(getDeviceLocale(), { dateStyle: "medium" })
  const nowMs = state.status === "ready" ? state.nowMs : 0

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="quest-header">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <EntityIcon
            alt=""
            className="size-14 shrink-0 rounded-full"
            src={icon}
          />
        ) : (
          <EventIcon
            className="size-14 shrink-0"
            definitionId={instance?.entry.definitionId ?? ""}
            definitionType="Quest"
          />
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold" data-testid="quest-header-hero">
              {name}
            </p>
            {instance?.phase === "preview" ? (
              <Badge data-testid="quest-header-preview" variant="outline">
                {t("quest:status.preview")}
              </Badge>
            ) : null}
          </div>
          <p
            className="text-sm text-muted-foreground"
            data-testid="quest-header-ownership"
          >
            {ownership
              ? t(
                  ownership.owned
                    ? "quest:header.owned"
                    : "quest:header.notOwned",
                  { shards: number.format(ownership.shards) }
                )
              : t("quest:header.noPlayerData")}
          </p>
          {instance ? (
            <p className="text-sm text-muted-foreground">
              {t("quest:status.window", {
                start: formatDate(Date.parse(instance.entry.startUtc)),
                end: formatDate(Date.parse(instance.entry.endUtc)),
              })}
              {instance.phase === "claim" ? null : (
                <>
                  {" · "}
                  <span data-testid="quest-header-countdown">
                    {instance.phase === "running"
                      ? t("quest:status.endsIn", {
                          when: formatEventCountdown(
                            Date.parse(instance.entry.endUtc),
                            nowMs,
                            i18n.language
                          ),
                        })
                      : t("quest:status.startsIn", {
                          when: formatEventCountdown(
                            Date.parse(instance.entry.startUtc),
                            nowMs,
                            i18n.language
                          ),
                        })}
                  </span>
                </>
              )}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">{picker}</div>
      </div>
      {instance?.phase === "claim" ? (
        <Alert data-testid="quest-header-claim">
          <AlertDescription>
            {t("quest:status.claim", {
              when: formatEventCountdown(
                instance.claimEndMs,
                nowMs,
                i18n.language
              ),
            })}
          </AlertDescription>
        </Alert>
      ) : null}
      <FactionList
        ids={allowedFactionIds}
        label={t("quest:header.allowed")}
        testId="quest-header-allowed"
      />
      <FactionList
        ids={enemyFactionIds}
        label={t("quest:header.enemies")}
        testId="quest-header-enemies"
      />
      <p
        className="text-sm text-muted-foreground"
        data-testid="quest-header-rule"
      >
        {t("quest:header.rule", { hero: name })}
      </p>
    </div>
  )
}
