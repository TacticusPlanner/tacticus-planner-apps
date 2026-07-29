import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  onslaughtAllianceIcon,
  onslaughtTierIcon,
} from "@workspace/game-catalog"
import { getOnslaughtRewards } from "@workspace/game-catalog/queries"
import type { Progression } from "@workspace/game-domain"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
  onslaughtReward,
  onslaughtAlliances,
  onslaughtProgressQueries,
  onslaughtSectors,
  onslaughtTiers,
  rewardKeys,
  updateOnslaughtProgress,
  type OnslaughtAlliance,
  type OnslaughtProgress,
  type OnslaughtSector,
  type OnslaughtTier,
} from "@/entities/player-data-override"
import { ApiError } from "@/shared/api"
import { EntityIcon, ProgressionBadge } from "@/shared/ui"

const allianceKey = (alliance: OnslaughtAlliance) =>
  alliance.toLowerCase() as "imperial" | "xenos" | "chaos"

const rewardProgression: Record<(typeof rewardKeys)[number], Progression> = {
  Common: "Common:None",
  Uncommon: "Uncommon:TwoStars",
  Rare: "Rare:FourStars",
  Epic: "Epic:RedOneStar",
  Legendary: "Legendary:RedThreeStars",
  LegendaryBlue: "Legendary:OneBlueStar",
  Mythic: "Mythic:OneBlueStar",
}
const rewardTiers = [1, 2, 3] as const

function OnslaughtEmblem({
  sector,
  tier,
  className = "size-7",
}: {
  sector: OnslaughtSector
  tier: OnslaughtTier
  className?: string
}) {
  return (
    <EntityIcon
      src={onslaughtTierIcon(sector, tier)}
      alt={`${sector} tier ${tier}`}
      className={className}
    />
  )
}

export function OnslaughtPage() {
  const { t } = useTranslation()
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
      return { ...base, [key]: { ...base[key], ...patch } }
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
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t("onslaught.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("onslaught.description")}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {onslaughtAlliances.map((alliance) => {
          const key = allianceKey(alliance)
          const value = progress[key]
          return (
            <Card key={alliance}>
              <CardHeader>
                <CardTitle>{alliance}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor={`${key}-sector`}>
                    {t("onslaught.sector")}
                  </Label>
                  <Select
                    value={value.sector}
                    onValueChange={(sector) =>
                      updateAlliance(alliance, {
                        sector: sector as OnslaughtSector,
                      })
                    }
                  >
                    <SelectTrigger
                      id={`${key}-sector`}
                      data-testid={`${key}-onslaught-sector`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {onslaughtSectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          <OnslaughtEmblem sector={sector} tier={value.tier} />
                          <span>{sector}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${key}-tier`}>{t("onslaught.tier")}</Label>
                  <Select
                    value={String(value.tier)}
                    onValueChange={(tier) =>
                      updateAlliance(alliance, {
                        tier: Number(tier) as OnslaughtTier,
                      })
                    }
                  >
                    <SelectTrigger
                      id={`${key}-tier`}
                      data-testid={`${key}-onslaught-tier`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {onslaughtTiers.map((tier) => (
                        <SelectItem key={tier} value={String(tier)}>
                          <OnslaughtEmblem sector={value.sector} tier={tier} />
                          <span>
                            {tier === 4 ? t("onslaught.tierComplete") : tier}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
                          {sector} {tier}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {active.map((alliance) => (
                            <EntityIcon
                              key={alliance}
                              src={onslaughtAllianceIcon(alliance)}
                              alt={alliance}
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
                        return (
                          <td
                            key={key}
                            className={
                              reward.mythic
                                ? "px-3 py-2 text-center font-medium text-violet-500"
                                : "px-3 py-2 text-center"
                            }
                          >
                            {reward.min === reward.max
                              ? reward.min
                              : `${reward.min}-${reward.max}`}
                            {reward.mythic ? "M" : ""}
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
