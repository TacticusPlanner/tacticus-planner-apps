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

import {
  rarityClass,
  statIcon,
  type Rank,
  type Rarity,
  type StatIconKind,
} from "@workspace/game-catalog"

import { EntityIcon, RankBadge, RarityIcon, UpgradeIcon } from "@/shared/ui"

export type LocationView = { id: string; label: string; icon?: string }
export type BaseUpgradeView = {
  id: string
  count: number
  label: string
  rarity: Rarity
  crafted: boolean
  campaignLocations: LocationView[]
  eventLocations: LocationView[]
}
export type RecipeView = {
  id: string
  label: string
  count: number
  rarity: Rarity
  crafted: boolean
  children: RecipeView[]
}
export type UpgradeView = {
  id: string
  label: string
  rarity: Rarity
  crafted: boolean
  recipe: RecipeView[]
}
export type RankGroupView = {
  fromRank: Rank
  toRank: Rank
  pointFive?: boolean
  health: UpgradeView[]
  damage: UpgradeView[]
  armour: UpgradeView[]
}

export function CharacterLookupResults({
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
        {t("unitLookup.noUpgrades")}
      </p>
    )
  }

  const totalCount = baseUpgrades.reduce((sum, m) => sum + m.count, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <SummaryCard
          label={t("unitLookup.distinctBaseUpgrades")}
          value={baseUpgrades.length}
        />
        <SummaryCard
          label={t("unitLookup.totalBaseUpgrades")}
          value={totalCount}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("unitLookup.byRank")}</h2>
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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
            {groups.map((group, index) => (
              <Card key={index} className="gap-3 py-4">
                <CardHeader className="flex justify-center px-4">
                  <RankGroupHeader group={group} compact />
                </CardHeader>
                <CardContent className="px-4">
                  <RankGroupBody group={group} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {t("unitLookup.baseUpgrades")}
        </h2>
        {isMobile ? (
          <BaseUpgradesCards baseUpgrades={baseUpgrades} />
        ) : (
          <BaseUpgradesTable baseUpgrades={baseUpgrades} />
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
              {t("unitLookup.baseUpgrade")}
            </TableHead>
            <TableHead>{t("unitLookup.name")}</TableHead>
            <TableHead className="w-20 text-right">
              {t("unitLookup.count")}
            </TableHead>
            <TableHead className="w-28">{t("unitLookup.rarity")}</TableHead>
            <TableHead className="max-w-48">
              {t("unitLookup.campaignLocations")}
            </TableHead>
            <TableHead className="max-w-48">
              {t("unitLookup.eventLocations")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {baseUpgrades.map((upgrade) => (
            <TableRow key={upgrade.id}>
              <TableCell>
                <UpgradeIcon
                  id={upgrade.id}
                  rarity={upgrade.rarity}
                  crafted={upgrade.crafted}
                  className="size-12"
                />
              </TableCell>
              <TableCell className="font-medium">{upgrade.label}</TableCell>
              <TableCell className="text-right tabular-nums">
                {upgrade.count}
              </TableCell>
              <TableCell>
                <RarityIcon rarity={upgrade.rarity} />
              </TableCell>
              <TableCell className="max-w-48 whitespace-normal">
                <LocationChips locations={upgrade.campaignLocations} />
              </TableCell>
              <TableCell className="max-w-48 whitespace-normal">
                <LocationChips locations={upgrade.eventLocations} />
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
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      {baseUpgrades.map((upgrade) => (
        <Card key={upgrade.id} className="gap-2 py-3">
          <CardContent className="flex flex-col gap-2 px-3">
            <div className="flex items-center gap-3">
              <UpgradeIcon
                id={upgrade.id}
                rarity={upgrade.rarity}
                crafted={upgrade.crafted}
                className="size-15"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{upgrade.label}</p>
                <RarityIcon rarity={upgrade.rarity} className="size-8" />
              </div>
              <span className="text-lg font-semibold tabular-nums">
                ×{upgrade.count}
              </span>
            </div>
            <LocationSection
              label={t("unitLookup.campaignLocations")}
              locations={upgrade.campaignLocations}
            />
            <LocationSection
              label={t("unitLookup.eventLocations")}
              locations={upgrade.eventLocations}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LocationSection({
  label,
  locations,
}: {
  label: string
  locations: LocationView[]
}) {
  if (locations.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <LocationChips locations={locations} />
    </div>
  )
}

function LocationChips({ locations }: { locations: LocationView[] }) {
  if (locations.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {locations.map((location) => (
        <Badge
          key={location.id}
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

function RankGroupHeader({
  group,
  compact = false,
}: {
  group: RankGroupView
  compact?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <RankBadge
        rank={group.fromRank}
        iconClassName="size-8"
        showLabel={!compact}
      />
      {group.pointFive ? (
        <Badge variant="secondary">{t("unitLookup.pointFiveShort")}</Badge>
      ) : (
        <>
          <span aria-hidden className="text-muted-foreground">
            →
          </span>
          <RankBadge
            rank={group.toRank}
            iconClassName="size-8"
            showLabel={!compact}
          />
        </>
      )}
    </div>
  )
}

function RankGroupBody({ group }: { group: RankGroupView }) {
  return (
    <div className="flex justify-center gap-4">
      <StatColumn stat="health" upgrades={group.health} />
      <StatColumn stat="damage" upgrades={group.damage} />
      <StatColumn stat="armour" upgrades={group.armour} />
    </div>
  )
}

function StatColumn({
  stat,
  upgrades,
}: {
  stat: StatIconKind
  upgrades: UpgradeView[]
}) {
  if (upgrades.length === 0) return null
  return (
    <div className="flex flex-col items-center gap-1.5">
      <EntityIcon
        src={statIcon(stat)}
        alt={stat}
        className="size-8 opacity-80"
      />
      {upgrades.map((upgrade) => (
        <UpgradeCell key={upgrade.id} upgrade={upgrade} />
      ))}
    </div>
  )
}

function UpgradeCell({ upgrade }: { upgrade: UpgradeView }) {
  const hasRecipe = upgrade.recipe.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={upgrade.label}
          className="rounded-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
        >
          <UpgradeIcon
            id={upgrade.id}
            rarity={upgrade.rarity}
            crafted={upgrade.crafted}
            className="size-12"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className={cn("flex items-center gap-2", hasRecipe && "pb-2")}>
          <UpgradeIcon
            id={upgrade.id}
            rarity={upgrade.rarity}
            crafted={upgrade.crafted}
          />
          <span className={cn("font-medium", rarityClass(upgrade.rarity))}>
            {upgrade.label}
          </span>
        </div>
        {hasRecipe ? <RecipeTree items={upgrade.recipe} /> : null}
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
            <UpgradeIcon
              id={item.id}
              rarity={item.rarity}
              crafted={item.crafted}
              className="size-9"
            />
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
