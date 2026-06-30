import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"

import type { RankId } from "@workspace/game-catalog"

import { rarityClass } from "@/entities/upgrade"
import { EntityIcon, RankBadge, UpgradeIcon } from "@/shared/ui"

export type LocationView = { battleId: string; label: string; icon?: string }
export type BaseUpgradeView = {
  id: string
  count: number
  label: string
  rarity: string
  locations: LocationView[]
}
export type RecipeView = {
  id: string
  label: string
  count: number
  rarity: string
  children: RecipeView[]
}
export type UpgradeView = {
  id: string
  label: string
  rarity: string
  recipe: RecipeView[]
}
export type RankGroupView = {
  fromRank: RankId
  toRank: RankId
  pointFive?: boolean
  health: UpgradeView[]
  damage: UpgradeView[]
  armour: UpgradeView[]
}

export function RankLookupResults({
  baseUpgrades,
  groups,
  isMobile,
}: {
  baseUpgrades: BaseUpgradeView[]
  groups: RankGroupView[]
  isMobile: boolean
}) {
  const { t } = useTranslation()

  if (baseUpgrades.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        {t("rankLookup.noUpgrades")}
      </p>
    )
  }

  const totalCount = baseUpgrades.reduce((sum, m) => sum + m.count, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <SummaryCard
          label={t("rankLookup.distinctBaseUpgrades")}
          value={baseUpgrades.length}
        />
        <SummaryCard
          label={t("rankLookup.totalBaseUpgrades")}
          value={totalCount}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {t("rankLookup.baseUpgrades")}
        </h2>
        {isMobile ? (
          <BaseUpgradesCards baseUpgrades={baseUpgrades} />
        ) : (
          <BaseUpgradesTable baseUpgrades={baseUpgrades} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("rankLookup.byRank")}</h2>
        {isMobile ? (
          <Accordion type="multiple" className="w-full">
            {groups.map((group, index) => (
              <AccordionItem key={index} value={String(index)}>
                <AccordionTrigger>
                  <RankGroupHeader group={group} />
                </AccordionTrigger>
                <AccordionContent>
                  <RankGroupBody group={group} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-wrap gap-3">
            {groups.map((group, index) => (
              <Card key={index} className="min-w-52 gap-3 py-4">
                <CardHeader className="px-4">
                  <RankGroupHeader group={group} />
                </CardHeader>
                <CardContent className="px-4">
                  <RankGroupBody group={group} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 text-2xl font-semibold tabular-nums">
        {value}
      </CardContent>
    </Card>
  )
}

function BaseUpgradesTable({
  baseUpgrades,
}: {
  baseUpgrades: BaseUpgradeView[]
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              {t("rankLookup.baseUpgrade")}
            </TableHead>
            <TableHead>{t("rankLookup.name")}</TableHead>
            <TableHead className="w-20 text-right">
              {t("rankLookup.count")}
            </TableHead>
            <TableHead className="w-28">{t("rankLookup.rarity")}</TableHead>
            <TableHead>{t("rankLookup.locations")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {baseUpgrades.map((upgrade) => (
            <TableRow key={upgrade.id}>
              <TableCell>
                <UpgradeIcon id={upgrade.id} />
              </TableCell>
              <TableCell className="font-medium">{upgrade.label}</TableCell>
              <TableCell className="text-right tabular-nums">
                {upgrade.count}
              </TableCell>
              <TableCell
                className={cn("font-medium", rarityClass(upgrade.rarity))}
              >
                {upgrade.rarity}
              </TableCell>
              <TableCell>
                <LocationChips locations={upgrade.locations} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function BaseUpgradesCards({
  baseUpgrades,
}: {
  baseUpgrades: BaseUpgradeView[]
}) {
  return (
    <div className="flex flex-col gap-2">
      {baseUpgrades.map((upgrade) => (
        <Card key={upgrade.id} className="gap-2 py-3">
          <CardContent className="flex flex-col gap-2 px-3">
            <div className="flex items-center gap-3">
              <UpgradeIcon id={upgrade.id} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{upgrade.label}</p>
                <p className={cn("text-sm", rarityClass(upgrade.rarity))}>
                  {upgrade.rarity}
                </p>
              </div>
              <span className="text-lg font-semibold tabular-nums">
                ×{upgrade.count}
              </span>
            </div>
            <LocationChips locations={upgrade.locations} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LocationChips({ locations }: { locations: LocationView[] }) {
  if (locations.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {locations.map((location) => (
        <Badge
          key={location.battleId}
          variant="outline"
          className="gap-1 font-normal"
        >
          {location.icon ? (
            <EntityIcon src={location.icon} alt="" className="size-4" />
          ) : null}
          {location.label}
        </Badge>
      ))}
    </div>
  )
}

function RankGroupHeader({ group }: { group: RankGroupView }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <RankBadge rank={group.fromRank} />
      {group.pointFive ? (
        <Badge variant="secondary">{t("rankLookup.pointFiveShort")}</Badge>
      ) : (
        <>
          <span aria-hidden className="text-muted-foreground">
            →
          </span>
          <RankBadge rank={group.toRank} />
        </>
      )}
    </div>
  )
}

function RankGroupBody({ group }: { group: RankGroupView }) {
  return (
    <div className="flex gap-4">
      <StatColumn stat="health" upgrades={group.health} />
      <StatColumn stat="damage" upgrades={group.damage} />
      <StatColumn stat="armour" upgrades={group.armour} />
    </div>
  )
}

const statIcon: Record<string, string> = {
  health: "/snowprint_assets/stat_icons/ui_icon_stat_health_01.png",
  damage: "/snowprint_assets/stat_icons/ui_icon_stat_dmg_01.png",
  armour: "/snowprint_assets/stat_icons/ui_icon_stat_armor_01.png",
}

function StatColumn({
  stat,
  upgrades,
}: {
  stat: string
  upgrades: UpgradeView[]
}) {
  if (upgrades.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-1.5">
      <EntityIcon
        src={statIcon[stat]}
        alt={stat}
        className="size-5 opacity-80"
      />
      {upgrades.map((upgrade) => (
        <UpgradeCell key={upgrade.id} upgrade={upgrade} />
      ))}
    </div>
  )
}

function UpgradeCell({ upgrade }: { upgrade: UpgradeView }) {
  if (upgrade.recipe.length === 0) {
    return <UpgradeIcon id={upgrade.id} />
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={upgrade.label}
          className="rounded-sm ring-offset-background hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <UpgradeIcon id={upgrade.id} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex items-center gap-2 pb-2">
          <UpgradeIcon id={upgrade.id} />
          <span className={cn("font-medium", rarityClass(upgrade.rarity))}>
            {upgrade.label}
          </span>
        </div>
        <RecipeTree items={upgrade.recipe} />
      </PopoverContent>
    </Popover>
  )
}

function RecipeTree({
  items,
  depth = 0,
}: {
  items: RecipeView[]
  depth?: number
}) {
  return (
    <ul
      className={cn(
        "flex flex-col gap-1",
        depth > 0 && "ml-3 border-l border-border pl-3"
      )}
    >
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <UpgradeIcon id={item.id} className="size-6" />
            <span className={rarityClass(item.rarity)}>{item.label}</span>
            <span className="text-muted-foreground tabular-nums">
              ×{item.count}
            </span>
          </div>
          {item.children.length > 0 ? (
            <RecipeTree items={item.children} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  )
}
