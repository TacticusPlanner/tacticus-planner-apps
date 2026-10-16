import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Eye, Lock, ShieldPlus, X } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import { progressionRarity, type UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

import { UnitGoalBadge } from "@/entities/goal"
import {
  ObjectiveIcon,
  useObjectiveLabel,
  type LegendaryEventLane,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { MAX_TEAM_MEMBERS } from "../model/team-editor-draft"
import {
  buildPickerTiles,
  filterPickerTiles,
  type PickerGoalsPreview,
} from "../model/team-picker"

/**
 * The editor's unit picker (design D7): the lane's allowed units as tiles (portrait, name, the
 * objectives each satisfies with the others muted, points per battle, locked styling), a name
 * search and an "only unlocked" switch. A tap toggles membership up to five; a sixth tap is
 * ignored and pulses the count badge. A tile's secondary action sets the reserve. The selected
 * members (in position order) and the reserve sit above the grid with remove buttons. With Goals
 * Preview available, a switch (starting from the page's value) shows tiles at their goal targets:
 * owned state, rarity, rank, estimated clears and a preview marker.
 */
export function TeamUnitPicker({
  lane,
  units,
  roster,
  memberUnitIds,
  reserveUnitId,
  onlyUnlockedDefault,
  onToggleMember,
  onToggleReserve,
  goalsPreview,
  goalLines,
}: {
  lane: LegendaryEventLane
  units: readonly LegendaryEventUnit[]
  roster: readonly LegendaryEventRosterUnit[] | undefined
  memberUnitIds: readonly string[]
  reserveUnitId: string | null
  onlyUnlockedDefault: boolean
  /** Returns false when the toggle was refused (a sixth member). */
  onToggleMember: (unitId: string) => boolean
  onToggleReserve: (unitId: string) => void
  goalsPreview?: PickerGoalsPreview
  goalLines?: (unitId: string) => readonly string[]
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const unitName = useUnitName()
  const objectiveLabel = useObjectiveLabel()
  const [search, setSearch] = useState("")
  const [onlyUnlocked, setOnlyUnlocked] = useState(onlyUnlockedDefault)
  const [pulse, setPulse] = useState(0)
  const [preview, setPreview] = useState(
    Boolean(goalsPreview?.available && goalsPreview.enabled)
  )
  const previewOn = Boolean(goalsPreview?.available && preview)
  const shownRoster = previewOn ? goalsPreview?.roster : roster
  const rosterById = useMemo(
    () =>
      new Map((shownRoster ?? []).map((unit) => [unit.unitId as string, unit])),
    [shownRoster]
  )
  const number = new Intl.NumberFormat(i18n.language)
  const nameOf = (unit: { id: string }) => unitName("Character", unit.id)
  const tiles = useMemo(
    () =>
      buildPickerTiles(lane, units, shownRoster, (unit) =>
        unitName("Character", unit.id)
      ),
    // `unitName` is a fresh closure per render; the catalog read behind it settles once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lane, units, shownRoster]
  )
  const selected = new Set([
    ...memberUnitIds,
    ...(reserveUnitId ? [reserveUnitId] : []),
  ])
  const shown = filterPickerTiles(tiles, {
    search,
    onlyUnlocked,
    selected,
    nameOf,
  })
  const objectives = [...lane.unitsRestrictions].sort(
    (a, b) => a.index - b.index
  )

  const toggle = (unitId: string) => {
    if (!onToggleMember(unitId)) setPulse((count) => count + 1)
  }

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="team-unit-picker">
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-live="polite"
          className={cn(
            "rounded-full border px-2 py-0.5 text-sm font-semibold tabular-nums",
            memberUnitIds.length === MAX_TEAM_MEMBERS &&
              "border-primary text-primary",
            pulse > 0 && "animate-[pulse_0.4s_ease-in-out_2]"
          )}
          data-pulse={pulse > 0 ? pulse : undefined}
          data-testid="team-picker-count"
          key={pulse}
        >
          {t("teams.picker.count", { members: memberUnitIds.length })}
        </span>
        <ul
          className="flex min-w-0 flex-wrap gap-1.5"
          data-testid="team-picker-selected"
        >
          {memberUnitIds.map((unitId) => (
            <SelectedChip
              key={unitId}
              label={nameOf({ id: unitId })}
              onRemove={() => toggle(unitId)}
              removeLabel={t("teams.picker.remove", {
                name: nameOf({ id: unitId }),
              })}
              unitId={unitId}
            />
          ))}
          {reserveUnitId ? (
            <SelectedChip
              key={`reserve-${reserveUnitId}`}
              label={`${nameOf({ id: reserveUnitId })} · ${t("teams.reserve")}`}
              onRemove={() => onToggleReserve(reserveUnitId)}
              removeLabel={t("teams.picker.unsetReserve", {
                name: nameOf({ id: reserveUnitId }),
              })}
              reserve
              unitId={reserveUnitId}
            />
          ) : null}
        </ul>
      </div>
      {memberUnitIds.length === MAX_TEAM_MEMBERS ? (
        <p className="text-xs text-muted-foreground">
          {t("teams.picker.full")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label={t("teams.picker.search")}
          className="max-w-xs"
          data-testid="team-picker-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("teams.picker.searchPlaceholder")}
          type="search"
          value={search}
        />
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={onlyUnlocked}
            data-testid="team-picker-only-unlocked"
            onCheckedChange={setOnlyUnlocked}
          />
          {t("teams.picker.onlyUnlocked")}
        </label>
        {goalsPreview ? (
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={previewOn}
              data-testid="team-picker-goals-preview"
              disabled={!goalsPreview.available}
              onCheckedChange={(enabled) => {
                setPreview(enabled)
                goalsPreview.onToggle?.(enabled)
              }}
            />
            {t("goalsPreview.switch")}
          </label>
        ) : null}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("teams.picker.empty")}
        </p>
      ) : (
        <ul
          className="grid grid-cols-4 gap-2 md:grid-cols-6"
          data-testid="team-picker-grid"
        >
          {shown.map((tile) => {
            const id = tile.unit.id
            const isMember = memberUnitIds.includes(id)
            const isReserve = reserveUnitId === id
            const name = nameOf(tile.unit)
            const previewUnit = previewOn ? rosterById.get(id) : undefined
            const previewed = previewOn && goalsPreview?.previewed.has(id)
            const clears = previewUnit ? goalsPreview?.clearsOf?.(id) : null
            const lines = goalLines?.(id) ?? []
            return (
              <li
                className={cn(
                  "relative flex min-w-0 flex-col items-stretch rounded-xl border bg-card",
                  isMember && "border-primary ring-2 ring-primary/40",
                  isReserve && "border-dashed border-primary"
                )}
                data-locked={tile.owned === false ? "true" : undefined}
                data-preview={previewed ? "true" : undefined}
                data-selected={isMember ? "true" : undefined}
                data-testid="team-picker-tile"
                data-unit={id}
                key={id}
              >
                <button
                  aria-label={t(
                    isMember ? "teams.picker.remove" : "teams.picker.add",
                    { name }
                  )}
                  aria-pressed={isMember}
                  className="flex min-w-0 flex-col items-center gap-1 p-1.5 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="team-picker-toggle"
                  onClick={() => toggle(id)}
                  type="button"
                >
                  <span className="relative">
                    <EntityIcon
                      alt=""
                      className={cn(
                        "size-10 rounded-full",
                        tile.owned === false && "opacity-50 grayscale"
                      )}
                      src={characterIcon(id)}
                    />
                    {tile.owned === false ? (
                      <Lock
                        aria-label={t("teams.picker.locked")}
                        className="absolute -right-1 -bottom-1 size-3.5 rounded-full bg-background p-0.5"
                      />
                    ) : null}
                  </span>
                  <span className="flex w-full min-w-0 items-center justify-center gap-0.5">
                    <span className="truncate text-xs font-medium">{name}</span>
                    {lines.length > 0 ? (
                      <UnitGoalBadge
                        className="size-4"
                        label={t("goalBadge.label")}
                        lines={lines}
                        tooltip={false}
                      />
                    ) : null}
                  </span>
                  {previewUnit ? (
                    <span
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      data-testid="team-picker-preview-state"
                    >
                      <RarityIcon
                        className="size-4"
                        rarity={progressionRarity(previewUnit.progressionIndex)}
                      />
                      <RankBadge
                        iconClassName="size-4"
                        rank={previewUnit.rank}
                        showLabel={false}
                      />
                      {clears === null || clears === undefined
                        ? null
                        : t("estimates.clearsEstimate", { depth: clears })}
                      {previewed ? (
                        <Eye
                          aria-label={t("goalsPreview.marker")}
                          className="size-3.5 text-primary"
                          data-testid="team-picker-preview-marker"
                        />
                      ) : null}
                    </span>
                  ) : null}
                  <span className="flex flex-wrap justify-center gap-0.5">
                    {objectives.map((objective) => (
                      <ObjectiveIcon
                        className="size-4"
                        icon={objectiveLabel(objective).icon}
                        key={objective.index}
                        muted={!tile.satisfied.includes(objective.index)}
                      />
                    ))}
                  </span>
                  <span
                    className="text-xs text-muted-foreground tabular-nums"
                    data-testid="team-picker-points"
                  >
                    {t("teams.picker.points", {
                      points: number.format(tile.pointsPerBattle),
                    })}
                  </span>
                </button>
                <Button
                  aria-label={t(
                    isReserve
                      ? "teams.picker.unsetReserve"
                      : "teams.picker.setReserve",
                    { name }
                  )}
                  aria-pressed={isReserve}
                  className="absolute top-0.5 right-0.5"
                  data-testid="team-picker-reserve"
                  onClick={() => onToggleReserve(id)}
                  size="icon-xs"
                  title={t("teams.reserve")}
                  type="button"
                  variant={isReserve ? "secondary" : "ghost"}
                >
                  <ShieldPlus />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function SelectedChip({
  unitId,
  label,
  removeLabel,
  onRemove,
  reserve = false,
}: {
  unitId: string
  label: string
  removeLabel: string
  onRemove: () => void
  reserve?: boolean
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-1 rounded-full border bg-muted/40 py-0.5 pr-0.5 pl-0.5 text-xs",
        reserve && "border-dashed"
      )}
      data-reserve={reserve ? "true" : undefined}
      data-testid="team-picker-selected-unit"
      data-unit={unitId}
    >
      <EntityIcon
        alt=""
        className="size-5 rounded-full"
        src={characterIcon(unitId as UnitId)}
      />
      <span className="max-w-32 truncate">{label}</span>
      <Button
        aria-label={removeLabel}
        onClick={onRemove}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <X />
      </Button>
    </li>
  )
}
