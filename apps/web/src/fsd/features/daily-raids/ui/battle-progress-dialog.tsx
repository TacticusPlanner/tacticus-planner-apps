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
  beatenEventBattleRows,
  MILESTONES,
  battleTraits,
  isBestProgress,
  progressOf,
  reachedBattleRows,
  sumRewards,
  unclaimedRewardsOf,
  withBattleProgress,
  withBest,
  withMedals,
  type BattleMilestone,
  type BattleProgress,
  type BattleProgressRow,
  type BattleTraits,
} from "../model/battle-progress"
import {
  lightningVictoryIcon,
  medalIcon,
  milestoneIcons,
} from "../lib/battle-progress-icons"
import { campaignEventProgressKey } from "../model/campaign-event-eligibility"
import { useEffectiveCampaignEventProgress } from "../model/use-eligible-campaign-battles"
import { OneTimeRewards } from "./one-time-rewards"

const MEDALS = [0, 1, 2, 3] as const
const NO_MILESTONE = "none"
const trackKey = (groupId: string, type: string) => `${groupId}|${type}`

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
 * Records the medals earned on reached campaign battles and, on campaign-event battles, the
 * Lightning Victory and milestone. Raids need 3 medals; a battle below that is planned as one to
 * play manually. Each battle shows the one-time medal and milestone rewards it still holds. The
 * Tacticus API exposes none of this, so this is the only source besides the frontier. Opened from
 * the Campaigns and Campaign Events pages (campaign preselected) and from a planned raid location
 * (campaign and battle preselected).
 */
export function BattleProgressDialog({
  open,
  onOpenChange,
  campaignGroupId,
  campaignType,
  battleId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignGroupId?: string
  /** The track to open on (an event campaign's Standard or Extremis); defaults to its first type. */
  campaignType?: string
  battleId?: string
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      desktopClassName="sm:max-w-xl"
      data-testid="battle-progress-dialog"
    >
      {open ? (
        <BattleProgressEditor
          initialGroupId={campaignGroupId}
          initialType={campaignType}
          highlightedBattleId={battleId}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </ResponsiveDialog>
  )
}

function BattleProgressEditor({
  initialGroupId,
  initialType,
  highlightedBattleId,
  onClose,
}: {
  initialGroupId?: string
  initialType?: string
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
  const eventProgress = useEffectiveCampaignEventProgress(isAuthenticated)
  const overrides = useRevisionedDraft({
    query: battleProgressQueries.current(),
    enabled: isAuthenticated,
    toDraft,
    toPayload,
    save: updateBattleProgressOverrides,
    sharedRevisionKey: playerDataOverrideKey,
  })
  const [message, setMessage] = useState<Message | null>(null)

  // One entry per track: a standing campaign has one type, an event campaign Standard and Extremis.
  const campaigns = (definitions ?? []).flatMap((definition) => {
    const isEvent = definition.releaseType === "event"
    const types = isEvent ? definition.types : definition.types.slice(0, 1)
    return (types.length > 0 ? types : ["Standard"]).map((type) => {
      const descriptor = campaignDescriptor(definition.groupId, type, false)
      return {
        key: trackKey(definition.groupId, type),
        groupId: definition.groupId,
        type,
        isEvent,
        descriptor,
        label: descriptor ? fullLabel(descriptor) : definition.groupId,
      }
    })
  })
  // Until the player picks one: the requested campaign, else the highlighted battle's campaign.
  const [pickedKey, setPickedKey] = useState<string>()
  const highlighted = battles?.find(
    (battle) => battle.id === highlightedBattleId
  )
  const requestedGroupId = initialGroupId ?? highlighted?.campaignGroupId
  const requestedType = initialType ?? highlighted?.type
  const selected =
    campaigns.find((campaign) => campaign.key === pickedKey) ??
    campaigns.find(
      (campaign) =>
        campaign.groupId === requestedGroupId &&
        (requestedType === undefined || campaign.type === requestedType)
    ) ??
    campaigns[0]
  const battlesById = new Map<string, NonNullable<typeof battles>[number]>(
    (battles ?? []).map((battle) => [battle.id, battle])
  )
  let rows: BattleProgressRow[] = []
  if (selected?.isEvent) {
    rows = beatenEventBattleRows(
      battles ?? [],
      selected.groupId,
      selected.type,
      eventProgress.byKey.get(
        campaignEventProgressKey(selected.groupId, selected.type)
      )
    )
  } else if (selected) {
    const highest = progress?.find(
      (entry) =>
        entry.tacticusCampaignId === selected.groupId &&
        entry.type === selected.type
    )?.highestCompletedBattleIndex
    rows = reachedBattleRows(
      battles ?? [],
      selected.groupId,
      selected.type,
      highest
    )
  }

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
  if (!selected || overrides.draft === undefined || !eventProgress.ready) {
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
  const battleLabel = (row: BattleProgressRow) =>
    row.challenge
      ? t("battleProgress.challengeBattle", { tier, node: row.nodeNumber })
      : `${tier} ${row.nodeNumber}`
  // The frontier was never beaten, so it holds every reward; beaten battles default to the best.
  const progressFor = (row: BattleProgressRow): BattleProgress =>
    row.frontier
      ? { medals: 0, lightningVictory: false, milestone: null }
      : progressOf(draft, row.battleId, traitsFor(row))
  const traitsFor = (row: BattleProgressRow) =>
    battleTraits(battlesById.get(row.battleId))
  const unclaimedFor = (row: BattleProgressRow) =>
    unclaimedRewardsOf(battlesById.get(row.battleId)?.rewards, progressFor(row))
  const unclaimedTotal = sumRewards(rows.flatMap(unclaimedFor))
  const update = (
    change: (
      current: readonly BattleProgressOverride[]
    ) => BattleProgressOverride[]
  ) => {
    setMessage(null)
    overrides.update(change)
  }

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
        <Select value={selected.key} onValueChange={setPickedKey}>
          <SelectTrigger
            id={pickerId}
            className="w-full"
            data-testid="battle-progress-campaign"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.key} value={campaign.key}>
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
        <>
          {unclaimedTotal.length > 0 ? (
            <div
              className="mt-3 grid gap-1 rounded-lg border bg-muted/40 px-3 py-2"
              data-testid="battle-progress-unclaimed"
            >
              <span className="text-xs font-medium">
                {t("battleProgress.unclaimed")}
              </span>
              <OneTimeRewards rewards={unclaimedTotal} />
            </div>
          ) : null}
          <ul className="my-3 divide-y rounded-lg border">
            {rows.map((row) => {
              const traits = traitsFor(row)
              const current = progressFor(row)
              const label = battleLabel(row)
              return (
                <li
                  key={row.battleId}
                  className={cn(
                    "grid gap-2 px-3 py-2",
                    row.battleId === highlightedBattleId && "bg-muted"
                  )}
                  data-testid={`battle-progress-row-${row.battleId}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm">
                      {label}
                      {current.medals < 3 ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {row.frontier
                            ? t("battleProgress.notBeaten")
                            : t("battleProgress.manual")}
                        </span>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <EntityIcon alt="" src={medalIcon} className="size-5" />
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        disabled={row.frontier}
                        aria-label={t("battleProgress.medalsFor", {
                          battle: label,
                        })}
                        value={String(current.medals)}
                        onValueChange={(value) => {
                          if (!value) return
                          update((list) =>
                            withMedals(
                              list,
                              row.battleId,
                              traits,
                              Number(value)
                            )
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
                    </div>
                  </div>
                  {row.frontier ? null : (
                    <ExtraControls
                      battleId={row.battleId}
                      label={label}
                      traits={traits}
                      progress={current}
                      onChange={(patch) =>
                        update((list) =>
                          withBattleProgress(list, row.battleId, traits, patch)
                        )
                      }
                      onBest={() =>
                        update((list) => withBest(list, row.battleId))
                      }
                    />
                  )}
                  <OneTimeRewards
                    rewards={unclaimedFor(row)}
                    data-testid={`battle-progress-rewards-${row.battleId}`}
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Shell>
  )
}

/**
 * A beaten battle's Lightning Victory toggle, its milestone tier (campaign events only) and, once
 * anything falls short of the best result, a Max button that restores it.
 */
function ExtraControls({
  battleId,
  label,
  traits,
  progress,
  onChange,
  onBest,
}: {
  battleId: string
  label: string
  traits: BattleTraits
  progress: BattleProgress
  onChange: (patch: Partial<BattleProgress>) => void
  onBest: () => void
}) {
  const { t } = useTranslation("dailies")
  const hasLightningVictory = traits.lightningVictoryTurns !== null
  const tiers = MILESTONES.filter((tier) => traits.milestones.includes(tier))
  if (!hasLightningVictory && tiers.length === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {hasLightningVictory ? (
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={progress.lightningVictory ? ["lightning"] : []}
            onValueChange={(value) =>
              onChange({ lightningVictory: value.includes("lightning") })
            }
          >
            <ToggleGroupItem
              value="lightning"
              aria-label={t("battleProgress.lightningVictoryFor", {
                battle: label,
              })}
              title={t("battleProgress.lightningVictory")}
              className="data-[state=off]:opacity-40 data-[state=off]:grayscale"
              data-testid={`battle-progress-${battleId}-lightning`}
            >
              <EntityIcon
                alt=""
                src={lightningVictoryIcon}
                className="size-5"
              />
            </ToggleGroupItem>
          </ToggleGroup>
        ) : null}
        {tiers.length > 0 ? (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label={t("battleProgress.milestoneFor", { battle: label })}
            value={progress.milestone ?? NO_MILESTONE}
            onValueChange={(value) => {
              if (!value) return
              onChange({
                milestone:
                  value === NO_MILESTONE ? null : (value as BattleMilestone),
              })
            }}
          >
            <ToggleGroupItem
              value={NO_MILESTONE}
              className="text-xs"
              data-testid={`battle-progress-${battleId}-milestone-${NO_MILESTONE}`}
            >
              {t("battleProgress.milestones.none")}
            </ToggleGroupItem>
            {tiers.map((tier) => (
              <ToggleGroupItem
                key={tier}
                value={tier}
                aria-label={t(`battleProgress.milestones.${tier}`)}
                title={t(`battleProgress.milestones.${tier}`)}
                className="data-[state=off]:opacity-40 data-[state=off]:grayscale"
                data-testid={`battle-progress-${battleId}-milestone-${tier}`}
              >
                <EntityIcon
                  alt=""
                  src={milestoneIcons[tier]}
                  className="size-5"
                />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </div>
      {isBestProgress(progress, traits) ? null : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onBest}
          aria-label={t("battleProgress.setBestFor", { battle: label })}
          data-testid={`battle-progress-${battleId}-best`}
        >
          {t("battleProgress.setBest")}
        </Button>
      )}
    </div>
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
