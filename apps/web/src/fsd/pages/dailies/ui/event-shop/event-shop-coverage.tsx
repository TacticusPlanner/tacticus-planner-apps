import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"

import { ProjectSelect } from "@/entities/project"
import {
  useEventShopCoverage,
  type CoverageRow,
  type XpPerBook,
} from "@/features/shops/event-planner"
import { EntityIcon } from "@/shared/ui"
import type { Rarity } from "@workspace/game-domain"

import type { DailiesOutletContext } from "../dailies-layout"
import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat, RewardText } from "./use-event-shop-format"

/** A coverage resource's label and icon, through the reward that sells it. */
function useResourceText(format: EventShopFormat) {
  const { t } = useTranslation(["eventShops", "shops", "progression"])
  return (row: CoverageRow, xpBookRarity: Rarity | null): RewardText => {
    const [kind, first, second] = row.resource.split(":")
    if (kind === "badge") return format.reward(`abilityToken${second}_${first}`)
    if (kind === "orb")
      return format.reward(`heroAscensionOrb${second}_${first}`)
    if (kind === "forge") return format.reward(`itemAscensionResource_${first}`)
    if (kind === "component") {
      return {
        label: t("eventShops:coverage.components", {
          alliance: t(`shops:reward.alliance.${first}` as never, {
            defaultValue: first,
          }),
        }),
        iconUrl: format.reward("draft_machinesOfWarTokens").iconUrl,
      }
    }
    if (kind === "xp") {
      return {
        label: xpBookRarity
          ? t("eventShops:coverage.xpBooks", {
              rarity: t(`progression:rarities.${xpBookRarity}` as never, {
                defaultValue: xpBookRarity,
              }),
            })
          : t("eventShops:coverage.xp"),
        iconUrl: format.reward(row.rewardType).iconUrl,
      }
    }
    return format.reward(row.resource)
  }
}

/** XP shows as books of the user's selected rarity; every other resource as its own count. */
function amountIn(
  row: CoverageRow,
  xpPerBook: XpPerBook,
  xpBookRarity: Rarity | null
) {
  const perBook =
    row.resource === "xp" && xpBookRarity ? xpPerBook[xpBookRarity] : undefined
  return (value: number) => (perBook ? Math.ceil(value / perBook) : value)
}

/**
 * Coverage of the Active goals' needs (spec event-shop-planner: Coverage of goal needs): one row per
 * needed resource the event sells, with the full-price estimate and "N short" when the event can't
 * cover it. The scope is all goals or the Dailies project.
 */
export function EventShopCoverage({
  controller,
  format,
  context,
}: {
  controller: EventShopController
  format: EventShopFormat
  context: DailiesOutletContext
}) {
  const { t } = useTranslation("eventShops")
  const resourceText = useResourceText(format)
  const coverage = useEventShopCoverage({
    event: controller.event,
    entries: controller.entries,
    todayIndex: controller.todayIndex,
    projectId: context.projectId,
    lockContext: controller.roster.lockContext,
    powerLevel: controller.roster.powerLevel,
  })
  const unsynced = controller.roster.lockContext === null
  // Nothing is left to buy once the event ends, so there is nothing to compare.
  const ended = controller.status === "ended"

  return (
    <section className="flex flex-col gap-3" data-testid="event-shop-coverage">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t("coverage.title")}</h2>
        {context.projects.length > 0 && !ended ? (
          <ProjectSelect
            allowAll
            compact={false}
            onProjectIdChange={context.setProjectId}
            placeholder={t("coverage.allGoals")}
            projectId={context.projectId}
            projects={context.projects}
            testId="event-shop-coverage-scope"
          />
        ) : null}
      </div>
      {ended ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="event-shop-coverage-ended"
        >
          {t("coverage.ended")}
        </p>
      ) : unsynced ? (
        <p className="text-sm text-muted-foreground">
          {t("coverage.unsynced")}
        </p>
      ) : coverage.status === "loading" ? (
        <p className="text-sm text-muted-foreground">{t("coverage.loading")}</p>
      ) : coverage.status === "error" ? (
        <div className="flex items-center gap-2 text-sm">
          <span>{t("coverage.error")}</span>
          <Button onClick={coverage.retry} size="sm" variant="outline">
            {t("states.retry")}
          </Button>
        </div>
      ) : coverage.status === "noGoals" ? (
        <div
          className="flex flex-col items-start gap-2 text-sm"
          data-testid="event-shop-coverage-no-goals"
        >
          <span>{t("coverage.noGoals")}</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/goals">{t("coverage.goToGoals")}</Link>
          </Button>
        </div>
      ) : coverage.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("coverage.nothing")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {coverage.rows.map((row) => {
            const text = resourceText(row, coverage.xpBookRarity)
            const amount = amountIn(
              row,
              coverage.xpPerBook,
              coverage.xpBookRarity
            )
            return (
              <li
                key={row.resource}
                className="flex items-start gap-2"
                data-testid={`event-shop-coverage-${row.resource}`}
              >
                <EntityIcon
                  alt=""
                  className="size-8 shrink-0"
                  src={text.iconUrl}
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{text.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("coverage.need", {
                      need: format.number(amount(row.need)),
                      planned: format.number(amount(row.planned)),
                    })}
                  </p>
                  {row.short > 0 ? (
                    <p className="text-xs text-destructive">
                      {t("coverage.short", {
                        amount: format.number(amount(row.short)),
                      })}
                      {" · "}
                      {t("coverage.onlyLeft", {
                        amount: format.number(amount(row.maxStillBuyable)),
                      })}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right text-xs">
                  <p className="font-medium">
                    {row.stillNeeded > 0
                      ? t("coverage.stillNeeded", {
                          amount: format.number(amount(row.stillNeeded)),
                        })
                      : t("coverage.covered")}
                  </p>
                  {row.estimate ? (
                    <p className="inline-flex items-center gap-1 text-muted-foreground">
                      <EntityIcon
                        alt=""
                        className="size-4"
                        src={format.currencyIcon(controller.event.currency)}
                      />
                      {t("coverage.cost", {
                        cost: format.number(row.estimate.cost),
                      })}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{t("coverage.hint")}</p>
    </section>
  )
}
