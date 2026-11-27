import { useTranslation } from "react-i18next"
import { Check, Info, X } from "lucide-react"
import { shardIcon } from "@workspace/game-catalog"
import type { ResolvedShopOffer } from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Slider } from "@workspace/ui/components/slider"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"

import { EntityIcon, HintTrigger } from "@/shared/ui"

import { DESTRUCTIVE_TEXT } from "./day-state-style"
import { slotViews, useSlotLabelText } from "./slot-view"
import type { SlotView } from "./slot-view"
import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

type Purchase = "none" | "planned" | "partial" | "bought"

/** How far a slot's plan is bought; drives the card and tile look. */
function purchaseOf(view: SlotView): Purchase {
  const entry = view.entry?.entry
  if (!entry) return "none"
  if (entry.purchasedQuantity >= entry.quantity) return "bought"
  return entry.purchasedQuantity > 0 ? "partial" : "planned"
}

/** Planned: the accent outline. Bought: the legend's green, outline and tint, so it reads at a glance. */
const PURCHASE_FRAME: Record<Purchase, string> = {
  none: "",
  planned: "border-primary ring-1 ring-primary",
  partial: "border-primary ring-1 ring-primary",
  bought: "border-success-foreground bg-success ring-1 ring-success-foreground",
}
const BOUGHT_TEXT = "text-success-foreground"

/** `[currency] 45`. */
export function Cost({
  amount,
  currency,
  format,
  className,
}: {
  amount: number
  currency: string
  format: EventShopFormat
  className?: string
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 tabular-nums", className)}
    >
      <EntityIcon
        size="icon"
        alt=""
        className="shrink-0"
        src={format.currencyIcon(currency)}
      />
      {format.number(amount)}
    </span>
  )
}

function SlotSubtitle({ view }: { view: SlotView }) {
  const text = useSlotLabelText()(view.label)
  if (!text) return null
  if (view.label?.kind === "thenMythic") {
    // "Then mythic shards at max legendary", led by the mythic shard icon.
    return (
      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <EntityIcon
          size="icon"
          alt=""
          className="shrink-0"
          src={shardIcon("Mythic")}
        />
        <span className="line-clamp-2">{text}</span>
      </p>
    )
  }
  return <p className="line-clamp-2 text-xs text-muted-foreground">{text}</p>
}

/** Packs as a slider from 1 to the day's cap, with a Max shortcut (no − / + stepping). */
export function PacksSlider({
  value,
  cap,
  onChange,
  disabled,
  large,
  slotIndex,
}: {
  value: number
  cap: number
  onChange: (value: number) => void
  disabled: boolean
  large: boolean
  slotIndex: number
}) {
  const { t } = useTranslation("eventShops")
  const atMax = value >= cap
  const max = () => onChange(cap)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-xs text-muted-foreground",
            large && "font-semibold"
          )}
        >
          {t("slot.packs")}
        </span>
        <span
          className="font-semibold tabular-nums"
          data-testid={`event-shop-planned-${slotIndex}`}
        >
          {value}
          <span className="text-xs font-normal text-muted-foreground">
            {" / "}
            {atMax
              ? t("slot.ofMax", { count: cap })
              : t("slot.of", { count: cap })}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Slider
          aria-label={t("slot.quantity")}
          className="flex-1"
          data-testid={`event-shop-slider-${slotIndex}`}
          disabled={disabled}
          max={cap}
          min={1}
          onValueChange={([next]) => next !== undefined && onChange(next)}
          step={1}
          value={[value]}
        />
        {large ? null : (
          <Button
            disabled={disabled || atMax}
            onClick={max}
            size="sm"
            variant="ghost"
          >
            {t("slot.max")}
          </Button>
        )}
      </div>
      {large ? (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1</span>
          <Button
            variant="link"
            className="h-auto rounded-sm p-0 text-[length:inherit] font-normal whitespace-normal text-current underline-offset-2 disabled:no-underline"
            disabled={disabled || atMax}
            onClick={max}
          >
            {t("slot.maxValue", { count: cap })}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/** The bought tick: an outlined box that fills green once every planned pack is bought. */
function BoughtTick({
  bought,
  disabled,
  onToggle,
  label,
}: {
  bought: boolean
  disabled: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <Pressable
      variant="art"
      aria-label={label}
      // A tick box, so a checkbox (ui-style-guide rule 3).
      role="checkbox"
      aria-checked={bought}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
        bought &&
          "border-success-foreground bg-success-foreground text-background hover:border-success-foreground hover:text-background"
      )}
      disabled={disabled}
      onClick={onToggle}
    >
      <Check aria-hidden="true" className="size-icon" strokeWidth={2.5} />
    </Pressable>
  )
}

/** The draft reward's alliance and its change link. */
function DraftAllianceLine({
  controller,
  view,
}: {
  controller: EventShopController
  view: SlotView
}) {
  const { t } = useTranslation("eventShops")
  const draftAlliance = view.entry?.entry.draftAlliance
  if (!draftAlliance && !view.offer.rewardType.startsWith("draft_")) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs">
      <span>
        {draftAlliance
          ? t("slot.alliance", { alliance: t(`alliances.${draftAlliance}`) })
          : null}
      </span>
      <Button
        className="h-auto p-0"
        disabled={!controller.cartReady}
        onClick={() =>
          controller.openDialog({
            kind: "alliance",
            ref: view.ref,
            rewardType: view.offer.rewardType,
            change: true,
          })
        }
        size="sm"
        variant="link"
      >
        {t("slot.changeAlliance")}
      </Button>
    </div>
  )
}

/**
 * A card's in-cart controls in the footprint of its "Plan to buy" button, so a planned card stays the
 * size of its row: the packs slider and count, the bought tick and a remove button. The line total sits
 * in the card's price line. Bought fewer is the slider: lower the packs, then tick.
 */
function CardCartRow({
  controller,
  view,
  entry,
}: {
  controller: EventShopController
  view: SlotView
  entry: NonNullable<SlotView["entry"]>
}) {
  const { t } = useTranslation("eventShops")
  const { quantity, purchasedQuantity } = entry.entry
  const allBought = purchasedQuantity >= quantity
  const disabled = !controller.cartReady
  const tickLabel = allBought
    ? t("slot.untick")
    : purchasedQuantity > 0
      ? `${t("slot.tick")} (${t("slot.bought", { bought: purchasedQuantity, quantity })})`
      : t("slot.tick")

  return (
    <div className="mt-auto flex flex-col gap-1">
      <DraftAllianceLine controller={controller} view={view} />
      <div className="flex flex-wrap items-center gap-2">
        {entry.cap > 1 ? (
          <Slider
            aria-label={t("slot.quantity")}
            className="min-w-16 flex-1 basis-24 data-horizontal:h-7 pointer-coarse:data-horizontal:h-11"
            data-testid={`event-shop-slider-${view.ref.slotIndex}`}
            disabled={disabled}
            max={entry.cap}
            min={1}
            onValueChange={([value]) =>
              value !== undefined &&
              controller.setQuantity(view.ref, value, entry.cap)
            }
            step={1}
            value={[quantity]}
          />
        ) : (
          <span className="flex-1" />
        )}
        <span className="flex shrink-0 items-center gap-1">
          <span
            className="min-w-10 text-right text-sm font-semibold tabular-nums"
            data-testid={`event-shop-planned-${view.ref.slotIndex}`}
          >
            {quantity}
            <span className="text-xs font-normal text-muted-foreground">
              /{entry.cap}
            </span>
          </span>
          <BoughtTick
            bought={allBought}
            disabled={disabled}
            label={tickLabel}
            onToggle={() =>
              allBought
                ? controller.undoBought(view.ref)
                : controller.markBought(view.ref)
            }
          />
          <Button
            aria-label={t("slot.remove")}
            className={DESTRUCTIVE_TEXT}
            disabled={disabled}
            onClick={() => controller.remove(view.ref)}
            size="icon-sm"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </span>
      </div>
    </div>
  )
}

/**
 * The phone sheet's in-cart controls: packs as a slider (none when the cap is 1), the planned cost, a
 * large Bought button and "Remove". Bought fewer is the slider: lower the packs, then Bought.
 */
export function CartControls({
  controller,
  view,
  format,
}: {
  controller: EventShopController
  view: SlotView
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  const entry = view.entry
  if (!entry) return null
  const { quantity, purchasedQuantity } = entry.entry
  const allBought = purchasedQuantity >= quantity
  const disabled = !controller.cartReady

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      {entry.cap > 1 ? (
        <PacksSlider
          cap={entry.cap}
          disabled={disabled}
          large
          onChange={(value) =>
            controller.setQuantity(view.ref, value, entry.cap)
          }
          slotIndex={view.ref.slotIndex}
          value={quantity}
        />
      ) : null}
      <DraftAllianceLine controller={controller} view={view} />
      {allBought ? (
        <p
          className={cn(
            "inline-flex items-center gap-1 text-sm font-semibold",
            BOUGHT_TEXT
          )}
        >
          <Check aria-hidden="true" className="size-icon" strokeWidth={3} />
          {t("slot.boughtState", { count: quantity })}
        </p>
      ) : purchasedQuantity > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("slot.bought", { bought: purchasedQuantity, quantity })}
        </p>
      ) : null}
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        {t("slot.lineTotal", {
          count: quantity,
          cost: format.number(entry.costPerPack),
        })}
        <Cost
          amount={quantity * entry.costPerPack}
          className="font-semibold text-foreground"
          currency={controller.event.currency}
          format={format}
        />
      </span>
      <Button
        disabled={disabled}
        onClick={() =>
          allBought
            ? controller.undoBought(view.ref)
            : controller.markBought(view.ref)
        }
        size="lg"
        variant={allBought ? "outline" : "default"}
      >
        {allBought ? null : <Check aria-hidden="true" />}
        {allBought ? t("slot.undoBought") : t("slot.boughtAction")}
      </Button>
      <div className="grid">
        <Button
          className={DESTRUCTIVE_TEXT}
          disabled={disabled}
          onClick={() => controller.remove(view.ref)}
          variant="ghost"
        >
          {t("slot.remove")}
        </Button>
      </div>
    </div>
  )
}

function OfferLine({
  offer,
  controller,
  format,
}: {
  offer: ResolvedShopOffer
  controller: EventShopController
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  const reward = format.reward(offer.rewardType, offer.unitId)
  return (
    <span className="flex min-w-0 items-center gap-2">
      <EntityIcon
        size="icon-lg"
        alt=""
        className="shrink-0"
        src={reward.iconUrl}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{reward.label}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{t("slot.pack", { qty: format.number(offer.rewardQty) })}</span>
          <Cost
            amount={offer.cost.amount}
            currency={controller.event.currency}
            format={format}
          />
          <span>{t("slot.cap", { count: offer.maxPerDay })}</span>
        </span>
      </span>
    </span>
  )
}

/** Desktop and tablet: one slot as a card. */
function SlotCard({
  controller,
  view,
  format,
}: {
  controller: EventShopController
  view: SlotView
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  const { offer, entry, options } = view
  const reward = format.reward(view.shown.rewardType, view.shown.unitId)
  const free = offer.freeOfferType ? format.reward(offer.freeOfferType) : null
  const unsyncedOptions = options.length > 1

  return (
    <article
      className={cn(
        // A container, so a narrow card (three a row on a tablet) stacks its icon above the text.
        "@container flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-3",
        PURCHASE_FRAME[purchaseOf(view)]
      )}
      data-in-cart={entry ? "true" : "false"}
      data-purchase={purchaseOf(view)}
      data-testid={`event-shop-slot-${view.ref.slotIndex}`}
    >
      <div className="flex flex-col items-center gap-2 text-center @[14rem]:flex-row @[14rem]:items-start @[14rem]:gap-3 @[14rem]:text-left">
        <EntityIcon
          size="icon-2xl"
          alt=""
          className="shrink-0"
          src={reward.iconUrl}
        />
        <div className="w-full min-w-0 flex-1">
          <div className="flex flex-col items-center gap-x-2 @[14rem]:flex-row @[14rem]:items-baseline @[14rem]:justify-between">
            <h3 className="line-clamp-2 text-sm font-semibold wrap-break-word">
              {reward.label}{" "}
              <span className="font-normal text-muted-foreground tabular-nums">
                {t("slot.pack", { qty: format.number(view.shown.qty) })}
              </span>
            </h3>
            <span className="shrink-0 text-xs text-muted-foreground">
              {t("slot.number", { number: view.ref.slotIndex + 1 })}
            </span>
          </div>
          <SlotSubtitle view={view} />
          {view.freebie && !unsyncedOptions ? (
            // The daily freebie costs nothing: no price, just "Free every day".
            <p
              className="mt-1 text-xs font-semibold text-success-foreground"
              data-testid={`event-shop-freebie-${view.ref.slotIndex}`}
            >
              {t("slot.freebieShort")}
            </p>
          ) : !unsyncedOptions ? (
            <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 text-xs text-muted-foreground @[14rem]:justify-start">
              {entry ? (
                // In the cart, the price line carries the planned total: "5 packs · 225".
                <span className="inline-flex items-center gap-1">
                  {t("slot.packsTotal", { count: entry.entry.quantity })}
                  <Cost
                    amount={entry.entry.quantity * entry.costPerPack}
                    className="font-semibold text-foreground"
                    currency={controller.event.currency}
                    format={format}
                  />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Cost
                    amount={offer.cost.amount}
                    currency={controller.event.currency}
                    format={format}
                  />
                  {t("slot.aPack")}
                </span>
              )}
              <span>{t("slot.cap", { count: offer.maxPerDay })}</span>
            </p>
          ) : null}
          {view.freebie ? null : free && view.freeQty > 0 ? (
            <Badge
              className="mt-1 h-auto max-w-full whitespace-normal"
              variant="secondary"
            >
              <EntityIcon size="icon" alt="" src={free.iconUrl} />
              {t("slot.free", { reward: free.label, qty: view.freeQty })}
            </Badge>
          ) : null}
        </div>
      </div>
      {unsyncedOptions ? (
        <ul className="flex flex-col gap-2">
          {options.map((option) => {
            const planned = entry?.entry.rewardType === option.rewardType
            return (
              <li key={option.rewardType} className="flex items-center gap-2">
                <OfferLine
                  controller={controller}
                  format={format}
                  offer={option}
                />
                {view.freebieOf(option.rewardType) ? (
                  <span className="shrink-0 text-xs font-medium text-success-foreground">
                    {t("slot.freebieShort")}
                  </span>
                ) : planned ? (
                  <Check
                    aria-hidden="true"
                    className="size-icon shrink-0 text-primary"
                  />
                ) : (
                  <Button
                    disabled={!controller.cartReady}
                    onClick={() => controller.add(view.ref, option)}
                    size="sm"
                    variant="outline"
                  >
                    {t("slot.add")}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
      {entry ? (
        <CardCartRow controller={controller} view={view} entry={entry} />
      ) : view.freebie && !unsyncedOptions ? (
        // Nothing to plan: the freebie is claimed in game every day.
        <p className="mt-auto flex min-h-7 items-center justify-center text-center text-xs text-muted-foreground">
          {t("slot.claimInGame")}
        </p>
      ) : !unsyncedOptions ? (
        <Button
          className="mt-auto"
          data-testid={`event-shop-add-${view.ref.slotIndex}`}
          disabled={!controller.cartReady}
          onClick={() => controller.add(view.ref, offer)}
          size="sm"
          variant="outline"
        >
          {t("slot.add")}
        </Button>
      ) : null}
    </article>
  )
}

/** Desktop and tablet: the selected day's slot cards. */
export function SlotGrid({
  controller,
  format,
}: {
  controller: EventShopController
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  const views = slotViews(controller)
  if (views.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("slot.noSlots")}</p>
  }
  // One "i" for the list, beside its heading, instead of one on every tier-priced slot: the rule is
  // the same for each.
  const tiered = views.some((view) => view.label?.kind === "tier")
  return (
    <section
      aria-labelledby="event-shop-slots-heading"
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-medium" id="event-shop-slots-heading">
          {t("slot.heading")}
        </h3>
        {tiered ? (
          <HintTrigger
            className="size-6 justify-center text-muted-foreground pointer-coarse:size-12"
            data-testid="event-shop-tier-rule"
            hint={t("slot.tierRule")}
            label={t("slot.tierRuleLabel")}
          >
            <Info aria-hidden="true" className="size-icon-sm" />
          </HintTrigger>
        ) : null}
      </div>
      {/* Three a row at every width, like the in-game shop, so slot N sits where the player sees it. */}
      <div className="grid grid-cols-3 gap-3" data-testid="event-shop-slots">
        {views.map((view) => (
          <SlotCard
            key={view.ref.slotIndex}
            controller={controller}
            format={format}
            view={view}
          />
        ))}
      </div>
    </section>
  )
}

/** Phone: one slot as a tile; the tile opens the sheet, its corner tick marks all planned bought. */
function SlotTile({
  controller,
  view,
  format,
  onOpen,
}: {
  controller: EventShopController
  view: SlotView
  format: EventShopFormat
  onOpen: () => void
}) {
  const { t } = useTranslation("eventShops")
  const { offer, entry } = view
  const reward = format.reward(view.shown.rewardType, view.shown.unitId)
  const purchase = purchaseOf(view)
  const allBought = purchase === "bought"

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card",
        PURCHASE_FRAME[purchase]
      )}
      data-in-cart={entry ? "true" : "false"}
      data-purchase={purchase}
      data-testid={`event-shop-tile-${view.ref.slotIndex}`}
    >
      <Pressable
        aria-label={t("slot.open", { reward: reward.label })}
        className="flex w-full flex-col items-center gap-1 p-2 pt-3 text-center"
        onClick={onOpen}
      >
        <span className="relative">
          <EntityIcon
            size="icon-2xl"
            alt=""
            className={cn(allBought && "opacity-60")}
            src={reward.iconUrl}
          />
          {allBought ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-7 items-center justify-center rounded-full bg-success-foreground text-background shadow-sm">
                <Check
                  aria-hidden="true"
                  className="size-icon"
                  strokeWidth={3}
                />
              </span>
            </span>
          ) : null}
          <span className="absolute -right-1 -bottom-1 rounded-sm bg-background/90 px-1 text-2xs font-semibold tabular-nums">
            {t("slot.pack", { qty: format.number(view.shown.qty) })}
          </span>
        </span>
        <span className="line-clamp-2 text-xs/tight">{reward.label}</span>
        {view.freebie ? (
          <span className="text-xs font-semibold text-success-foreground">
            {t("slot.freebieShort")}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Cost
              amount={offer.cost.amount}
              currency={controller.event.currency}
              format={format}
            />
            <span>· {format.number(offer.maxPerDay)}</span>
          </span>
        )}
        {entry ? (
          <span
            className={cn(
              "text-xs font-semibold",
              allBought ? BOUGHT_TEXT : "text-primary"
            )}
            data-testid={`event-shop-tile-state-${view.ref.slotIndex}`}
          >
            {purchase === "bought"
              ? t("slot.boughtState", { count: entry.entry.quantity })
              : purchase === "partial"
                ? t("slot.bought", {
                    bought: entry.entry.purchasedQuantity,
                    quantity: entry.entry.quantity,
                  })
                : t("slot.planned", { count: entry.entry.quantity })}
          </span>
        ) : null}
      </Pressable>
      {entry ? (
        // A 48 px hit area apart from the tile, so a tap on the tile still opens the sheet.
        <Pressable
          variant="art"
          aria-checked={allBought}
          aria-label={allBought ? t("slot.untick") : t("slot.tick")}
          className="absolute top-0 right-0 flex size-12 items-start justify-end p-1.5"
          data-testid={`event-shop-tick-${view.ref.slotIndex}`}
          disabled={!controller.cartReady}
          onClick={() =>
            allBought
              ? controller.undoBought(view.ref)
              : controller.markBought(view.ref)
          }
          role="checkbox"
        >
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-sm border-2 border-primary bg-background",
              allBought &&
                "border-success-foreground bg-success-foreground text-background"
            )}
          >
            {allBought ? (
              <Check aria-hidden="true" className="size-icon-xs" />
            ) : null}
          </span>
        </Pressable>
      ) : null}
    </div>
  )
}

/** Phone: the selected day's slot tiles, three a row. */
export function SlotTiles({
  controller,
  format,
  onOpen,
}: {
  controller: EventShopController
  format: EventShopFormat
  onOpen: (slotIndex: number) => void
}) {
  const { t } = useTranslation("eventShops")
  const views = slotViews(controller)
  if (views.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("slot.noSlots")}</p>
  }
  return (
    <div className="grid grid-cols-3 gap-2" data-testid="event-shop-tiles">
      {views.map((view) => (
        <SlotTile
          key={view.ref.slotIndex}
          controller={controller}
          format={format}
          onOpen={() => onOpen(view.ref.slotIndex)}
          view={view}
        />
      ))}
    </div>
  )
}
