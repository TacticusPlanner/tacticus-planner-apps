import { useTranslation } from "react-i18next"
import { characterIcon, onslaughtAllianceIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { formatEventCountdown, useDateLocale } from "@/shared/lib"
import { EntityIcon, EventIcon } from "@/shared/ui"

import type { HreInstanceState } from "../model/use-hre-instance"

/**
 * The HRE tab's event header: the featured hero (icon, localized name, alliance), the window and
 * the countdown, labelled as a preview for an upcoming event. A hero id that does not resolve
 * shows the raw id alone. Loading shows a skeleton, a failed read the retryable error.
 */
export function HreEventHeader({ state }: { state: HreInstanceState }) {
  const { t, i18n } = useTranslation(["hre", "common", "characters"])
  const dateLocale = useDateLocale()

  if (state.status === "loading") {
    return <Skeleton className="h-14 w-full" data-testid="hre-header-loading" />
  }
  if (state.status === "error") {
    return (
      <Alert data-testid="hre-header-error" variant="destructive">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {t("hre:status.error")}
          <Button onClick={state.retry} size="sm" variant="outline">
            {t("hre:status.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  const { instance, hero, nowMs } = state
  if (!instance) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="hre-header-none"
      >
        {t("hre:status.none")}
      </p>
    )
  }

  const startMs = Date.parse(instance.entry.startUtc)
  const endMs = Date.parse(instance.entry.endUtc)
  const running = instance.status === "running"
  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString(dateLocale, { dateStyle: "medium" })
  const name = hero
    ? t(`characters:${hero.id}`, { defaultValue: hero.name })
    : (instance.featuredCharacterId ?? t("hre:status.unknownHero"))
  const icon = hero ? characterIcon(hero.id as UnitId) : undefined

  return (
    <div className="flex items-start gap-3" data-testid="hre-header">
      {icon ? (
        <EntityIcon
          alt=""
          className="size-12 shrink-0 rounded-full"
          src={icon}
        />
      ) : (
        <EventIcon
          className="size-12 shrink-0"
          definitionId={instance.entry.definitionId}
          definitionType="NewCharacterEvent"
        />
      )}
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold" data-testid="hre-header-hero">
            {name}
          </p>
          {hero ? (
            <Badge data-testid="hre-header-alliance" variant="secondary">
              {hero.alliance === "Neutral" ? null : (
                <EntityIcon
                  alt=""
                  className="h-3.5 w-auto"
                  src={onslaughtAllianceIcon(hero.alliance)}
                />
              )}
              {t(`common:alliances.${hero.alliance}` as never, {
                defaultValue: hero.alliance,
              })}
            </Badge>
          ) : null}
          {running ? null : (
            <Badge data-testid="hre-header-preview" variant="outline">
              {t("hre:status.preview")}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {t("hre:status.window", {
            start: formatDate(startMs),
            end: formatDate(endMs),
          })}
          {" · "}
          <span data-testid="hre-header-countdown">
            {t(running ? "hre:status.endsIn" : "hre:status.startsIn", {
              when: formatEventCountdown(
                running ? endMs : startMs,
                nowMs,
                i18n.language
              ),
            })}
          </span>
        </p>
      </div>
    </div>
  )
}
