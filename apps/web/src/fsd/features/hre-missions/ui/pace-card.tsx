import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { bracketRange, stepsFor, type HrePace } from "../model/hre-pace"
import type { HreRarityStepId } from "../model/hre-reward-tables"
import type { HreProgress } from "../model/hre-progress"
import type { HreProgressActions } from "../model/use-hre-progress"

const parseWhole = (value: string, min: number): number | null => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= min ? parsed : null
}

/**
 * Event pace: the player's points and rank (stored with mission progress), then every step of the
 * projection chain (points, currency by source, chest tier, shards by source, the step reached)
 * and what the picked target needs. Labelled as an estimate from the wiki's reward tables.
 */
export function PaceCard({
  state,
  actions,
  pace,
  startRarity,
}: {
  state: HreProgress
  actions: HreProgressActions
  /** The projection, or null until points are entered. */
  pace: HrePace | null
  startRarity: string | null
}) {
  const { t, i18n } = useTranslation("hre")
  const n = (value: number) => value.toLocaleString(i18n.language)
  const stepName = (id: HreRarityStepId) => t(`pace.steps.${id}`)
  const range = pace ? bracketRange(pace.bracket) : null

  return (
    <Card data-testid="hre-pace">
      <CardHeader>
        <CardTitle>{t("pace.title")}</CardTitle>
        <CardDescription>{t("pace.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="hre-pace-points">{t("pace.points")}</Label>
            <Input
              data-testid="hre-pace-points"
              id="hre-pace-points"
              inputMode="numeric"
              min={0}
              onChange={(event) =>
                actions.setPoints(parseWhole(event.target.value, 0))
              }
              type="number"
              value={state.points ?? ""}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hre-pace-rank">{t("pace.rank")}</Label>
            <Input
              data-testid="hre-pace-rank"
              id="hre-pace-rank"
              inputMode="numeric"
              min={1}
              onChange={(event) =>
                actions.setRank(parseWhole(event.target.value, 1))
              }
              placeholder={t("pace.rankPlaceholder")}
              type="number"
              value={state.rank ?? ""}
            />
          </div>
        </div>
        {!pace || !range ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="hre-pace-empty"
          >
            {t("pace.enterPoints")}
          </p>
        ) : (
          <>
            <p
              className="text-sm text-muted-foreground"
              data-testid="hre-pace-bracket"
            >
              {range.to === null
                ? t("pace.bracketOpen", { from: n(range.from) })
                : t("pace.bracket", { from: n(range.from), to: n(range.to) })}
              {pace.rankKnown ? "" : ` ${t("pace.noRank")}`}
            </p>
            <dl className="grid gap-2 text-sm">
              <PaceRow label={t("pace.projected")} testId="hre-pace-projected">
                {t("pace.projectedValue", {
                  points: n(pace.projectedPoints),
                  perDay: n(pace.averagePerDay),
                })}
              </PaceRow>
              <PaceRow label={t("pace.currency")} testId="hre-pace-currency">
                {t("pace.currencyValue", {
                  milestones: n(pace.currency.milestones),
                  missions: n(pace.currency.missions),
                  daily: n(pace.currency.daily),
                  crates: n(pace.currency.crates),
                  total: n(pace.currency.total),
                })}
              </PaceRow>
              <PaceRow label={t("pace.chest")} testId="hre-pace-chest">
                {t("pace.chestValue", {
                  tier: pace.chest.tier,
                  spent: n(pace.chest.spent),
                  left: n(pace.chest.left),
                })}
              </PaceRow>
              <PaceRow label={t("pace.shards")} testId="hre-pace-shards">
                {t("pace.shardsValue", {
                  chests: n(pace.shards.chests),
                  crates: n(pace.shards.crates),
                  total: n(pace.shards.total),
                })}
              </PaceRow>
              <PaceRow label={t("pace.reached")} testId="hre-pace-reached">
                {pace.reached
                  ? stepName(pace.reached.id)
                  : t("pace.notUnlocked")}
                {pace.next && pace.shortOfNext !== null
                  ? ` · ${t("pace.shortOf", {
                      shards: n(pace.shortOfNext),
                      step: stepName(pace.next.id),
                    })}`
                  : ""}
              </PaceRow>
            </dl>
            {pace.ohSoClose ? (
              <p
                className="text-sm font-medium"
                data-testid="hre-pace-oh-so-close"
              >
                {t("pace.ohSoClose")}
              </p>
            ) : null}
          </>
        )}
        <div className="space-y-2 border-t pt-3">
          <Label>{t("pace.target")}</Label>
          <Select
            onValueChange={(value) => actions.setTarget(value)}
            value={pace?.target?.step.id ?? state.target ?? ""}
          >
            <SelectTrigger
              aria-label={t("pace.target")}
              className="w-full"
              data-testid="hre-pace-target"
            >
              <SelectValue placeholder={t("pace.targetPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {stepsFor(startRarity).map((step) => (
                <SelectItem key={step.id} value={step.id}>
                  {stepName(step.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pace?.target ? (
            <div className="space-y-1 text-sm" data-testid="hre-pace-needs">
              <p>
                {pace.target.chestTier === null || pace.target.points === null
                  ? t("pace.needsOutOfReach", {
                      shards: n(pace.target.step.shards),
                    })
                  : t("pace.needs", {
                      shards: n(pace.target.step.shards),
                      tier: pace.target.chestTier,
                      currency: n(pace.target.currency ?? 0),
                      points: n(pace.target.points),
                    })}
              </p>
              {pace.target.reached ? (
                <p className="font-medium" data-testid="hre-pace-on-track">
                  {t("pace.onTrack", { margin: n(pace.target.margin ?? 0) })}
                </p>
              ) : pace.target.pointsPerDay !== null ? (
                <p data-testid="hre-pace-per-day">
                  {t("pace.perDay", { points: n(pace.target.pointsPerDay) })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function PaceRow({
  label,
  testId,
  children,
}: {
  label: string
  testId: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[8rem_1fr]" data-testid={testId}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}
