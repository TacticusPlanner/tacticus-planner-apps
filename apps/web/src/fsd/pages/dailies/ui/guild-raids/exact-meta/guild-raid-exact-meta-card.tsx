import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, RankBadge } from "@/shared/ui"
import {
  resolveGuildRaidLineupFocus,
  type GuildRaidExactReadinessOptionView,
  type GuildRaidExactReadinessRecommendationView,
  type GuildRaidExactReadinessSlotView,
  type GuildRaidExactReadinessUnitView,
} from "@/entities/guild-raid-meta"

const statusBadgeVariant = {
  ready: "default",
  substitutes: "secondary",
  missingEssentials: "outline",
} as const satisfies Record<
  NonNullable<GuildRaidExactReadinessRecommendationView["status"]>,
  "default" | "secondary" | "outline"
>

function ReadinessBar({
  readiness,
  className,
}: {
  readiness: number
  className?: string
}) {
  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <Progress value={readiness} className="h-1.5" aria-hidden />
      <span className="w-9 shrink-0 text-right text-xs tabular-nums">
        {readiness}%
      </span>
    </div>
  )
}

function UnitPortrait({
  unit,
  missing,
  className,
}: {
  unit: GuildRaidExactReadinessUnitView
  missing: boolean
  className?: string
}) {
  return (
    <EntityIcon
      src={unit.portraitUrl}
      alt=""
      className={cn(
        "shrink-0 rounded-full border",
        missing && "border-dashed opacity-40 grayscale",
        className
      )}
    />
  )
}

function useSlotLabel() {
  const { t } = useTranslation("dailies")
  return (slot: GuildRaidExactReadinessSlotView) =>
    slot.kind === "mow"
      ? t("guildRaids.exactMeta.mow")
      : (slot.role?.label ?? "")
}

/** The line under a slot's name: who the substitute stands in for, or why the slot is empty. */
function SlotNote({ slot }: { slot: GuildRaidExactReadinessSlotView }) {
  const { t } = useTranslation("dailies")

  if (slot.picked && slot.isSubstitute) {
    return <>{t("guildRaids.exactMeta.forIdeal", { name: slot.ideal.name })}</>
  }
  if (!slot.picked && slot.ideal.owned === false) {
    return (
      <>
        {slot.options.length > 1
          ? t("guildRaids.exactMeta.noFreeOption")
          : t("guildRaids.exactMeta.optionState.notOwned")}
      </>
    )
  }
  return null
}

function SlotTile({
  slot,
  index,
  expanded,
  panelId,
  isMobile,
  onToggle,
}: {
  slot: GuildRaidExactReadinessSlotView
  index: number
  expanded: boolean
  panelId: string
  isMobile: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation("dailies")
  const slotLabel = useSlotLabel()
  const shown = slot.picked ?? slot.ideal
  const empty = slot.picked === null && slot.ideal.owned === false

  const role = (
    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
      {slotLabel(slot)}
      {slot.essential ? (
        <span
          className="text-primary"
          title={t("guildRaids.exactMeta.essential")}
        >
          {" "}
          ●
        </span>
      ) : null}
    </span>
  )
  const note = <SlotNote slot={slot} />

  return (
    <button
      type="button"
      data-testid={`guild-raid-exact-meta-slot-${index}`}
      aria-expanded={expanded}
      aria-controls={panelId}
      onClick={onToggle}
      className={cn(
        "rounded-xl border bg-card text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        expanded && "border-primary ring-1 ring-primary",
        empty && "border-dashed",
        isMobile
          ? "grid w-full grid-cols-[auto_1fr_5.5rem] items-center gap-3 px-3 py-2"
          : "flex min-w-0 flex-col items-center gap-1.5 p-2.5 text-center"
      )}
    >
      {isMobile ? null : role}
      <UnitPortrait
        unit={shown}
        missing={empty}
        className={isMobile ? "size-9" : "size-12"}
      />
      <span className={cn("flex min-w-0 flex-col", !isMobile && "w-full")}>
        {isMobile ? role : null}
        <span
          className={cn(
            "truncate text-sm font-medium",
            empty && "text-muted-foreground"
          )}
        >
          {shown.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">{note}</span>
      </span>
      {slot.readiness === undefined ? (
        isMobile ? (
          <span />
        ) : null
      ) : (
        <ReadinessBar readiness={slot.readiness} />
      )}
    </button>
  )
}

function OptionRow({
  option,
  slots,
}: {
  option: GuildRaidExactReadinessOptionView
  slots: GuildRaidExactReadinessSlotView[]
}) {
  const { t } = useTranslation("dailies")
  const slotLabel = useSlotLabel()
  const inTeamSlot =
    option.inTeamSlotIndex === undefined
      ? undefined
      : slots[option.inTeamSlotIndex]

  const stateText = !option.state
    ? null
    : option.state === "inTeam" && inTeamSlot
      ? t("guildRaids.exactMeta.optionState.inTeam", {
          slot: slotLabel(inTeamSlot),
        })
      : t(`guildRaids.exactMeta.optionState.${option.state}`)

  return (
    <li
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2"
      data-testid={`guild-raid-exact-meta-option-${option.unit.id}`}
    >
      <UnitPortrait
        unit={option.unit}
        missing={option.unit.owned === false}
        className="size-9"
      />
      <span className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            {option.unit.name}
          </span>
          {option.isIdeal ? (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              {t("guildRaids.exactMeta.ideal")}
            </Badge>
          ) : null}
        </span>
        {stateText ? (
          <span className="text-xs text-muted-foreground">{stateText}</span>
        ) : null}
      </span>
      <span className="flex w-28 items-center justify-end gap-2">
        {option.unit.owned && option.unit.investment?.rank ? (
          <RankBadge
            rank={option.unit.investment.rank}
            showLabel={false}
            tooltip
            iconClassName="size-4"
          />
        ) : null}
        {option.readiness === undefined ? null : (
          <ReadinessBar readiness={option.readiness} className="w-20" />
        )}
      </span>
    </li>
  )
}

function OptionsPanel({
  id,
  slot,
  slots,
}: {
  id: string
  slot: GuildRaidExactReadinessSlotView
  slots: GuildRaidExactReadinessSlotView[]
}) {
  const { t } = useTranslation("dailies")
  const slotLabel = useSlotLabel()

  return (
    <div
      id={id}
      role="region"
      aria-label={t("guildRaids.exactMeta.slotOptions", {
        slot: slotLabel(slot),
      })}
      className="rounded-xl border bg-muted/40 px-3 py-2"
      data-testid="guild-raid-exact-meta-options"
    >
      <p className="pt-1 text-xs font-medium text-muted-foreground">
        {t("guildRaids.exactMeta.slotOptions", { slot: slotLabel(slot) })}
      </p>
      <ul className="divide-y">
        {slot.options.map((option) => (
          <OptionRow key={option.unit.id} option={option} slots={slots} />
        ))}
      </ul>
    </div>
  )
}

/** Where to invest next: each empty slot, then the filled slot furthest below the target. Each line
 * opens that slot's options. */
function FocusCallout({
  slots,
  onSelect,
}: {
  slots: GuildRaidExactReadinessSlotView[]
  onSelect: (index: number) => void
}) {
  const { t } = useTranslation("dailies")
  const slotLabel = useSlotLabel()
  const { emptySlotIndexes, weakestSlotIndex } =
    resolveGuildRaidLineupFocus(slots)

  const lines = [
    ...emptySlotIndexes.map((index) => ({
      index,
      text: t("guildRaids.exactMeta.focus.empty", {
        slot: slotLabel(slots[index]!),
        name: slots[index]!.ideal.name,
      }),
    })),
    ...(weakestSlotIndex === null
      ? []
      : [
          {
            index: weakestSlotIndex,
            text: t("guildRaids.exactMeta.focus.weakest", {
              slot: slotLabel(slots[weakestSlotIndex]!),
              name: slots[weakestSlotIndex]!.picked?.name ?? "",
              percent: slots[weakestSlotIndex]!.readiness,
            }),
          },
        ]),
  ]
  if (lines.length === 0) return null

  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl border border-dashed px-3 py-2"
      data-testid="guild-raid-exact-meta-focus"
    >
      <p className="text-xs font-medium">
        {t("guildRaids.exactMeta.focus.title")}
      </p>
      <ul className="flex flex-col gap-1">
        {lines.map((line) => (
          <li key={line.index}>
            <button
              type="button"
              onClick={() => onSelect(line.index)}
              className="text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {line.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function GuildRaidExactMetaCard({
  isMobile,
  recommendation,
}: {
  isMobile: boolean
  recommendation: GuildRaidExactReadinessRecommendationView
}) {
  const { t } = useTranslation("dailies")
  const panelId = useId()
  const [openSlot, setOpenSlot] = useState<number | null>(null)
  const { slots, status, teamReadiness, comps, efficiency } = recommendation

  const toggle = (index: number) =>
    setOpenSlot((current) => (current === index ? null : index))
  const openSlotView = openSlot === null ? undefined : slots[openSlot]
  // Only once the roster is known: without it every slot reads as empty.
  const focus = status ? (
    <FocusCallout slots={slots} onSelect={setOpenSlot} />
  ) : null

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      {status ? (
        <Badge
          data-testid="guild-raid-exact-meta-status"
          variant={statusBadgeVariant[status]}
        >
          {t(`guildRaids.exactMeta.status.${status}`)}
        </Badge>
      ) : null}
      {teamReadiness === undefined ? null : (
        <Badge
          data-testid="guild-raid-exact-meta-team-readiness"
          variant="secondary"
        >
          {t("guildRaids.exactMeta.teamReadiness", { percent: teamReadiness })}
        </Badge>
      )}
      <Badge variant="outline">
        {t("guildRaids.exactMeta.efficiency", { value: efficiency })}
      </Badge>
      {comps.map((comp) => (
        <Badge key={comp.id} variant="outline" className="gap-1">
          <EntityIcon
            src={comp.signature.portraitUrl}
            alt=""
            className="size-4"
          />
          {t("guildRaids.exactMeta.comp", { name: comp.id })}
        </Badge>
      ))}
    </div>
  )

  const optionsPanel = (index: number) =>
    openSlot === index && openSlotView ? (
      <OptionsPanel id={panelId} slot={openSlotView} slots={slots} />
    ) : null

  return (
    <Card data-testid="guild-raid-exact-meta-card">
      <CardHeader className={isMobile ? "p-3 pb-0" : undefined}>
        {header}
      </CardHeader>
      <CardContent
        className={cn("flex flex-col gap-3", isMobile && "p-3")}
        data-testid="guild-raid-exact-meta-slots"
      >
        {isMobile ? (
          <>
            {focus}
            {slots.map((slot, index) => (
              <div
                key={`${slot.kind}-${index}`}
                className="flex flex-col gap-2"
              >
                <SlotTile
                  slot={slot}
                  index={index}
                  expanded={openSlot === index}
                  panelId={panelId}
                  isMobile
                  onToggle={() => toggle(index)}
                />
                {optionsPanel(index)}
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="grid grid-cols-6 gap-2">
              {slots.map((slot, index) => (
                <SlotTile
                  key={`${slot.kind}-${index}`}
                  slot={slot}
                  index={index}
                  expanded={openSlot === index}
                  panelId={panelId}
                  isMobile={false}
                  onToggle={() => toggle(index)}
                />
              ))}
            </div>
            {openSlot === null ? (
              <p className="text-xs text-muted-foreground">
                {t("guildRaids.exactMeta.slotHint")}
              </p>
            ) : (
              optionsPanel(openSlot)
            )}
            {focus}
          </>
        )}
      </CardContent>
    </Card>
  )
}
