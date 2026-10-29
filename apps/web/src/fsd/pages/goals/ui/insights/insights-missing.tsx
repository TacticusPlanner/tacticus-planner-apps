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
  onslaughtAllianceIcon,
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

type Row = {
  key: string
  title: string
  /** The alliance emblem of an alliance-split row. */
  titleIcon?: string
  items: Item[]
}

/** The plan's "still missing" totals (V1's "Total Resources Missing"): what the goals need beyond
 *  the current inventory, spent in priority order — grouped into ability badges and orbs (each by
 *  alliance), Machine of War materials (forge badges and components) and XP books. */
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

  const allianceRows = (
    prefix: string,
    items: (alliance: (typeof ALLIANCES)[number]) => Item[]
  ): Row[] =>
    ALLIANCES.map((alliance) => ({
      key: `${prefix}:${alliance}`,
      titleIcon: onslaughtAllianceIcon(alliance),
      title: t(`alliances.${alliance}`),
      items: items(alliance),
    }))

  /** One block per resource kind, so badges, orbs, Machine of War materials and XP books read apart
   *  rather than as one run of rows. Badge and orb groups carry their total across alliances. */
  const groups: {
    key: string
    title: string
    showTotal: boolean
    rows: Row[]
  }[] = [
    {
      key: "badges",
      title: t("goals.insights.missingAbilityBadges"),
      showTotal: true,
      rows: allianceRows("badges", (alliance) =>
        byRarity(alliance, missing.abilityBadges[alliance], (rarity) => ({
          icon: abilityBadgeIcon(rarity, alliance),
          name: t("goals.resourceChips.abilityBadges", {
            rarity: rarityName(rarity),
          }),
        }))
      ),
    },
    {
      key: "orbs",
      title: t("goals.insights.missingOrbs"),
      showTotal: true,
      rows: allianceRows("orbs", (alliance) =>
        byRarity(alliance, missing.orbs[alliance], (rarity) => ({
          icon: orbIcon(rarity),
          overlay: orbAllianceIcon(alliance),
          name: t("goals.resourceChips.orbs", { rarity: rarityName(rarity) }),
        }))
      ),
    },
    {
      key: "mow",
      title: t("goals.insights.missingMachineOfWar"),
      showTotal: false,
      rows: [
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
          title: t("goals.insights.missingComponents"),
          items: ALLIANCES.filter(
            (alliance) => (missing.components[alliance] ?? 0) > 0
          ).map((alliance) => ({
            key: alliance,
            icon: mowComponentIcon(alliance),
            name: `${t("goals.resourceChips.components")} (${t(`alliances.${alliance}`)})`,
            count: missing.components[alliance] ?? 0,
          })),
        },
      ],
    },
    {
      key: "xp",
      title: t("goals.insights.missingXpBooks"),
      showTotal: false,
      rows: [
        {
          key: "xp",
          title: t("goals.insights.missingXp", { xp: fmt(missing.xp) }),
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
      ],
    },
  ]
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => row.items.length > 0),
    }))
    .filter((group) => group.rows.length > 0)

  return (
    <Card data-testid="insights-missing">
      <CardHeader>
        <CardTitle>{t("goals.insights.missingTitle")}</CardTitle>
        <CardDescription>
          {t("goals.insights.missingDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("goals.insights.missingNone")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
            {groups.map((group) => {
              const total = group.rows
                .flatMap((row) => row.items)
                .reduce((sum, item) => sum + item.count, 0)
              return (
                <section
                  aria-labelledby={`insights-missing-${group.key}`}
                  className="flex flex-col gap-3"
                  data-testid="insights-missing-group"
                  key={group.key}
                >
                  <h3
                    className="flex items-baseline justify-between gap-2 border-b pb-1.5 text-sm font-semibold"
                    id={`insights-missing-${group.key}`}
                  >
                    <span>{group.title}</span>
                    {group.showTotal ? (
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">
                        {t("goals.insights.missingTotal", {
                          total: fmt(total),
                        })}
                      </span>
                    ) : null}
                  </h3>
                  <dl className="flex flex-col gap-3">
                    {group.rows.map((row) => (
                      <MissingRow fmt={fmt} key={row.key} row={row} />
                    ))}
                  </dl>
                </section>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MissingRow({
  row,
  fmt,
}: {
  row: Row
  fmt: (value: number) => string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5" data-testid="insights-missing-row">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase">
        {row.titleIcon ? (
          <EntityIcon
            alt=""
            className="h-4 w-auto shrink-0"
            height={16}
            src={row.titleIcon}
            width={16}
          />
        ) : null}
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
                  <EntityIcon alt="" className="size-7" src={item.icon} />
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
  )
}
