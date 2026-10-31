import { useId, useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import { useTranslation } from "react-i18next"
import { campaignDescriptor, campaignIcon } from "@workspace/game-catalog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
  progressOf,
  reachedBattleRows,
  sumRewards,
  unclaimedMedalRewards,
  unclaimedMilestoneRewards,
  withBattleProgress,
  withGold,
  withMedals,
  type BattleMilestone,
  type BattleProgressRow,
} from "../model/battle-progress"
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
  const unclaimedFor = (row: BattleProgressRow) => {
    const rewards = battlesById.get(row.battleId)?.rewards
    if (!rewards) return []
    const current = progressOf(draft, row.battleId)
    const medals = row.frontier ? 0 : current.medals
    return [
      ...unclaimedMedalRewards(rewards.medals, medals),
      ...(selected.isEvent
        ? unclaimedMilestoneRewards(rewards.milestones, current.milestone)
        : []),
    ]
  }
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
              const battle = battlesById.get(row.battleId)
              const current = progressOf(draft, row.battleId)
              const medals = row.frontier ? 0 : current.medals
              const label = battleLabel(row)
              const milestones = selected.isEvent
                ? (battle?.rewards.milestones ?? []).map(
                    (reward) => reward.milestone
                  )
                : []
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
                        battle: label,
                      })}
                      value={String(medals)}
                      onValueChange={(value) => {
                        if (!value) return
                        update((list) =>
                          withMedals(list, row.battleId, Number(value))
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
                  {selected.isEvent && milestones.length > 0 ? (
                    <EventControls
                      battleId={row.battleId}
                      label={label}
                      hasLightningVictory={
                        battle?.lightningVictoryTurns != null
                      }
                      lightningVictory={current.lightningVictory}
                      milestone={current.milestone}
                      milestones={milestones}
                      onChange={(patch) =>
                        update((list) =>
                          withBattleProgress(list, row.battleId, patch)
                        )
                      }
                      onGold={() =>
                        update((list) => withGold(list, row.battleId))
                      }
                    />
                  ) : null}
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

/** Lightning Victory, the milestone tier and the Gold quick-set for one campaign-event battle. */
function EventControls({
  battleId,
  label,
  hasLightningVictory,
  lightningVictory,
  milestone,
  milestones,
  onChange,
  onGold,
}: {
  battleId: string
  label: string
  hasLightningVictory: boolean
  lightningVictory: boolean
  milestone: BattleMilestone | null
  /** The tiers this battle awards (Extremis: Gold only). */
  milestones: readonly BattleMilestone[]
  onChange: (patch: {
    lightningVictory?: boolean
    milestone?: BattleMilestone | null
  }) => void
  onGold: () => void
}) {
  const { t } = useTranslation("dailies")
  const lightningId = useId()
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {hasLightningVictory ? (
        <div className="flex items-center gap-2">
          <Checkbox
            id={lightningId}
            checked={lightningVictory}
            onCheckedChange={(checked) =>
              onChange({ lightningVictory: checked === true })
            }
            data-testid={`battle-progress-${battleId}-lightning`}
          />
          <Label htmlFor={lightningId} className="text-xs">
            {t("battleProgress.lightningVictory")}
          </Label>
        </div>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label={t("battleProgress.milestoneFor", { battle: label })}
          value={milestone ?? NO_MILESTONE}
          onValueChange={(value) => {
            if (!value) return
            onChange({
              milestone:
                value === NO_MILESTONE ? null : (value as BattleMilestone),
            })
          }}
        >
          {[
            NO_MILESTONE,
            ...MILESTONES.filter((tier) => milestones.includes(tier)),
          ].map((tier) => (
            <ToggleGroupItem
              key={tier}
              value={tier}
              data-testid={`battle-progress-${battleId}-milestone-${tier}`}
            >
              {t(
                `battleProgress.milestones.${tier as BattleMilestone | typeof NO_MILESTONE}`
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          variant="outline"
          size="sm"
          disabled={milestone === "Gold" && lightningVictory}
          onClick={onGold}
          aria-label={t("battleProgress.setGoldFor", { battle: label })}
          data-testid={`battle-progress-${battleId}-gold`}
        >
          {t("battleProgress.setGold")}
        </Button>
      </div>
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
