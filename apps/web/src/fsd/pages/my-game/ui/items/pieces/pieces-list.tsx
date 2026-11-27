import { useTranslation } from "react-i18next"
import { equipmentSlotIcon, factionIcon } from "@workspace/game-catalog"
import type { EquipmentStorageModel } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { ItemIcon } from "@/shared/equipment"
import { UnitPortrait } from "@/entities/unit"
import {
  CountBadge,
  EntityIcon,
  ListDivider,
  RarityIcon,
  TruncatedText,
} from "@/shared/ui"

import { portraitSrc } from "../portrait-src"
import type { OwnedPiece } from "../../../model/items/owned-items"
import type {
  PiecesGroup,
  PiecesGroupEntry,
  PiecesLayout,
} from "../../../model/items/pieces-query"

type Item = EquipmentStorageModel

/** How many faces or icons a card shows before it says "+N". */
const MAX_FACES = 4
const MAX_FOR_ICONS = 3

/** What the list needs to name and draw things. */
export type PiecesListContext = {
  itemName: (item: Item) => string
  slotName: (type: string) => string
  unitName: (id: string) => string
  /** An owned character's rarity, for its portrait ring. */
  rarityOf: (id: string) => Rarity | undefined
  /** How many factions the game has: an item for all of them needs no "For" line. */
  factionCount: number
}

type ListProps = {
  groups: readonly PiecesGroupEntry<Item>[]
  group: PiecesGroup
  layout: PiecesLayout
  context: PiecesListContext
  onOpen: (piece: OwnedPiece<Item>) => void
}

/** The owned items as cards or a table, one block per group with its labelled divider. */
export function PiecesList({
  groups,
  group,
  layout,
  context,
  onOpen,
}: ListProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="items-pieces-list">
      {groups.map((entry) => (
        <section className="flex flex-col gap-2" key={entry.key}>
          {group === "none" ? null : (
            <GroupDivider context={context} entry={entry} group={group} />
          )}
          {layout === "cards" ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-2">
              {entry.pieces.map((piece) => (
                <li key={piece.item.id}>
                  <PieceCard context={context} onOpen={onOpen} piece={piece} />
                </li>
              ))}
            </ul>
          ) : (
            <PiecesTable
              context={context}
              onOpen={onOpen}
              pieces={entry.pieces}
            />
          )}
        </section>
      ))}
    </div>
  )
}

function GroupDivider({
  entry,
  group,
  context,
}: {
  entry: PiecesGroupEntry<Item>
  group: PiecesGroup
  context: PiecesListContext
}) {
  const { t } = useTranslation("progression")
  const label =
    group === "rarity"
      ? t(`rarities.${entry.key}`, { defaultValue: entry.key })
      : context.slotName(entry.key)
  return (
    <ListDivider
      aria-label={label}
      data-testid={`items-pieces-group-${entry.key}`}
      heading="h3"
      icon={
        group === "rarity" ? (
          <RarityIcon rarity={entry.key as Rarity} />
        ) : (
          <EntityIcon alt="" size="icon" src={equipmentSlotIcon(entry.key)} />
        )
      }
      label={
        <span className="flex items-center gap-2">
          {label}
          <CountBadge count={entry.pieces.length} />
        </span>
      }
    />
  )
}

/** "+3", after the faces or icons a row has room for. */
function More({ count }: { count: number }) {
  const { t } = useTranslation("myItems")
  if (count <= 0) return null
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {t("pieces.more", { count })}
    </span>
  )
}

/** Who an item is for, when it isn't for everyone: a relic's characters, or its factions. */
function ItemFor({
  item,
  context,
  limit = MAX_FOR_ICONS,
}: {
  item: Item
  context: PiecesListContext
  limit?: number
}) {
  if (item.allowedUnits.length > 0) {
    return (
      <span className="flex items-center gap-1">
        {item.allowedUnits.slice(0, limit).map((id) => (
          <UnitPortrait
            alt={context.unitName(id)}
            key={id}
            rarity={context.rarityOf(id)}
            size="portrait-sm"
            src={portraitSrc(id)}
          />
        ))}
        <More count={item.allowedUnits.length - limit} />
      </span>
    )
  }
  if (
    item.allowedFactions.length === 0 ||
    item.allowedFactions.length >= context.factionCount
  )
    return null
  return (
    <span className="flex items-center gap-1">
      {item.allowedFactions.slice(0, limit).map((id) => (
        <EntityIcon alt="" key={id} size="icon" src={factionIcon(id)} />
      ))}
      <More count={item.allowedFactions.length - limit} />
    </span>
  )
}

/** A row of wearers' faces, then "+N". */
function Wearers({
  ids,
  context,
}: {
  ids: readonly string[]
  context: PiecesListContext
}) {
  return (
    <span className="flex items-center gap-1">
      {ids.slice(0, MAX_FACES).map((id, index) => (
        <UnitPortrait
          alt={context.unitName(id)}
          key={`${id}-${index}`}
          rarity={context.rarityOf(id)}
          size="portrait-sm"
          src={portraitSrc(id)}
        />
      ))}
      <More count={ids.length - MAX_FACES} />
    </span>
  )
}

/** One item: art, name, slot and who it is for, then each owned level with spares and wearers. */
function PieceCard({
  piece,
  context,
  onOpen,
}: {
  piece: OwnedPiece<Item>
  context: PiecesListContext
  onOpen: (piece: OwnedPiece<Item>) => void
}) {
  const { t } = useTranslation(["myItems", "progression"])
  const { item } = piece
  const name = context.itemName(item)
  return (
    <button
      aria-haspopup="dialog"
      aria-label={t("pieces.cardLabel", {
        name,
        spare: t("pieces.spare", { count: piece.spare }),
        worn: t("pieces.worn", { count: piece.worn }),
      })}
      className="flex size-full flex-col gap-3 rounded-lg border bg-card interactive-surface p-3 text-left"
      data-item-id={item.id}
      data-testid="item-piece"
      onClick={() => onOpen(piece)}
      type="button"
    >
      <span className="flex items-start gap-3">
        <ItemIcon item={item} size="icon-2xl" />
        <span className="flex min-w-0 flex-col gap-1">
          <TruncatedText className="text-sm font-medium" lines={2}>
            {name}
          </TruncatedText>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <EntityIcon
              alt=""
              size="icon-sm"
              src={equipmentSlotIcon(item.type)}
            />
            {context.slotName(item.type)} ·{" "}
            {t(`progression:rarities.${item.rarity}`, {
              defaultValue: item.rarity,
            })}
          </span>
          <ItemFor context={context} item={item} />
        </span>
      </span>
      <ul className="flex flex-col gap-1.5 border-t pt-2">
        {piece.levels.map((level) => (
          <li
            className="flex min-h-10 items-center gap-2 text-sm"
            key={level.level}
          >
            <span className="w-12 shrink-0 font-semibold tabular-nums">
              {t("pieces.level", { level: level.level })}
            </span>
            {level.spare > 0 ? (
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {t("pieces.spare", { count: level.spare })}
              </span>
            ) : null}
            <Wearers context={context} ids={level.wearers} />
          </li>
        ))}
      </ul>
    </button>
  )
}

/** One row per item: art and name (opens the details), slot, rarity, levels and counts. */
function PiecesTable({
  pieces,
  context,
  onOpen,
}: {
  pieces: readonly OwnedPiece<Item>[]
  context: PiecesListContext
  onOpen: (piece: OwnedPiece<Item>) => void
}) {
  const { t, i18n } = useTranslation("myItems")
  const format = (value: number) => value.toLocaleString(i18n.language)
  return (
    <div className="max-w-full min-w-0 overflow-x-auto rounded-xl border">
      <Table aria-label={t("pieces.table.label")}>
        <TableHeader>
          <TableRow>
            <TableHead>{t("pieces.table.item")}</TableHead>
            <TableHead>{t("pieces.table.slot")}</TableHead>
            <TableHead>{t("pieces.table.rarity")}</TableHead>
            <TableHead>{t("pieces.table.levels")}</TableHead>
            <TableHead className="text-right">
              {t("pieces.table.spare")}
            </TableHead>
            <TableHead className="text-right">
              {t("pieces.table.worn")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pieces.map((piece) => (
            <TableRow
              data-testid={`item-piece-row-${piece.item.id}`}
              key={piece.item.id}
            >
              <TableCell>
                <button
                  aria-haspopup="dialog"
                  className="flex min-w-48 items-center gap-2 rounded-sm text-left underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  data-item-id={piece.item.id}
                  data-testid="item-piece"
                  onClick={() => onOpen(piece)}
                  type="button"
                >
                  <ItemIcon item={piece.item} size="icon-lg" />
                  <span className="font-medium">
                    {context.itemName(piece.item)}
                  </span>
                </button>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <EntityIcon
                    alt=""
                    size="icon"
                    src={equipmentSlotIcon(piece.item.type)}
                  />
                  {context.slotName(piece.item.type)}
                </span>
              </TableCell>
              <TableCell>
                <RarityIcon rarity={piece.item.rarity} size="icon-md" />
              </TableCell>
              <TableCell className="tabular-nums">
                {piece.levels
                  .map((level) => t("pieces.level", { level: level.level }))
                  .join(", ")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {format(piece.spare)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {format(piece.worn)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
