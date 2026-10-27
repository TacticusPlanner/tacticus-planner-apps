import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import {
  abilityBadgeIcon,
  forgeBadgeIcon,
  mowComponentIcon,
  orbAllianceIcon,
  orbIcon,
  xpBookIcon,
  type GameIcon,
} from "@workspace/game-catalog"
import { rarityOrder, type Rarity } from "@workspace/game-domain"

import { EntityIcon } from "@/shared/ui"

import type { PlanMissingResources } from "@/features/goal-planning"

const ALLIANCES = ["Imperial", "Xenos", "Chaos"] as const

type Item = {
  key: string
  icon: GameIcon
  overlay?: string
  name: string
  count: number
}

/** The plan's "still missing" totals (V1's "Total Resources Missing"): what the goals need beyond
 *  the current inventory, spent in priority order — ability badges and orbs by alliance, forge
 *  badges, Machine of War components and XP books. */
export function InsightsMissing({
  missing,
}: {
  missing: PlanMissingResources
}) {
  const { t, i18n } = useTranslation()
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage).format(value)
  const rarityName = (rarity: Rarity) =>
    t(`goals.resourceChips.rarity.${rarity}`)

  const byRarity = (
    prefix: string,
    amounts: Partial<Record<Rarity, number>> | undefined,
    item: (rarity: Rarity) => Omit<Item, "key" | "count">
  ): Item[] =>
    rarityOrder
      .filter((rarity) => (amounts?.[rarity] ?? 0) > 0)
      .map((rarity) => ({
        key: `${prefix}:${rarity}`,
        count: amounts?.[rarity] ?? 0,
        ...item(rarity),
      }))

  const rows: { key: string; title: string; items: Item[] }[] = [
    ...ALLIANCES.map((alliance) => ({
      key: `badges:${alliance}`,
      title: t("goals.insights.missingBadges", {
        alliance: t(`alliances.${alliance}`),
      }),
      items: byRarity(alliance, missing.abilityBadges[alliance], (rarity) => ({
        icon: abilityBadgeIcon(rarity, alliance),
        name: t("goals.resourceChips.abilityBadges", {
          rarity: rarityName(rarity),
        }),
      })),
    })),
    ...ALLIANCES.map((alliance) => ({
      key: `orbs:${alliance}`,
      title: t("goals.insights.missingOrbs", {
        alliance: t(`alliances.${alliance}`),
      }),
      items: byRarity(alliance, missing.orbs[alliance], (rarity) => ({
        icon: orbIcon(rarity),
        overlay: orbAllianceIcon(alliance),
        name: t("goals.resourceChips.orbs", { rarity: rarityName(rarity) }),
      })),
    })),
    {
      key: "forge",
      title: t("goals.insights.missingForgeBadges"),
      items: byRarity("forge", missing.forgeBadges, (rarity) => ({
        icon: forgeBadgeIcon(rarity),
        name: t("goals.resourceChips.forgeBadges", {
          rarity: rarityName(rarity),
        }),
      })),
    },
    {
      key: "components",
      title: t("goals.resourceChips.components"),
      items: ALLIANCES.filter(
        (alliance) => (missing.components[alliance] ?? 0) > 0
      ).map((alliance) => ({
        key: alliance,
        icon: mowComponentIcon(alliance),
        name: `${t("goals.resourceChips.components")} (${t(`alliances.${alliance}`)})`,
        count: missing.components[alliance] ?? 0,
      })),
    },
    {
      key: "xp",
      title: t("goals.insights.missingXpBooks", { xp: fmt(missing.xp) }),
      items:
        missing.xpBooks && missing.xpBooks.count > 0
          ? [
              {
                key: missing.xpBooks.rarity,
                icon: xpBookIcon(missing.xpBooks.rarity),
                name: t("goals.resourceChips.xpBooks", {
                  rarity: rarityName(missing.xpBooks.rarity),
                }),
                count: missing.xpBooks.count,
              },
            ]
          : [],
    },
  ].filter((row) => row.items.length > 0)

  return (
    <Card data-testid="insights-missing">
      <CardHeader>
        <CardTitle>{t("goals.insights.missingTitle")}</CardTitle>
        <CardDescription>
          {t("goals.insights.missingDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("goals.insights.missingNone")}
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                className="flex flex-col gap-1.5"
                data-testid="insights-missing-row"
                key={row.key}
              >
                <dt className="text-xs font-medium text-muted-foreground uppercase">
                  {row.title}
                </dt>
                <dd>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {row.items.map((item) => {
                      const label = t("goals.resourceChips.chipLabel", {
                        name: item.name,
                        quantity: fmt(item.count),
                      })
                      return (
                        <li
                          aria-label={label}
                          className="flex items-center gap-1 text-sm font-medium tabular-nums"
                          key={item.key}
                          title={label}
                        >
                          <span className="relative inline-flex">
                            <EntityIcon
                              alt=""
                              className="size-7"
                              src={item.icon}
                            />
                            {item.overlay ? (
                              <img
                                alt=""
                                className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 object-contain"
                                src={item.overlay}
                              />
                            ) : null}
                          </span>
                          <span aria-hidden>{fmt(item.count)}</span>
                        </li>
                      )
                    })}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
