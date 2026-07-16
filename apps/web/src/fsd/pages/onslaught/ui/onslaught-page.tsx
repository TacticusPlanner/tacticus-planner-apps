import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMsal } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { getOnslaughtRewards } from "@workspace/game-catalog/queries"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
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
  getOnslaughtProgress,
  onslaughtReward,
  onslaughtAlliances,
  onslaughtSectors,
  rewardKeys,
  updateOnslaughtProgress,
  type OnslaughtAlliance,
  type OnslaughtProgress,
  type OnslaughtSector,
} from "@/entities/player-data-override"

const allianceKey = (alliance: OnslaughtAlliance) =>
  alliance.toLowerCase() as "imperial" | "xenos" | "chaos"

export function OnslaughtPage() {
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const rewards = useLiveQuery(() => getOnslaughtRewards(), [])
  const [progress, setProgress] = useState<OnslaughtProgress | null>(null)
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "error">(
    "loading"
  )
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!account) return
    let active = true
    void getOnslaughtProgress(instance, account)
      .then((value) => {
        if (!active) return
        setProgress(value)
        setStatus("idle")
      })
      .catch(() => {
        if (!active) return
        setMessage(t("onslaught.loadError"))
        setStatus("error")
      })
    return () => {
      active = false
    }
  }, [account, instance, t])

  const updateAlliance = (
    alliance: OnslaughtAlliance,
    patch: Partial<{ sector: OnslaughtSector; tier: number }>
  ) => {
    if (!progress) return
    const key = allianceKey(alliance)
    setProgress({ ...progress, [key]: { ...progress[key], ...patch } })
    setMessage(null)
  }

  const save = async () => {
    if (!account || !progress) return
    setStatus("saving")
    setMessage(null)
    try {
      const saved = await updateOnslaughtProgress(instance, account, progress)
      setProgress(saved)
      setStatus("idle")
      setMessage(t("onslaught.saved"))
    } catch {
      setStatus("error")
      setMessage(t("onslaught.saveError"))
    }
  }

  if (status === "loading" || !rewards) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }
  if (!progress) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <main
      className="space-y-8 px-4 py-6 sm:px-6 sm:py-10"
      data-testid="onslaught-page"
    >
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
                          {sector}
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
                      updateAlliance(alliance, { tier: Number(tier) })
                    }
                  >
                    <SelectTrigger
                      id={`${key}-tier`}
                      data-testid={`${key}-onslaught-tier`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3].map((tier) => (
                        <SelectItem key={tier} value={String(tier)}>
                          {tier}
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
          disabled={status === "saving"}
          onClick={() => void save()}
          data-testid="save-onslaught-progress"
        >
          {status === "saving" ? t("onslaught.saving") : t("onslaught.save")}
        </Button>
        {message ? (
          <span
            className={
              status === "error"
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {message}
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
                    {t(`onslaught.rewards.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {onslaughtSectors.flatMap((sector) =>
                [1, 2, 3].map((tier) => {
                  const active = onslaughtAlliances.filter((alliance) => {
                    const value = progress[allianceKey(alliance)]
                    return value.sector === sector && value.tier === tier
                  })
                  return (
                    <tr
                      key={`${sector}-${tier}`}
                      className="border-t odd:bg-background even:bg-muted/20"
                    >
                      <td className="px-3 py-2 font-medium whitespace-nowrap">
                        {sector} {tier}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {active.map((alliance) => (
                            <Badge key={alliance} variant="secondary">
                              {alliance}
                            </Badge>
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
    </main>
  )
}
