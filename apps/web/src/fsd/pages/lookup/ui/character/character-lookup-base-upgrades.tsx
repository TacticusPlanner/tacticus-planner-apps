import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui/components/card"
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
  LocationChips,
  LocationSection,
  RarityIcon,
  UpgradeIcon,
} from "@/shared/ui"

import type { BaseUpgradeView } from "./character-lookup-results.types"

export function BaseUpgradesTable({
  baseUpgrades,
  highlightedId,
}: {
  baseUpgrades: BaseUpgradeView[]
  highlightedId: string | null
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
            <TableRow
              key={upgrade.id}
              id={`base-upgrade-${upgrade.id}`}
              className={cn(
                "scroll-mt-4 transition-colors",
                highlightedId === upgrade.id && "bg-primary/10"
              )}
            >
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

export function BaseUpgradesCards({
  baseUpgrades,
  highlightedId,
}: {
  baseUpgrades: BaseUpgradeView[]
  highlightedId: string | null
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      {baseUpgrades.map((upgrade) => (
        <Card
          key={upgrade.id}
          id={`base-upgrade-${upgrade.id}`}
          className={cn(
            "scroll-mt-4 gap-2 py-3 transition-colors",
            highlightedId === upgrade.id && "bg-primary/10"
          )}
        >
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
