import { useId, useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import { useTranslation } from "react-i18next"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

import {
  battleProgressQueries,
  playerDataOverrideKey,
  updateBattleProgressOverrides,
  type BattleProgressOverride,
  type BattleProgressOverrides,
} from "@/entities/player-data-override"
import { useRevisionedDraft } from "@/shared/api"
import { combineReadStates, useCampaignDisplay } from "@/shared/lib"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import {
  EntityIcon,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import {
  medalsOf,
  reachedBattleRows,
  withMedals,
} from "../model/battle-progress"

const MEDALS = [0, 1, 2, 3] as const

const toDraft = (saved: BattleProgressOverrides) => saved.battles
const toPayload = (
  draft: readonly BattleProgressOverride[],
  saved: BattleProgressOverrides
): BattleProgressOverrides => ({
  battles: [...draft],
  revision: saved.revision,
})

type Message = "conflict" | "saveError"

/**
 * Records the medals earned on reached standing-campaign battles. Raids need 3 medals; a battle
 * below that is planned as one to play manually. The Tacticus API exposes no medal data, so this
 * is the only source besides the frontier. Opened from the Campaigns page (campaign preselected)
 * and from a planned raid location (campaign and battle preselected).
 */
export function BattleProgressDialog({
  open,
  onOpenChange,
  campaignGroupId,
  battleId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignGroupId?: string
  battleId?: string
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      desktopClassName="sm:max-w-lg"
      data-testid="battle-progress-dialog"
    >
      {open ? (
        <BattleProgressEditor
          initialGroupId={campaignGroupId}
          highlightedBattleId={battleId}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </ResponsiveDialog>
  )
}

function BattleProgressEditor({
  initialGroupId,
  highlightedBattleId,
  onClose,
}: {
  initialGroupId?: string
  highlightedBattleId?: string
  onClose: () => void
}) {
  const { t } = useTranslation("dailies")
  const isAuthenticated = useIsAuthenticated()
  const { fullLabel, difficultyLabel } = useCampaignDisplay()
  const pickerId = useId()
  const read = combineReadStates(
    useCatalogDataset("campaign-definitions"),
    useCatalogDataset("campaign-battles"),
    usePlayerChunk("campaign-progress")
  )
  const [definitions, battles, progress] =
    read.status === "ready" ? read.data : []
  const overrides = useRevisionedDraft({
    query: battleProgressQueries.current(),
    enabled: isAuthenticated,
    toDraft,
    toPayload,
    save: updateBattleProgressOverrides,
    sharedRevisionKey: playerDataOverrideKey,
  })
  const [message, setMessage] = useState<Message | null>(null)

  const campaigns = (definitions ?? [])
    .filter((definition) => definition.releaseType !== "event")
    .map((definition) => {
      const type = definition.types[0] ?? "Standard"
      const descriptor = campaignDescriptor(definition.groupId, type, false)
      return {
        groupId: definition.groupId,
        type,
        descriptor,
        label: descriptor ? fullLabel(descriptor) : definition.groupId,
      }
    })
  // Until the player picks one: the requested campaign, else the highlighted battle's campaign.
  const [pickedGroupId, setGroupId] = useState<string>()
  const groupId =
    pickedGroupId ??
    initialGroupId ??
    battles?.find((battle) => battle.id === highlightedBattleId)
      ?.campaignGroupId
  const selected =
    campaigns.find((campaign) => campaign.groupId === groupId) ?? campaigns[0]
  const highest = progress?.find(
    (entry) =>
      entry.tacticusCampaignId === selected?.groupId &&
      entry.type === selected.type
  )?.highestCompletedBattleIndex
  const rows = selected
    ? reachedBattleRows(battles ?? [], selected.groupId, selected.type, highest)
    : []

  if (!isAuthenticated) {
    return (
      <Shell title={t("battleProgress.title")}>
        <p className="py-4 text-sm text-muted-foreground">
          {t("battleProgress.signIn")}
        </p>
      </Shell>
    )
  }
  if (read.status === "error" || overrides.query.isError) {
    return (
      <Shell title={t("battleProgress.title")}>
        <Alert variant="destructive">
          <AlertDescription>{t("battleProgress.loadError")}</AlertDescription>
        </Alert>
      </Shell>
    )
  }
  if (!selected || overrides.draft === undefined) {
    return (
      <Shell title={t("battleProgress.title")}>
        <div className="flex min-h-32 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      </Shell>
    )
  }
  const draft = overrides.draft
  const tier = selected.descriptor ? difficultyLabel(selected.descriptor) : ""

  const save = async () => {
    setMessage(null)
    const outcome = await overrides.save()
    if (outcome === "saved") {
      onClose()
      return
    }
    setMessage(outcome === "conflict" ? "conflict" : "saveError")
  }

  return (
    <Shell
      title={t("battleProgress.title")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("battleProgress.cancel")}
          </Button>
          <Button
            disabled={!overrides.isDirty || overrides.isSaving}
            onClick={() => void save()}
            data-testid="battle-progress-save"
          >
            {t("battleProgress.save")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {t("battleProgress.description")}
      </p>
      {message ? (
        <Alert
          variant={message === "saveError" ? "destructive" : "default"}
          className="mt-3"
          data-testid="battle-progress-message"
        >
          <AlertDescription>{t(`battleProgress.${message}`)}</AlertDescription>
        </Alert>
      ) : null}
      <div className="mt-4 grid gap-1.5">
        <Label htmlFor={pickerId} className="text-xs text-muted-foreground">
          {t("battleProgress.campaign")}
        </Label>
        <Select
          value={selected.groupId}
          onValueChange={(value) => setGroupId(value)}
        >
          <SelectTrigger
            id={pickerId}
            className="w-full"
            data-testid="battle-progress-campaign"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.groupId} value={campaign.groupId}>
                <span className="inline-flex items-center gap-2">
                  <EntityIcon
                    alt=""
                    className="size-4"
                    src={campaignIcon(campaign.groupId, campaign.type)}
                  />
                  {campaign.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {rows.length === 0 ? (
        <p
          className="py-4 text-sm text-muted-foreground"
          data-testid="battle-progress-empty"
        >
          {t("battleProgress.notStarted")}
        </p>
      ) : (
        <ul className="my-3 divide-y rounded-lg border">
          {rows.map((row) => {
            const medals = row.frontier ? 0 : medalsOf(draft, row.battleId)
            return (
              <li
                key={row.battleId}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 px-3 py-2",
                  row.battleId === highlightedBattleId && "bg-muted"
                )}
                data-testid={`battle-progress-row-${row.battleId}`}
              >
                <span className="text-sm">
                  {tier} {row.nodeNumber}
                  {medals < 3 ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {row.frontier
                        ? t("battleProgress.notBeaten")
                        : t("battleProgress.manual")}
                    </span>
                  ) : null}
                </span>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  disabled={row.frontier}
                  aria-label={t("battleProgress.medalsFor", {
                    battle: `${tier} ${row.nodeNumber}`,
                  })}
                  value={String(medals)}
                  onValueChange={(value) => {
                    if (!value) return
                    setMessage(null)
                    overrides.update((current) =>
                      withMedals(current, row.battleId, Number(value))
                    )
                  }}
                >
                  {MEDALS.map((count) => (
                    <ToggleGroupItem
                      key={count}
                      value={String(count)}
                      aria-label={t("battleProgress.medals", { count })}
                      data-testid={`battle-progress-${row.battleId}-${count}`}
                    >
                      {count}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </li>
            )
          })}
        </ul>
      )}
    </Shell>
  )
}

function Shell({
  title,
  footer,
  children,
}: {
  title: string
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="pb-3">{children}</ResponsiveDialogBody>
      {footer ? (
        <ResponsiveDialogFooter>{footer}</ResponsiveDialogFooter>
      ) : null}
    </>
  )
}
