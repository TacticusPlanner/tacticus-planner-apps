import { useState } from "react"
import { useTranslation } from "react-i18next"
import { eventDay } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

import { DRAFT_ALLIANCES } from "@/entities/event-shop"
import { clearWeekSummary } from "@/features/shops/event-planner"
import { ConfirmationDialog, NumberStepper } from "@/shared/ui"

import type {
  EventShopController,
  EventShopDialog,
} from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

/** The page's one open dialog: draft alliance, replace option, Bought some (Needs review) or Clear week. */
export function EventShopDialogs({
  controller,
  format,
}: {
  controller: EventShopController
  format: EventShopFormat
}) {
  const { dialog } = controller
  if (!dialog) return null
  switch (dialog.kind) {
    case "alliance":
      return (
        <AllianceDialog
          controller={controller}
          dialog={dialog}
          format={format}
        />
      )
    case "replace":
      return (
        <ReplaceDialog
          controller={controller}
          dialog={dialog}
          format={format}
        />
      )
    case "boughtSome":
      return (
        <BoughtSomeDialog
          controller={controller}
          dialog={dialog}
          format={format}
        />
      )
    case "clearWeek":
      return (
        <ClearWeekDialog
          controller={controller}
          dialog={dialog}
          format={format}
        />
      )
  }
}

function AllianceDialog({
  controller,
  dialog,
  format,
}: {
  controller: EventShopController
  dialog: Extract<EventShopDialog, { kind: "alliance" }>
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  return (
    <Dialog open onOpenChange={(open) => !open && controller.closeDialog()}>
      <DialogContent data-testid="event-shop-alliance-dialog">
        <DialogHeader>
          <DialogTitle>{t("dialogs.alliance.title")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.alliance.description", {
              reward: format.reward(dialog.rewardType).label,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {DRAFT_ALLIANCES.map((alliance) => (
            <Button
              key={alliance}
              data-testid={`event-shop-alliance-${alliance}`}
              onClick={() => {
                if (dialog.change) {
                  controller.closeDialog()
                  controller.setAlliance(dialog.ref, alliance)
                } else {
                  controller.confirmAdd(
                    dialog.ref,
                    dialog.rewardType,
                    alliance,
                    dialog.replace ?? false,
                    dialog.quantity
                  )
                }
              }}
              variant="outline"
            >
              {t(`alliances.${alliance}`)}
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={controller.closeDialog} variant="ghost">
            {t("dialogs.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReplaceDialog({
  controller,
  dialog,
  format,
}: {
  controller: EventShopController
  dialog: Extract<EventShopDialog, { kind: "replace" }>
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  return (
    <ConfirmationDialog
      cancelLabel={t("dialogs.cancel")}
      confirmLabel={t("dialogs.replace.confirm")}
      confirmVariant="default"
      description={t("dialogs.replace.description", {
        number: dialog.ref.slotIndex + 1,
        current: format.reward(dialog.current.rewardType).label,
        next: format.reward(dialog.rewardType).label,
      })}
      onCancel={controller.closeDialog}
      onConfirm={() => {
        if (dialog.rewardType.startsWith("draft_")) {
          // Replacing with a draft reward still needs its alliance; the old offer stays until one is
          // chosen, so cancelling keeps it.
          controller.openDialog({
            kind: "alliance",
            ref: dialog.ref,
            rewardType: dialog.rewardType,
            change: false,
            quantity: dialog.quantity,
            replace: true,
          })
          return
        }
        controller.confirmAdd(
          dialog.ref,
          dialog.rewardType,
          dialog.draftAlliance,
          true,
          dialog.quantity
        )
      }}
      open
      title={t("dialogs.replace.title")}
    />
  )
}

function BoughtSomeDialog({
  controller,
  dialog,
  format,
}: {
  controller: EventShopController
  dialog: Extract<EventShopDialog, { kind: "boughtSome" }>
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  const { entry } = dialog.entry
  const [bought, setBought] = useState(entry.purchasedQuantity)
  const date = format.date(
    eventDay(controller.event, dialog.entry.dayIndex).date
  )
  return (
    <Dialog open onOpenChange={(open) => !open && controller.closeDialog()}>
      <DialogContent data-testid="event-shop-bought-some-dialog">
        <DialogHeader>
          <DialogTitle>{t("dialogs.boughtSome.title")}</DialogTitle>
          <DialogDescription>
            {format.reward(entry.rewardType).label} · {date}
          </DialogDescription>
        </DialogHeader>
        <NumberStepper
          data-testid="event-shop-bought-some-value"
          labels={{
            value: t("dialogs.boughtSome.value"),
            decrease: t("slot.decrease"),
            increase: t("slot.increase"),
          }}
          max={entry.quantity}
          min={0}
          onChange={(value) => setBought(value ?? 0)}
          value={bought}
        />
        <DialogFooter>
          <Button onClick={controller.closeDialog} variant="ghost">
            {t("dialogs.cancel")}
          </Button>
          <Button
            data-testid="event-shop-bought-some-save"
            onClick={() => {
              controller.closeDialog()
              controller.setBought(entry, bought)
            }}
          >
            {t("dialogs.boughtSome.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ClearWeekDialog({
  controller,
  dialog,
  format,
}: {
  controller: EventShopController
  dialog: Extract<EventShopDialog, { kind: "clearWeek" }>
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  const summary = clearWeekSummary(controller.entries, dialog.week)
  return (
    <ConfirmationDialog
      cancelLabel={t("dialogs.cancel")}
      confirmLabel={t("dialogs.clearWeek.confirm")}
      description={
        <span
          className="flex flex-col gap-1"
          data-testid="event-shop-clear-week-summary"
        >
          {summary.toBuyCount > 0 ? (
            <span>
              {t("dialogs.clearWeek.toBuy", {
                count: summary.toBuyCount,
                cost: format.number(summary.toBuyCost),
              })}
            </span>
          ) : null}
          {summary.reviewCount > 0 ? (
            <span>
              {t("dialogs.clearWeek.review", { count: summary.reviewCount })}
            </span>
          ) : null}
          <span>{t("dialogs.clearWeek.keeps")}</span>
        </span>
      }
      onCancel={controller.closeDialog}
      onConfirm={() => controller.clearWeek(dialog.week)}
      open
      title={t("dialogs.clearWeek.title", { week: dialog.week })}
    />
  )
}
