import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  EquipmentIcons,
  equipmentSlotIcon,
  type EquipmentStorageModel,
} from "@workspace/game-catalog"
import { rarityOrder } from "@workspace/game-domain"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import { itemStatLines } from "./character-unit.view-model"

/** Highest rarity first, as the game lists equipment. */
const RARITIES_HIGH_TO_LOW = [...rarityOrder].reverse()

/** An item's art centred at 70% inside its rarity frame, as V1's equipment icon draws it. */
function ItemIcon({ item }: { item: EquipmentStorageModel }) {
  return (
    <span className="relative size-9 shrink-0">
      <EntityIcon
        src={EquipmentIcons.icon(item.id)}
        fallback={EquipmentIcons.fallback}
        alt=""
        className="absolute inset-[15%] size-[70%]"
      />
      <EntityIcon
        src={EquipmentIcons.frame(item.rarity)}
        alt=""
        className="absolute inset-0 size-full"
      />
    </span>
  )
}

/** One item: icon and name, with its stats (level 1 → last level) on hover or focus. */
function ItemEntry({ item }: { item: EquipmentStorageModel }) {
  const { t, i18n } = useTranslation([
    "library",
    "equipmentItems",
    "progression",
  ])
  const format = new Intl.NumberFormat(i18n.language)
  const value = (amount: number, percent: boolean) =>
    `+${format.format(amount)}${percent ? "%" : ""}`
  const name = t(`equipmentItems:${item.id}`, { defaultValue: item.name })
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex items-center gap-1.5 rounded-sm"
            data-testid={`unit-item-${item.id}`}
          >
            <ItemIcon item={item} />
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            {name} · {t(`progression:rarities.${item.rarity}`)}
          </p>
          <ul>
            {itemStatLines(item).map((line) => (
              <li key={line.stat}>
                {t(`characterUnit.glance.itemStats.${line.stat}`, {
                  defaultValue: line.stat,
                })}{" "}
                {value(line.from, line.percent)}
                {line.to !== line.from
                  ? ` → ${value(line.to, line.percent)}`
                  : null}
              </li>
            ))}
          </ul>
          {item.levels.length > 1 ? (
            <p className="opacity-80">
              {t("characterUnit.glance.itemLevels", {
                max: item.levels.length,
              })}
            </p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </li>
  )
}

/**
 * At a glance's equipment row: one button per slot (marked when the character's relic goes there,
 * with how many items fit), each expanding — one at a time — into the slot's items by rarity.
 */
export function EquipmentSlots({
  slots,
  relicSlot,
  slotItems,
  onRelicClick,
}: {
  slots: readonly string[]
  /** The slot the character's relic goes in (the relic's equipment type) and the relic's name. */
  relicSlot?: { slot: string; name: string }
  /** The items each slot can take (see `equippableItems`). */
  slotItems: ReadonlyMap<string, readonly EquipmentStorageModel[]>
  /** Jumps to the Relic panel. */
  onRelicClick: () => void
}) {
  const { t } = useTranslation(["library", "equipment", "progression"])
  const [openSlot, setOpenSlot] = useState<string | undefined>()
  const itemsId = useId()
  if (slots.length === 0) return null
  const openItems = openSlot ? (slotItems.get(openSlot) ?? []) : []
  const slotName = (slot: string) =>
    t(`equipment:slots.${slot}`, { defaultValue: slot })

  return (
    <div className="flex flex-col gap-2">
      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-sm">
        <dt className="w-24 text-muted-foreground">
          {t("characterUnit.glance.equipment")}
        </dt>
        <dd className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const relic = relicSlot?.slot === slot ? relicSlot : undefined
            const open = openSlot === slot
            return (
              <span
                key={slot}
                className="inline-flex items-stretch overflow-hidden rounded-full border"
                data-testid={`unit-glance-slot-${slot}`}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={itemsId}
                  onClick={() => setOpenSlot(open ? undefined : slot)}
                  className={cn(
                    "inline-flex items-center gap-1 py-0.5 pr-2 pl-1 hover:bg-muted",
                    open && "bg-muted"
                  )}
                  data-testid={`unit-glance-slot-${slot}-toggle`}
                >
                  <EntityIcon
                    src={equipmentSlotIcon(slot)}
                    alt=""
                    className="size-5"
                  />
                  {slotName(slot)}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("characterUnit.glance.itemCount", {
                      count: slotItems.get(slot)?.length ?? 0,
                    })}
                  </span>
                </button>
                {relic ? (
                  <button
                    type="button"
                    onClick={onRelicClick}
                    className="border-l-2 border-[color-mix(in_oklab,var(--chart-1)_55%,transparent)] px-2 font-semibold hover:bg-muted"
                    data-testid={`unit-glance-slot-${slot}-relic`}
                  >
                    {t("characterUnit.glance.relicSlot", { name: relic.name })}
                  </button>
                ) : null}
              </span>
            )
          })}
        </dd>
      </dl>
      {openSlot ? (
        <div
          id={itemsId}
          className="flex flex-col gap-2 rounded-md border p-3"
          data-testid="unit-glance-items"
        >
          <p className="text-xs font-semibold text-muted-foreground">
            {t("characterUnit.glance.itemsTitle", { slot: slotName(openSlot) })}
          </p>
          {RARITIES_HIGH_TO_LOW.map((rarity) => {
            const items = openItems.filter((item) => item.rarity === rarity)
            return items.length > 0 ? (
              <div
                key={rarity}
                className="grid grid-cols-[5.5rem_1fr] items-center gap-2 text-sm"
              >
                <span className="text-xs text-muted-foreground">
                  {t(`progression:rarities.${rarity}`)}
                </span>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {items.map((item) => (
                    <ItemEntry key={item.id} item={item} />
                  ))}
                </ul>
              </div>
            ) : null
          })}
        </div>
      ) : null}
    </div>
  )
}
