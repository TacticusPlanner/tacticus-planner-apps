import { useTranslation } from "react-i18next"
import { equipmentSlotIcon } from "@workspace/game-catalog"
import type { EquipmentStorageModel } from "@workspace/game-catalog"

import { ItemIcon, scaleCost } from "@/shared/equipment"
import { CountBadge, EntityIcon, ListDivider } from "@/shared/ui"

import type {
  ReclaimPlan,
  ReclaimReason,
  ReclaimStack,
} from "../../../model/items/reclaim"
import { CostAmounts } from "../item-cost"

type Item = EquipmentStorageModel

/** "Safe to reclaim: 23 items" with what they return, then the same for every spare. */
export function ReclaimSummary({ plan }: { plan: ReclaimPlan<Item> }) {
  const { t } = useTranslation("myItems")
  return (
    <section
      aria-label={t("reclaim.summary.title")}
      className="flex flex-col gap-2 rounded-lg border bg-card p-3"
      data-testid="items-reclaim-summary"
    >
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <dt className="font-semibold">{t("reclaim.summary.title")}</dt>
          <dd className="flex flex-wrap items-center gap-3">
            <span
              className="tabular-nums"
              data-testid="items-reclaim-safe-count"
            >
              {t("reclaim.summary.items", { count: plan.safe.copies })}
            </span>
            <CostAmounts cost={plan.safe.value} />
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
          <dt>{t("reclaim.summary.all")}</dt>
          <dd className="flex flex-wrap items-center gap-3">
            <span className="tabular-nums">
              {t("reclaim.summary.items", { count: plan.all.copies })}
            </span>
            <CostAmounts cost={plan.all.value} />
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        {t("reclaim.summary.note")}
      </p>
    </section>
  )
}

function useReasonText() {
  const { t } = useTranslation(["myItems", "progression"])
  return (reason: ReclaimReason): string => {
    switch (reason.kind) {
      case "covered": {
        return t("reclaim.reasons.covered", {
          rarity: t(`progression:rarities.${reason.rarity}`, {
            defaultValue: reason.rarity,
          }),
        })
      }
      case "surplus":
      case "needed": {
        return t("reclaim.reasons.surplus", {
          held: reason.held,
          count: reason.users,
        })
      }
      case "relic": {
        return t("reclaim.reasons.relic")
      }
      case "mythic": {
        return t("reclaim.reasons.mythic")
      }
    }
  }
}

/** The stacks by slot, as the game's Reclaim items screen groups them. */
export function ReclaimList({
  groups,
  itemName,
  slotName,
}: {
  groups: readonly { slot: string; stacks: ReclaimStack<Item>[] }[]
  itemName: (item: Item) => string
  slotName: (type: string) => string
}) {
  return (
    <div className="flex flex-col gap-4" data-testid="items-reclaim-list">
      {groups.map((group) => (
        <section className="flex flex-col gap-2" key={group.slot}>
          <ListDivider
            aria-label={slotName(group.slot)}
            heading="h3"
            icon={
              <EntityIcon
                alt=""
                size="icon"
                src={equipmentSlotIcon(group.slot)}
              />
            }
            label={
              <span className="flex items-center gap-2">
                {slotName(group.slot)}
                <CountBadge count={group.stacks.length} />
              </span>
            }
          />
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {group.stacks.map((stack) => (
              <StackRow
                itemName={itemName}
                key={`${stack.item.id}-${stack.level}`}
                stack={stack}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** One stack: the item at its level, how many to reclaim and why, and what they return. */
function StackRow({
  stack,
  itemName,
}: {
  stack: ReclaimStack<Item>
  itemName: (item: Item) => string
}) {
  const { t } = useTranslation("myItems")
  const reasonText = useReasonText()
  return (
    <li
      className="flex flex-wrap items-center gap-3 p-3"
      data-item-id={stack.item.id}
      data-testid="item-reclaim-stack"
    >
      <ItemIcon item={stack.item} level={stack.level} size="icon-lg" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{itemName(stack.item)}</span>
        <span className="text-xs text-muted-foreground">
          {reasonText(stack.reason)}
          {stack.reserved > 0
            ? ` · ${t("reclaim.reserved", { count: stack.reserved })}`
            : null}
        </span>
      </span>
      <span className="flex flex-col items-end gap-0.5 text-sm">
        <span
          className={
            stack.safe > 0
              ? "font-semibold tabular-nums"
              : "text-muted-foreground tabular-nums"
          }
        >
          {stack.safe > 0
            ? t("reclaim.reclaim", { safe: stack.safe, spare: stack.spare })
            : t("reclaim.keep", { count: stack.spare })}
        </span>
        {stack.safe > 0 ? (
          <CostAmounts
            className="text-xs text-muted-foreground"
            cost={scaleCost(stack.value, stack.safe)}
          />
        ) : null}
      </span>
    </li>
  )
}
