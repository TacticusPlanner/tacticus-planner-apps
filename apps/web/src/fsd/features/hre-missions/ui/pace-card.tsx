import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  heroReleaseChestIcon,
  heroReleaseCurrencyIcon,
  heroReleaseEventResourceIcon,
  leaderboardIcon,
} from "@workspace/game-catalog"
import type { Progression } from "@workspace/game-domain"
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

import { EntityIcon, ProgressionBadge } from "@/shared/ui"

import {
  bracketRange,
  ownedFrom,
  stepGap,
  stepsFor,
  type HreOwnedStep,
  type HrePace,
} from "../model/hre-pace"
import {
  hreStepProgression,
  type HreRarityStepId,
} from "../model/hre-reward-tables"
import type { HreRewardRules } from "../model/hre-rules"
import type { HreProgress } from "../model/hre-progress"
import type { HreProgressActions } from "../model/use-hre-progress"

const parseWhole = (value: string, min: number): number | null => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= min ? parsed : null
}

/**
 * Event pace: the player's points and rank and, optionally, what they hold now (currency, next
 * chest tier, the hero's step and shards toward the next; stored with mission progress), then every
 * step of the projection chain (points, currency by source, chest tier, shards by source, the step
 * reached), the next milestone and chest, and what the picked target needs. Labelled as an
 * estimate from the wiki's reward tables.
 */
export function PaceCard({
  state,
  actions,
  pace,
  rules,
  startRarity,
  factionId = null,
}: {
  state: HreProgress
  actions: HreProgressActions
  /** The event's served reward rules. */
  rules: HreRewardRules
  /** The projection, or null until points are entered. */
  pace: HrePace | null
  startRarity: string | null
  /** The featured hero's faction, which picks the event's currency and chest art. */
  factionId?: string | null
}) {
  const { t, i18n } = useTranslation("hre")
  const n = (value: number) => value.toLocaleString(i18n.language)
  const stepName = (id: HreRarityStepId) => t(`pace.steps.${id}`)
  const range = pace ? bracketRange(rules, pace.bracket) : null
  const owned = state.owned
  const ownedStep = owned.step as HreOwnedStep | null
  const gap = ownedStep ? stepGap(rules, ownedStep, startRarity) : null
  const ownedSet = ownedFrom(rules, owned, startRarity) !== null
  const lastTier = rules.chests.length
  const currencyIcon = factionId
    ? heroReleaseCurrencyIcon(factionId)
    : undefined
  const chestIcon = heroReleaseChestIcon(factionId ?? undefined)
  const ownedStarted = Object.values(owned).some((value) => value !== null)

  const rankAge = (() => {
    if (!pace || pace.rankAgeDays === null) return ""
    if (pace.rankAgeDays === 0) return ` ${t("pace.rankAgeToday")}`
    if (pace.rankAgeDays === 1) return ` ${t("pace.rankAgeYesterday")}`
    return ` ${t("pace.rankAgeDays", { count: pace.rankAgeDays })}`
  })()

  return (
    <Card data-testid="hre-pace">
      <CardHeader>
        <CardTitle>{t("pace.title")}</CardTitle>
        <CardDescription>{t("pace.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="hre-pace-points"
            icon={heroReleaseEventResourceIcon("points")}
            label={t("pace.points")}
            min={0}
            onChange={actions.setPoints}
            value={state.points}
          />
          <NumberField
            id="hre-pace-rank"
            icon={leaderboardIcon()}
            label={t("pace.rank")}
            min={1}
            onChange={actions.setRank}
            placeholder={t("pace.rankPlaceholder")}
            value={state.rank}
          />
        </div>
        <fieldset className="space-y-3" data-testid="hre-pace-owned">
          <legend className="text-sm font-medium">{t("pace.owned")}</legend>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="hre-pace-owned-currency"
              icon={currencyIcon}
              label={t("pace.ownedCurrency")}
              min={0}
              onChange={(currency) => actions.setOwned({ currency })}
              placeholder={t("pace.rankPlaceholder")}
              value={owned.currency}
            />
            <NumberField
              id="hre-pace-next-tier"
              icon={chestIcon}
              label={t("pace.nextTier")}
              max={lastTier}
              min={1}
              onChange={(nextTier) =>
                actions.setOwned({
                  nextTier:
                    nextTier === null ? null : Math.min(nextTier, lastTier),
                })
              }
              placeholder={t("pace.rankPlaceholder")}
              value={owned.nextTier}
            />
            <div className="space-y-1">
              <Label htmlFor="hre-pace-step">{t("pace.heroStep")}</Label>
              <Select
                onValueChange={(step) => actions.setOwned({ step })}
                value={owned.step ?? ""}
              >
                <SelectTrigger
                  className="w-full"
                  data-testid="hre-pace-step"
                  id="hre-pace-step"
                >
                  <SelectValue placeholder={t("pace.rankPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("pace.stepNone")}</SelectItem>
                  {stepsFor(rules, startRarity).map((step) => (
                    <SelectItem key={step.id} value={step.id}>
                      <StepLabel
                        name={stepName(step.id)}
                        progression={hreStepProgression(step.id)}
                      />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {ownedStep && gap === null ? null : (
              <NumberField
                id="hre-pace-to-next"
                icon={heroReleaseEventResourceIcon("shards")}
                label={t("pace.toNext")}
                max={gap === null ? undefined : gap - 1}
                min={0}
                onChange={(toNext) =>
                  actions.setOwned({
                    toNext:
                      toNext === null || gap === null
                        ? toNext
                        : Math.min(toNext, gap - 1),
                  })
                }
                placeholder={t("pace.rankPlaceholder")}
                value={owned.toNext}
              />
            )}
          </div>
          {ownedSet ? null : (
            <p
              className="text-sm text-muted-foreground"
              data-testid="hre-pace-owned-hint"
            >
              {ownedStarted ? t("pace.ownedPartial") : t("pace.ownedHint")}
            </p>
          )}
        </fieldset>
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
                ? t("pace.bracketOpen", {
                    from: n(range.from),
                    daily: n(pace.bracket.daily),
                  })
                : t("pace.bracket", {
                    from: n(range.from),
                    to: n(range.to),
                    daily: n(pace.bracket.daily),
                  })}
              {pace.rankKnown ? rankAge : ` ${t("pace.noRank")}`}
            </p>
            <div className="space-y-1 text-sm" data-testid="hre-pace-next">
              <p
                className="flex items-center gap-1.5"
                data-testid="hre-pace-next-milestone"
              >
                <EntityIcon
                  alt=""
                  className="size-4 shrink-0"
                  src={heroReleaseEventResourceIcon("points")}
                />
                {pace.nextMilestone
                  ? t("pace.nextMilestone", {
                      points: n(pace.nextMilestone.points),
                      reward: n(pace.nextMilestone.reward),
                    })
                  : t("pace.allMilestones")}
              </p>
              {pace.nextChest ? (
                <p
                  className="flex items-center gap-1.5"
                  data-testid="hre-pace-next-chest"
                >
                  <EntityIcon
                    alt=""
                    className="size-6 shrink-0"
                    src={chestIcon}
                  />
                  {pace.nextChest.missing > 0
                    ? t("pace.nextChest", {
                        tier: pace.nextChest.tier,
                        cost: n(pace.nextChest.cost),
                        missing: n(pace.nextChest.missing),
                      })
                    : t("pace.nextChestReady", {
                        tier: pace.nextChest.tier,
                        cost: n(pace.nextChest.cost),
                      })}
                </p>
              ) : null}
            </div>
            <dl className="grid gap-2 text-sm">
              <PaceRow
                icon={heroReleaseEventResourceIcon("points")}
                label={t("pace.projected")}
                testId="hre-pace-projected"
              >
                {t("pace.projectedValue", {
                  points: n(pace.projectedPoints),
                  perDay: n(pace.averagePerDay),
                })}
              </PaceRow>
              <PaceRow
                icon={currencyIcon}
                label={t("pace.currency")}
                testId="hre-pace-currency"
              >
                {t(
                  pace.currency.owned === null
                    ? "pace.currencyValue"
                    : "pace.currencyOwnedValue",
                  {
                    owned: n(pace.currency.owned ?? 0),
                    milestones: n(pace.currency.milestones),
                    missions: n(pace.currency.missions),
                    daily: n(pace.currency.daily),
                    crates: n(pace.currency.crates),
                    total: n(pace.currency.total),
                  }
                )}
              </PaceRow>
              <PaceRow
                icon={chestIcon}
                label={t("pace.chest")}
                testId="hre-pace-chest"
              >
                {pace.chest.tier < pace.chest.from
                  ? t("pace.chestNone", { left: n(pace.chest.left) })
                  : t(
                      pace.chest.tier > pace.chest.from && pace.owned
                        ? "pace.chestRange"
                        : "pace.chestValue",
                      {
                        from: pace.chest.from,
                        tier: pace.chest.tier,
                        spent: n(pace.chest.spent),
                        left: n(pace.chest.left),
                      }
                    )}
              </PaceRow>
              <PaceRow
                icon={heroReleaseEventResourceIcon("shards")}
                label={t("pace.shards")}
                testId="hre-pace-shards"
              >
                {t(
                  pace.shards.held === null
                    ? "pace.shardsValue"
                    : "pace.shardsOwnedValue",
                  {
                    held: n(pace.shards.held ?? 0),
                    chests: n(pace.shards.chests),
                    crates: n(pace.shards.crates),
                    total: n(pace.shards.total),
                  }
                )}
              </PaceRow>
              {pace.owned ? (
                <PaceRow label={t("pace.now")} testId="hre-pace-now">
                  {pace.owned.next && pace.owned.gap !== null
                    ? t("pace.nowValue", {
                        step: pace.owned.step
                          ? stepName(pace.owned.step.id)
                          : t("pace.stepNone"),
                        toNext: n(pace.owned.toNext),
                        gap: n(pace.owned.gap),
                        next: stepName(pace.owned.next.id),
                      })
                    : pace.owned.step
                      ? stepName(pace.owned.step.id)
                      : t("pace.stepNone")}
                </PaceRow>
              ) : null}
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
              {stepsFor(rules, startRarity).map((step) => (
                <SelectItem key={step.id} value={step.id}>
                  <StepLabel
                    name={stepName(step.id)}
                    progression={hreStepProgression(step.id)}
                  />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pace?.target ? <TargetNeeds n={n} target={pace.target} /> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function TargetNeeds({
  target,
  n,
}: {
  target: NonNullable<HrePace["target"]>
  n: (value: number) => string
}) {
  const { t } = useTranslation("hre")
  const shards = n(target.step.shards)
  if (target.covered)
    return (
      <p className="text-sm font-medium" data-testid="hre-pace-needs">
        {t("pace.targetReached", { shards })}
      </p>
    )
  if (target.timeUp)
    return (
      <p className="text-sm" data-testid="hre-pace-needs">
        {t("pace.needsTimeUp", { shards })}
      </p>
    )
  return (
    <div className="space-y-1 text-sm" data-testid="hre-pace-needs">
      <p>
        {target.chestTier === null || target.points === null
          ? t("pace.needsOutOfReach", { shards })
          : t("pace.needs", {
              shards,
              tier: target.chestTier,
              currency: n(target.currency ?? 0),
              points: n(target.points),
            })}
      </p>
      {target.reached ? (
        <p className="font-medium" data-testid="hre-pace-on-track">
          {t("pace.onTrack", { margin: n(target.margin ?? 0) })}
        </p>
      ) : target.pointsPerDay !== null ? (
        <p data-testid="hre-pace-per-day">
          {t("pace.perDay", { points: n(target.pointsPerDay) })}
        </p>
      ) : null}
    </div>
  )
}

/** A hero step as the game draws it (rarity badge and stars) beside its name. */
function StepLabel({
  name,
  progression,
}: {
  name: string
  progression: string | undefined
}) {
  if (!progression) return name
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="inline-flex">
        <ProgressionBadge value={progression as Progression} />
      </span>
      {name}
    </span>
  )
}

function NumberField({
  id,
  icon,
  label,
  min,
  max,
  placeholder,
  value,
  onChange,
}: {
  id: string
  /** The game's glyph for the value; decorative, the label names it. */
  icon?: string
  label: string
  min: number
  max?: number
  placeholder?: string
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1.5" htmlFor={id}>
        <EntityIcon alt="" className="size-4 shrink-0" src={icon} />
        {label}
      </Label>
      <Input
        data-testid={id}
        id={id}
        inputMode="numeric"
        max={max}
        min={min}
        onChange={(event) => onChange(parseWhole(event.target.value, min))}
        placeholder={placeholder}
        type="number"
        value={value ?? ""}
      />
    </div>
  )
}

function PaceRow({
  label,
  icon,
  testId,
  children,
}: {
  label: string
  /** The game's glyph for the resource the row counts; decorative, the label names it. */
  icon?: string
  testId: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[8rem_1fr]" data-testid={testId}>
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        {icon ? (
          <EntityIcon alt="" className="size-4 shrink-0" src={icon} />
        ) : null}
        {label}
      </dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}
