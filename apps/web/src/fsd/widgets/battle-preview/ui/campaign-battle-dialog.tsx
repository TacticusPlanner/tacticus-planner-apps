import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { toById, useCatalogDataset } from "@/shared/local-data"
import {
  CampaignLocationName,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { campaignEnemyTiles } from "../model/campaign-enemy-tiles"
import type { EnemyNpcs } from "../model/enemy-tile"
import { EnemyList } from "./enemy-list"

/** A campaign location's name as its raid row shows it (see `CampaignLocationName`). */
interface CampaignBattleTitle {
  campaignName: string
  difficultyLabel?: string
  nodeLabel?: string
}

/** The campaign battle the dialog shows, with the name its row already displays. */
interface CampaignBattleTarget {
  battleId: string
  title: CampaignBattleTitle
}

/**
 * A campaign location's battle, opened by tapping a planned raid location (V1's expandable raid
 * location): its energy cost, unit slots and enemy power, then the enemies it fields with their
 * level, from the `campaign-battles` and `npcs` reads. Shows the player how well a suggested
 * location matches what they were filtering for.
 */
export function CampaignBattleDialog({
  target,
  onClose,
}: {
  target: CampaignBattleTarget | null
  onClose: () => void
}) {
  return (
    <ResponsiveDialog
      data-testid="campaign-battle-dialog"
      desktopClassName="sm:max-w-2xl"
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      open={target !== null}
    >
      {target ? <CampaignBattleContent target={target} /> : null}
    </ResponsiveDialog>
  )
}

function CampaignBattleContent({ target }: { target: CampaignBattleTarget }) {
  const { t, i18n } = useTranslation("dailies")
  const isMobile = useIsMobile()
  const battlesRead = useCatalogDataset("campaign-battles")
  const npcsRead = useCatalogDataset("npcs", toById)
  const number = new Intl.NumberFormat(i18n.language)
  const battle =
    battlesRead.status === "ready"
      ? battlesRead.data.find((entry) => entry.id === target.battleId)
      : undefined
  const npcs: EnemyNpcs =
    npcsRead.status === "ready"
      ? npcsRead.data
      : npcsRead.status === "error"
        ? "unavailable"
        : "pending"

  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          <CampaignLocationName {...target.title} />
        </ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="flex min-w-0 flex-col gap-3 pb-6">
        {battlesRead.status === "loading" ? (
          <div data-testid="campaign-battle-loading">
            <span className="sr-only">{t("locationDetails.loading")}</span>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : battlesRead.status === "error" ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-destructive">
              {t("locationDetails.error")}
            </p>
            <Button onClick={battlesRead.retry} variant="outline">
              {t("locationDetails.retry")}
            </Button>
          </div>
        ) : battle ? (
          <>
            <ul
              className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"
              data-testid="campaign-battle-summary"
            >
              <li>
                {t("locationDetails.energy", {
                  count: battle.energyCost,
                  formatted: number.format(battle.energyCost),
                })}
              </li>
              <li>
                {t("locationDetails.slots", {
                  count: battle.slots,
                  formatted: number.format(battle.slots),
                })}
              </li>
              {battle.enemyPower > 0 ? (
                <li>
                  {t("locationDetails.power", {
                    power: number.format(battle.enemyPower),
                  })}
                </li>
              ) : null}
            </ul>
            <div
              className="flex flex-col gap-2"
              data-testid="campaign-battle-enemies"
            >
              <h3 className="text-sm font-semibold">
                {t("locationDetails.enemies")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("locationDetails.enemyCount", {
                    count: battle.enemiesTotal,
                    formatted: number.format(battle.enemiesTotal),
                  })}
                </span>
              </h3>
              {npcsRead.status === "error" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-destructive">
                    {t("locationDetails.npcsError")}
                  </p>
                  <Button onClick={npcsRead.retry} size="sm" variant="outline">
                    {t("locationDetails.retry")}
                  </Button>
                </div>
              ) : null}
              <EnemyList
                isMobile={isMobile}
                tiles={campaignEnemyTiles(battle.detailedEnemyTypes, npcs)}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("locationDetails.notFound")}
          </p>
        )}
      </ResponsiveDialogBody>
    </>
  )
}
