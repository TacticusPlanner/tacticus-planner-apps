import { useTranslation } from "react-i18next"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import {
  abilityBadgeIcon,
  forgeBadgeIcon,
  goldIcon,
  mowComponentIcon,
  onslaughtAllianceIcon,
  orbAllianceIcon,
  orbIcon,
  shardIcon,
  xpBookIcon,
} from "@workspace/game-catalog"
import type { GameIcon } from "@workspace/game-catalog"
import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { usePersistedSelection } from "@/shared/lib"
import { EntityIcon, SegmentedControl } from "@/shared/ui"

import type {
  PlanInsightsTotals,
  PlanMissingResources,
  PlanSpareUpgrade,
  PlanUpgradeMaterial,
} from "@/features/goal-planning"

import {
  isMaterialsShow,
  MATERIALS_SHOW,
  upgradeRowsByRarity,
} from "./insights-materials-view"
import type { MaterialsShow } from "./insights-materials-view"
import { InsightsUpgradeList } from "./insights-upgrade-list"
import type { InsightsGoalInfo } from "./insights-view"

const MATERIALS_SHOW_STORAGE_KEY = "goals.insights.materials-show.v1"

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

/** No goal details: one shared empty map, as the React Compiler can't reorder a `new` default. */
const NO_GOAL_INFO: ReadonlyMap<string, InsightsGoalInfo> = new Map()

/** The plan's shopping list (V1's "Total Resources Missing"), with a "Show" switch remembered per
 *  device. Missing: everything the goals need beyond the current inventory, spent in priority order —
 *  farmed upgrades one by one (with the days and energy left), shards, ability badges and orbs (each
 *  by alliance), Machine of War materials, XP books and gold. Required: every upgrade material the
 *  goals need before stock is spent. Spare: owned upgrade materials no active goal needs. */
export function InsightsMissing({
  missing,
  totals,
  upgrades = [],
  spareUpgrades = [],
  goalInfoById = NO_GOAL_INFO,
  projectId = null,
}: {
  missing: PlanMissingResources
  totals?: PlanInsightsTotals
  upgrades?: readonly PlanUpgradeMaterial[]
  spareUpgrades?: readonly PlanSpareUpgrade[]
  goalInfoById?: ReadonlyMap<string, InsightsGoalInfo>
  projectId?: string | null
}) {
  const { t, i18n } = useTranslation(["common", "progression"])
  const [show, setShow] = usePersistedSelection<MaterialsShow>(
    MATERIALS_SHOW_STORAGE_KEY,
    isMaterialsShow,
    "missing"
  )
  const upgradeGroups = upgradeRowsByRarity(show, upgrades, spareUpgrades)
  const fmt = (value: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage).format(value)
  const rarityName = (rarity: Rarity) => t(`progression:rarities.${rarity}`)

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
      key: "farmed",
      title: t("goals.insights.missingFarmed"),
      showTotal: false,
      rows: [
        {
          key: "shards",
          title: t("goals.insights.missingShards"),
          items: [
            {
              key: "shards",
              icon: shardIcon("Regular"),
              name: t("goals.resourceChips.shards"),
              count: totals?.shards ?? 0,
            },
            {
              key: "mythicShards",
              icon: shardIcon("Mythic"),
              name: t("goals.resourceChips.mythicShards"),
              count: totals?.mythicShards ?? 0,
            },
          ].filter((item) => item.count > 0),
        },
      ],
    },
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
      // Named for what it holds, so a plan short only on gold doesn't read as short on books.
      title:
        missing.gold <= 0
          ? t("goals.insights.missingXpBooks")
          : (missing.xpBooks?.count ?? 0) > 0
            ? t("goals.insights.missingXpBooksAndGold")
            : t("goals.insights.missingGold"),
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
        {
          key: "gold",
          title: t("goals.insights.missingGold"),
          items:
            missing.gold > 0
              ? [
                  {
                    key: "gold",
                    icon: goldIcon(),
                    name: t("goals.resourceChips.gold"),
                    count: missing.gold,
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

  const title = {
    missing: t("goals.insights.missingTitle"),
    required: t("goals.insights.materials.requiredTitle"),
    spare: t("goals.insights.materials.spareTitle"),
  }[show]
  const description = {
    missing: t("goals.insights.missingDescription"),
    required: t("goals.insights.materials.requiredDescription"),
    spare: t("goals.insights.materials.spareDescription"),
  }[show]
  const none = {
    missing: t("goals.insights.missingNone"),
    required: t("goals.insights.materials.requiredNone"),
    spare: t("goals.insights.materials.spareNone"),
  }[show]
  // Required and Spare count upgrade materials only; the other kinds show under Missing.
  const tileGroups = show === "missing" ? groups : []
  const upgradeList =
    upgradeGroups.length > 0 ? (
      <InsightsUpgradeList
        goalInfoById={goalInfoById}
        groups={upgradeGroups}
        projectId={projectId}
      />
    ) : null

  return (
    <Card data-show={show} data-testid="insights-missing">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className="col-span-full row-start-3 justify-self-start md:col-span-1 md:row-span-2 md:row-start-1 md:justify-self-end">
          <SegmentedControl
            label={t("goals.insights.materials.show")}
            onValueChange={setShow}
            options={MATERIALS_SHOW.map((option) => ({
              value: option,
              label: t(`goals.insights.materials.${option}`),
              hint: t(`goals.insights.materials.${option}Hint`),
              testId: `insights-materials-show-${option}`,
            }))}
            testId="insights-materials-show"
            value={show}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {tileGroups.length === 0 && !upgradeList ? (
          <p className="text-sm text-muted-foreground">{none}</p>
        ) : null}
        {upgradeList ? (
          <section
            aria-labelledby="insights-missing-upgrades"
            className="flex flex-col gap-3"
          >
            <h3
              className="border-b pb-1.5 text-sm font-semibold"
              id="insights-missing-upgrades"
            >
              {t("goals.insights.missingUpgrades")}
            </h3>
            {upgradeList}
          </section>
        ) : null}
        {tileGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            {tileGroups.map((group) => {
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
        ) : null}
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
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <li
                    aria-label={label}
                    className="flex items-center gap-1 text-sm font-medium tabular-nums"
                  >
                    <span className="relative inline-flex">
                      <EntityIcon size="icon-lg" alt="" src={item.icon} />
                      {item.overlay ? (
                        <img
                          alt=""
                          className="absolute top-1/2 left-1/2 size-1/2 -translate-1/2 object-contain"
                          src={item.overlay}
                        />
                      ) : null}
                    </span>
                    <span aria-hidden>{fmt(item.count)}</span>
                  </li>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            )
          })}
        </ul>
      </dd>
    </div>
  )
}
