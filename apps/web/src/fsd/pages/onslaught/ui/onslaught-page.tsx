import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { onslaughtAllianceIcon } from "@workspace/game-catalog"
import { getOnslaughtRewards } from "@workspace/game-catalog/queries"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  onslaughtReward,
  onslaughtAlliances,
  onslaughtProgressQueries,
  onslaughtSectors,
  rewardKeys,
  updateOnslaughtProgress,
  type OnslaughtAlliance,
  type OnslaughtProgress,
  type OnslaughtSector,
  type OnslaughtTier,
} from "@/entities/player-data-override"
import { useRevisionedDraft } from "@/shared/api"
import { EntityIcon, ProgressionBadge, UnsavedChangesGuard } from "@/shared/ui"

import { OnslaughtAllianceCard } from "./onslaught-alliance-card"
import { OnslaughtEmblem } from "./onslaught-emblem"
import {
  formatReward,
  rewardProgression,
  useOnslaughtPositionLabel,
} from "./onslaught-position"

const allianceKey = (alliance: OnslaughtAlliance) =>
  alliance.toLowerCase() as "imperial" | "xenos" | "chaos"

const rewardTiers = [1, 2, 3] as const

type OnslaughtDraft = Omit<OnslaughtProgress, "revision">
type Message = {
  key: "onslaught.saved" | "onslaught.conflict" | "onslaught.saveError"
  error: boolean
}

const toDraft = ({ imperial, xenos, chaos }: OnslaughtProgress) => ({
  imperial,
  xenos,
  chaos,
})
const toPayload = (
  draft: OnslaughtDraft,
  saved: OnslaughtProgress
): OnslaughtProgress => ({ ...draft, revision: saved.revision })

export function OnslaughtPage() {
  const { t } = useTranslation()
  const positionLabel = useOnslaughtPositionLabel()
  const isAuthenticated = useIsAuthenticated()
  const rewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const [message, setMessage] = useState<Message | null>(null)
  const onslaught = useRevisionedDraft({
    query: onslaughtProgressQueries.current(),
    enabled: isAuthenticated,
    toDraft,
    toPayload,
    save: updateOnslaughtProgress,
  })

  const progress = onslaught.draft
  const loadError = onslaught.query.isError
  const displayMessage = message
    ? t(message.key)
    : loadError
      ? t("onslaught.loadError")
      : null

  const updateAlliance = (
    alliance: OnslaughtAlliance,
    patch: Partial<{ sector: OnslaughtSector; tier: OnslaughtTier }>
  ) => {
    const key = allianceKey(alliance)
    // Any edit makes the alliance a real position that Save will store.
    onslaught.update((draft) => ({
      ...draft,
      [key]: { ...draft[key], ...patch, isSet: true },
    }))
    setMessage(null)
  }

  const save = async () => {
    setMessage(null)
    const outcome = await onslaught.save()
    setMessage(
      outcome === "saved"
        ? { key: "onslaught.saved", error: false }
        : outcome === "conflict"
          ? { key: "onslaught.conflict", error: false }
          : { key: "onslaught.saveError", error: true }
    )
  }

  if (onslaught.query.isPending || !rewards) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }
  if (!progress) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{displayMessage}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8" data-testid="onslaught-page">
      <div className="grid gap-4 md:grid-cols-3">
        {onslaughtAlliances.map((alliance) => {
          const value = progress[allianceKey(alliance)]
          return (
            <OnslaughtAllianceCard
              key={alliance}
              alliance={alliance}
              value={value}
              rewards={rewards}
              onChange={(patch) => updateAlliance(alliance, patch)}
            />
          )
        })}
      </div>

      <p
        className="-mt-4 text-sm text-muted-foreground"
        data-testid="onslaught-progress-help"
      >
        {t("onslaught.help")}
      </p>

      <div className="flex items-center gap-3">
        <Button
          disabled={!onslaught.isDirty || onslaught.isSaving}
          onClick={() => void save()}
          data-testid="save-onslaught-progress"
        >
          {onslaught.isSaving ? t("onslaught.saving") : t("onslaught.save")}
        </Button>
        {displayMessage ? (
          <span
            className={
              (message ? message.error : loadError)
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {displayMessage}
          </span>
        ) : null}
      </div>
      <UnsavedChangesGuard
        when={onslaught.isDirty}
        title={t("onslaught.leave.title")}
        description={t("onslaught.leave.description")}
        stayLabel={t("onslaught.leave.stay")}
        leaveLabel={t("onslaught.leave.leave")}
      />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t("onslaught.rewardsTitle")}</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">
                  {t("onslaught.sectorTier")}
                </th>
                <th className="px-3 py-2 text-left">
                  {t("onslaught.current")}
                </th>
                {rewardKeys.map((key) => (
                  <th
                    key={key}
                    className="px-3 py-2 text-center whitespace-nowrap"
                  >
                    <div className="flex justify-center">
                      <ProgressionBadge value={rewardProgression[key]} />
                      <span className="sr-only">
                        {t(`onslaught.rewards.${key}`)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {onslaughtSectors.flatMap((sector) =>
                rewardTiers.map((tier) => {
                  const active = onslaughtAlliances.filter((alliance) => {
                    const value = progress[allianceKey(alliance)]
                    return (
                      value.isSet &&
                      value.sector === sector &&
                      (value.tier === tier || (tier === 3 && value.tier === 4))
                    )
                  })
                  return (
                    <tr
                      key={`${sector}-${tier}`}
                      className="border-t odd:bg-background even:bg-muted/20"
                    >
                      <td className="px-3 py-2 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <OnslaughtEmblem sector={sector} tier={tier} />
                          {positionLabel(sector, tier)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {active.map((alliance) => (
                            <EntityIcon
                              key={alliance}
                              src={onslaughtAllianceIcon(alliance)}
                              alt={
                                progress[allianceKey(alliance)].tier === 4
                                  ? `${t(`alliances.${alliance}`)} · ${t("onslaught.tierComplete")}`
                                  : t(`alliances.${alliance}`)
                              }
                              className="size-7"
                            />
                          ))}
                        </div>
                      </td>
                      {rewardKeys.map((key) => {
                        const reward = onslaughtReward(
                          rewards,
                          sector,
                          tier,
                          key
                        )
                        if (!reward) {
                          return (
                            <td
                              key={key}
                              className="px-3 py-2 text-center text-muted-foreground"
                            >
                              —
                            </td>
                          )
                        }
                        return (
                          <td
                            key={key}
                            className={
                              reward.mythic
                                ? "px-3 py-2 text-center font-medium text-violet-500"
                                : "px-3 py-2 text-center"
                            }
                          >
                            {formatReward(reward)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
