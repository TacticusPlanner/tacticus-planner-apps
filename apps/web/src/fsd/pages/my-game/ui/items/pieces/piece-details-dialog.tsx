import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { factionIcon } from "@workspace/game-catalog"
import type { EquipmentStorageModel } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  ItemIcon,
  isPercentStat,
  itemLibraryPath,
  itemStatsAt,
  maxItemLevel,
  upgradeCost,
} from "@/shared/equipment"
import { UnitPortrait } from "@/entities/unit"
import {
  EntityIcon,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"
import { numberFormat } from "@/shared/lib"

import type { OwnedPiece } from "../../../model/items/owned-items"
import { CostRow } from "../item-cost"
import { portraitSrc } from "../portrait-src"
import type { PiecesListContext } from "./pieces-list"

type Item = EquipmentStorageModel

type DetailsProps = {
  piece: OwnedPiece<Item> | undefined
  context: PiecesListContext
  onOpenChange: (open: boolean) => void
}

/**
 * One item's details (opened from a card or row, kept in `?piece=`): who can wear it, each owned
 * level with its spares and wearers, its stats at those levels and at the top level, and what
 * upgrading the highest copy to the next level and to the top costs.
 */
export function PieceDetailsDialog(props: DetailsProps) {
  const { piece, onOpenChange } = props
  const contentRef = useRef<HTMLDivElement>(null)
  return (
    <ResponsiveDialog
      contentRef={contentRef}
      data-testid="items-piece-details"
      // The first focusable control is a currency hint deep in the body: focusing it would open
      // its tooltip, so the dialog itself takes focus and Tab starts from the top.
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        contentRef.current?.focus()
      }}
      onOpenChange={onOpenChange}
      open={piece !== undefined}
      width="form"
    >
      {piece ? <DetailsContent {...props} piece={piece} /> : null}
    </ResponsiveDialog>
  )
}

function DetailsContent({
  piece,
  context,
  onOpenChange,
}: DetailsProps & { piece: OwnedPiece<Item> }) {
  const { t } = useTranslation(["myItems", "progression"])
  const { item } = piece
  const rarity = t(`progression:rarities.${item.rarity}`, {
    defaultValue: item.rarity,
  })
  const slot = context.slotName(item.type)

  return (
    <>
      <ResponsiveDialogHeader className="flex-row items-center gap-3">
        <ItemIcon item={item} size="icon-2xl" />
        <div className="flex min-w-0 flex-col gap-1">
          <ResponsiveDialogTitle>
            {context.itemName(item)}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t(
              item.isRelic
                ? "pieces.details.relicDescription"
                : "pieces.details.description",
              { rarity, slot }
            )}
          </ResponsiveDialogDescription>
        </div>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-5">
        <WhoCanWear context={context} item={item} />
        <OwnedCopies context={context} piece={piece} />
        <StatsTable piece={piece} />
        <UpgradeCosts piece={piece} />
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button onClick={() => onOpenChange(false)} variant="outline">
          {t("pieces.details.close")}
        </Button>
        <Button asChild>
          <Link to={itemLibraryPath(item.id)}>
            {t("pieces.details.openInLibrary")}
          </Link>
        </Button>
      </ResponsiveDialogFooter>
    </>
  )
}

function Section({
  title,
  testId,
  children,
}: {
  title: string
  testId: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2" data-testid={testId}>
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

/** A relic's characters, or the item's factions ("Every faction" when it fits them all; no one can
 *  wear an item with neither). */
function WhoCanWear({
  item,
  context,
}: {
  item: Item
  context: PiecesListContext
}) {
  const { t } = useTranslation("myItems")
  const forFactions = item.allowedUnits.length === 0
  const nobody = forFactions && item.allowedFactions.length === 0
  const everyone =
    forFactions && item.allowedFactions.length >= context.factionCount
  return (
    <Section testId="items-piece-for" title={t("pieces.details.for")}>
      {nobody || everyone ? (
        <p className="text-sm text-muted-foreground">
          {t(nobody ? "pieces.details.nobody" : "pieces.details.everyone")}
        </p>
      ) : item.allowedUnits.length > 0 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {item.allowedUnits.map((id) => (
            <li className="flex items-center gap-2 text-sm" key={id}>
              <UnitPortrait
                rarity={context.rarityOf(id)}
                size="portrait-sm"
                src={portraitSrc(id)}
              />
              {context.unitName(id)}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {item.allowedFactions.map((id) => (
            <li className="flex items-center gap-1.5 text-sm" key={id}>
              <EntityIcon alt="" size="icon" src={factionIcon(id)} />
              {context.factionName(id)}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

/** Each owned level: how many are spare and who wears one. */
function OwnedCopies({
  piece,
  context,
}: {
  piece: OwnedPiece<Item>
  context: PiecesListContext
}) {
  const { t } = useTranslation("myItems")
  return (
    <Section testId="items-piece-owned" title={t("pieces.details.owned")}>
      <ul className="flex flex-col gap-2">
        {piece.levels.map((level) => (
          <li className="flex flex-col gap-1.5" key={level.level}>
            <span className="flex items-center gap-2 text-sm">
              <span className="font-semibold tabular-nums">
                {t("pieces.level", { level: level.level })}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {t("pieces.details.ownedSummary", {
                  spare: t("pieces.spare", { count: level.spare }),
                  worn: t("pieces.worn", { count: level.wearers.length }),
                })}
              </span>
            </span>
            {level.wearers.length > 0 ? (
              <ul className="flex flex-wrap gap-x-4 gap-y-2 ps-2">
                {level.wearers.map((id, index) => (
                  <li
                    className="flex items-center gap-2 text-sm"
                    key={`${id}-${index}`}
                  >
                    <UnitPortrait
                      rarity={context.rarityOf(id)}
                      size="portrait-sm"
                      src={portraitSrc(id)}
                    />
                    {context.unitName(id)}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  )
}

/** The item's stats at each owned level, and at the top level when no copy is there yet. */
function StatsTable({ piece }: { piece: OwnedPiece<Item> }) {
  const { t, i18n } = useTranslation(["myItems", "library"])
  const { item } = piece
  const max = maxItemLevel(item)
  const levels = [
    ...(piece.levels.some((level) => level.level >= max) ? [] : [max]),
    ...piece.levels.map((level) => level.level),
  ]
  const stats = Object.keys(itemStatsAt(item, max))
  if (stats.length === 0) return null
  const format = numberFormat(i18n.language)
  const value = (stat: string, level: number) => {
    const amount = itemStatsAt(item, level)[stat] ?? 0
    return `${format.format(amount)}${isPercentStat(stat) ? "%" : ""}`
  }
  return (
    <Section testId="items-piece-stats" title={t("pieces.details.stats")}>
      <div className="max-w-full min-w-0 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("pieces.details.statLevel")}</TableHead>
              {stats.map((stat) => (
                <TableHead className="text-right" key={stat}>
                  {t(`library:characterUnit.glance.itemStats.${stat}`, {
                    defaultValue: stat,
                  })}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((level) => (
              <TableRow key={level}>
                <TableCell className="tabular-nums">
                  {t("pieces.level", { level })}
                  {level === max ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {t("pieces.details.max")}
                    </span>
                  ) : null}
                </TableCell>
                {stats.map((stat) => (
                  <TableCell className="text-right tabular-nums" key={stat}>
                    {value(stat, level)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  )
}

/** What upgrading the highest owned copy costs: to the next level, and to the top. */
function UpgradeCosts({ piece }: { piece: OwnedPiece<Item> }) {
  const { t } = useTranslation("myItems")
  const { item } = piece
  const max = maxItemLevel(item)
  const highest = piece.levels[0]?.level ?? 1
  return (
    <Section testId="items-piece-upgrade" title={t("pieces.details.upgrade")}>
      {highest >= max ? (
        <p className="text-sm text-muted-foreground">
          {t("pieces.details.maxed")}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t("pieces.details.upgradeFrom", { level: highest })}
          </p>
          <dl className="flex flex-col gap-1.5 text-sm">
            <CostRow
              cost={upgradeCost(item, highest, highest + 1)}
              label={t("pieces.details.toNext", { level: highest + 1 })}
            />
            {highest + 1 < max ? (
              <CostRow
                cost={upgradeCost(item, highest, max)}
                label={t("pieces.details.toMax", { level: max })}
              />
            ) : null}
          </dl>
        </>
      )}
    </Section>
  )
}
