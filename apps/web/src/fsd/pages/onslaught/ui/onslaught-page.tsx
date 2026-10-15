import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { ApiError } from "@/shared/api"
import { EntityIcon, ProgressionBadge } from "@/shared/ui"

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

export function OnslaughtPage() {
  const { t } = useTranslation()
  const positionLabel = useOnslaughtPositionLabel()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const rewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const [draft, setDraft] = useState<OnslaughtProgress>()
  const [message, setMessage] = useState<string | null>(null)
  const progressQuery = useQuery({
    ...onslaughtProgressQueries.current(),
    enabled: isAuthenticated,
  })
  const saveMutation = useMutation({
    mutationFn: updateOnslaughtProgress,
    onSuccess: (saved) => {
      queryClient.setQueryData(
        onslaughtProgressQueries.current().queryKey,
        saved
      )
    },
  })

  const progress = draft ?? progressQuery.data
  const displayMessage =
    message ?? (progressQuery.isError ? t("onslaught.loadError") : null)

  const updateAlliance = (
    alliance: OnslaughtAlliance,
    patch: Partial<{ sector: OnslaughtSector; tier: OnslaughtTier }>
  ) => {
    const key = allianceKey(alliance)
    setDraft((current) => {
      const base = current ?? progressQuery.data
      if (!base) return current
      // Any edit makes the alliance a real position that Save will store.
      return { ...base, [key]: { ...base[key], ...patch, isSet: true } }
    })
    setMessage(null)
  }

  const save = async () => {
    if (!isAuthenticated || !progress) return
    setMessage(null)
    try {
      const saved = await saveMutation.mutateAsync(progress)
      setDraft(saved)
      setMessage(t("onslaught.saved"))
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          const refreshed = await queryClient.fetchQuery(
            onslaughtProgressQueries.current()
          )
          saveMutation.reset()
          setDraft(refreshed)
          setMessage(t("onslaught.conflict"))
          return
        } catch {
          // Fall through to the general save error when the refresh also fails.
        }
      }
      setMessage(t("onslaught.saveError"))
    }
  }

  if (progressQuery.isPending || !rewards) {
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
          disabled={saveMutation.isPending}
          onClick={() => void save()}
          data-testid="save-onslaught-progress"
        >
          {saveMutation.isPending ? t("onslaught.saving") : t("onslaught.save")}
        </Button>
        {displayMessage ? (
          <span
            className={
              progressQuery.isError || saveMutation.isError
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {displayMessage}
          </span>
        ) : null}
      </div>

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
