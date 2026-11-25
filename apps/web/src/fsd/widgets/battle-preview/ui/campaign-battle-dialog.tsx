import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { energyIcon, powerIcon } from "@workspace/game-catalog"
import { UsersIcon } from "lucide-react"

import { toById, useCatalogDataset } from "@/shared/local-data"
import {
  CampaignLocationName,
  DetailsSheet,
  EntityIcon,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { useCampaignBattleTarget } from "../model/campaign-battle-dialog-store"
import type {
  CampaignBattleDialogStore,
  CampaignBattleTarget,
} from "../model/campaign-battle-dialog-store"
import { campaignEnemyTiles } from "../model/campaign-enemy-tiles"
import type { EnemyNpcs } from "../model/enemy-tile"
import { EnemyList } from "./enemy-list"

/** The copy namespaces the dialog reads beyond the preloaded `common`, `dailies` and `library`: the
 *  enemy tiles' level and detail (`legendaryEvents`, `progression`), the NPC names and their stats. */
const BATTLE_DIALOG_NAMESPACES = [
  "legendaryEvents",
  "progression",
  "npcs",
  "factions",
  "damageTypes",
  "traits",
] as const

/**
 * A campaign location's battle, opened by tapping a planned raid location (V1's expandable raid
 * location): its energy cost, unit slots and enemy power, then the enemies it fields with their
 * level, from the `campaign-battles` and `npcs` reads. Shows the player how well a suggested
 * location matches what they were filtering for. A centered dialog on desktop; on a phone a
 * content-height details sheet (ui-style-guide rule 8), since the battle rarely fills the screen.
 */
export function CampaignBattleDialog({
  target,
  onClose,
}: {
  target: CampaignBattleTarget | null
  onClose: () => void
}) {
  const isMobile = useIsMobile()
  const title = target ? <CampaignLocationName {...target.title} /> : null
  const onOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  if (isMobile) {
    return (
      <DetailsSheet
        onOpenChange={onOpenChange}
        open={target !== null}
        testId="campaign-battle-dialog"
        title={title}
      >
        {target ? (
          <div className="flex min-w-0 flex-col gap-3">
            <CampaignBattleContentBoundary isMobile target={target} />
          </div>
        ) : null}
      </DetailsSheet>
    )
  }
  return (
    <ResponsiveDialog
      data-testid="campaign-battle-dialog"
      width="form"
      onOpenChange={onOpenChange}
      open={target !== null}
    >
      {target ? (
        <>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="flex min-w-0 flex-col gap-3">
            <CampaignBattleContentBoundary isMobile={false} target={target} />
          </ResponsiveDialogBody>
        </>
      ) : null}
    </ResponsiveDialog>
  )
}

/** The page's campaign battle dialog, opened through `dialog.show`. It alone re-renders when the
 *  dialog opens or closes. Its copy loads with the page that hosts it, so the first opening does not
 *  wait for it. */
export function CampaignBattleDialogHost({
  dialog,
}: {
  dialog: CampaignBattleDialogStore
}) {
  // Loads the copy without suspending: the host re-renders once it is ready.
  useTranslation(BATTLE_DIALOG_NAMESPACES, { useSuspense: false })
  const target = useCampaignBattleTarget(dialog)
  return <CampaignBattleDialog onClose={dialog.close} target={target} />
}

/** Its own boundary: copy still loading suspends the dialog's body, never the page behind it (the
 *  route's boundary would swap the whole page for its loading fill). */
function CampaignBattleContentBoundary(props: {
  target: CampaignBattleTarget
  isMobile: boolean
}) {
  return (
    <Suspense fallback={<CampaignBattleLoading />}>
      <CampaignBattleContent {...props} />
    </Suspense>
  )
}

function CampaignBattleLoading() {
  const { t } = useTranslation("dailies")
  return (
    <div data-testid="campaign-battle-loading">
      <span className="sr-only">{t("locationDetails.loading")}</span>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

/** The battle's summary and enemies, laid out by the shell around it. */
function CampaignBattleContent({
  target,
  isMobile,
}: {
  target: CampaignBattleTarget
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation("dailies")
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
      {battlesRead.status === "loading" ? (
        <CampaignBattleLoading />
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
            <li className="inline-flex items-center gap-1">
              <EntityIcon size="icon" alt="" src={energyIcon()} />
              {t("locationDetails.energy", {
                count: battle.energyCost,
                formatted: number.format(battle.energyCost),
              })}
            </li>
            <li className="inline-flex items-center gap-1">
              <UsersIcon aria-hidden className="size-icon" />
              {t("locationDetails.slots", {
                count: battle.slots,
                formatted: number.format(battle.slots),
              })}
            </li>
            {battle.enemyPower > 0 ? (
              <li className="inline-flex items-center gap-1">
                <EntityIcon size="icon" alt="" src={powerIcon()} />
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
    </>
  )
}
