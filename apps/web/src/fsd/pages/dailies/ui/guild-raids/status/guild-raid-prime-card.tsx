import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"

import { RaidBossPortrait } from "@/entities/raid-boss"

import {
  countActivatedModifiers,
  nextModifierToActivate,
} from "../guild-raid-modifier-selection"
import type {
  GuildRaidModifierView,
  GuildRaidPrimeView,
} from "../guild-raid-status-view-model"

function ModifierRow({ modifier }: { modifier: GuildRaidModifierView }) {
  const { t } = useTranslation("dailies")
  const { description } = modifier
  const descriptionText =
    description.kind === "amount"
      ? description.text
      : t(
          description.direction === "increases"
            ? "guildRaids.status.modifierIncreases"
            : "guildRaids.status.modifierReduces",
          { label: description.label }
        )

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 border-t py-2 first:border-t-0 first:pt-0"
      data-testid="guild-raid-modifier"
    >
      <span className="text-sm">{descriptionText}</span>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {modifier.activation.kind === "known" ? (
          <>
            <Badge variant={modifier.activation.active ? "default" : "outline"}>
              {modifier.activation.active
                ? t("guildRaids.status.modifierActive")
                : t("guildRaids.status.modifierPending")}
            </Badge>
            <span>
              {t("guildRaids.status.modifierThreshold", {
                hp: modifier.activation.remainingHp,
              })}
            </span>
          </>
        ) : (
          <>
            <Badge variant="outline">
              {t("guildRaids.status.modifierUnknown")}
            </Badge>
            <span>{t("guildRaids.status.modifierThresholdUnavailable")}</span>
          </>
        )}
      </div>
    </div>
  )
}

function ModifiersSection({ prime }: { prime: GuildRaidPrimeView }) {
  const { t } = useTranslation("dailies")
  const { modifiers } = prime

  if (modifiers.length === 0) {
    return null
  }

  const next = nextModifierToActivate(modifiers)
  const activatedCount = countActivatedModifiers(modifiers)

  return (
    <Dialog>
      <div
        className="flex flex-col gap-1.5"
        data-testid="guild-raid-prime-modifiers"
      >
        <span
          className="text-xs text-muted-foreground"
          data-testid="guild-raid-modifiers-count"
        >
          {t("guildRaids.status.modifiersHit", {
            active: activatedCount,
            total: modifiers.length,
          })}
        </span>
        <DialogTrigger asChild>
          <button
            className="flex w-full items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-left hover:bg-muted"
            data-testid="guild-raid-next-modifier-trigger"
            type="button"
          >
            {next ? (
              <ModifierRow modifier={next} />
            ) : (
              <span className="text-sm text-muted-foreground">
                {t("guildRaids.status.modifiersAllActive")}
              </span>
            )}
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </button>
        </DialogTrigger>
      </div>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-md"
        data-testid="guild-raid-modifiers-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {t("guildRaids.status.modifiersDialogTitle", { name: prime.name })}
          </DialogTitle>
          <DialogDescription>
            {t("guildRaids.status.modifiersHit", {
              active: activatedCount,
              total: modifiers.length,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          {modifiers.map((modifier, index) => (
            <ModifierRow
              key={`${modifier.modifierId}-${index}`}
              modifier={modifier}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GuildRaidPrimeCard({
  isMobile,
  prime,
  position,
}: {
  isMobile: boolean
  prime: GuildRaidPrimeView
  position: "left" | "right"
}) {
  const { t } = useTranslation("dailies")
  const hpPercent =
    prime.hp.kind === "known" && prime.hp.max > 0
      ? Math.max(0, Math.min(100, (prime.hp.remaining / prime.hp.max) * 100))
      : 0
  const positionLabel = t(
    position === "left"
      ? "guildRaids.status.primeLeftLabel"
      : "guildRaids.status.primeRightLabel"
  )
  const hpText =
    prime.hp.kind === "known"
      ? t("guildRaids.status.hp", {
          remaining: prime.hp.remaining,
          max: prime.hp.max,
        })
      : t("guildRaids.status.hpUnavailable")

  if (isMobile) {
    return (
      <Card data-testid="guild-raid-prime-card">
        <CardContent className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-3">
            <RaidBossPortrait
              className="size-10 shrink-0"
              name={prime.name}
              src={prime.portraitSrc}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {prime.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {positionLabel}
                </span>
              </div>
              <div
                className="flex flex-col gap-0.5"
                data-testid="guild-raid-prime-hp"
              >
                <Progress
                  className="h-1.5"
                  indicatorClassName="bg-destructive"
                  value={hpPercent}
                />
                <span className="text-xs text-muted-foreground">{hpText}</span>
              </div>
            </div>
          </div>
          <ModifiersSection prime={prime} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="guild-raid-prime-card">
      <CardHeader className="flex-row items-center gap-3">
        <RaidBossPortrait
          name={prime.name}
          src={prime.portraitSrc}
          className="size-14"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <CardDescription>{positionLabel}</CardDescription>
          <CardTitle className="truncate">{prime.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1" data-testid="guild-raid-prime-hp">
          <Progress indicatorClassName="bg-destructive" value={hpPercent} />
          <span className="text-sm text-muted-foreground">{hpText}</span>
        </div>
        <ModifiersSection prime={prime} />
      </CardContent>
    </Card>
  )
}
