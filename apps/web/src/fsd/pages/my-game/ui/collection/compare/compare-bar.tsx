import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Camera, ListChecks, Settings2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import {
  COMPARE_CURRENT,
  COMPARE_LATEST,
  compareLanes,
  compareOrders,
  type CompareOrder,
  type CompareQuery,
} from "../../../model/compare-query"
import { compareFields, type CompareField } from "../../../model/compare-view"
import { sourceLabel } from "../../../model/compare-labels"
import { useSourceLabels } from "../../../model/use-source-labels"
import type { CompareSource } from "../../../model/use-compare-data"

/** The snapshot actions above the toolbar: the Compare switch, Take snapshot and Manage. */
export function SnapshotActions({
  compareOn,
  onCompareChange,
  usage,
  onTake,
  onManage,
}: {
  compareOn: boolean
  onCompareChange: (on: boolean) => void
  /** null while the list loads (the buttons stay available). */
  usage: { count: number; limit: number } | null
  onTake: () => void
  onManage: () => void
}) {
  const { t } = useTranslation("common")
  const switchId = useId()
  const atLimit = usage !== null && usage.count >= usage.limit
  const take = (
    <Button
      size="sm"
      onClick={onTake}
      disabled={atLimit}
      data-testid="take-snapshot"
    >
      <Camera aria-hidden />
      {t("myGame.collection.snapshots.take")}
    </Button>
  )
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
      data-testid="snapshot-actions"
    >
      <div className="flex items-center gap-2" data-testid="compare-toggle">
        <Switch
          id={switchId}
          checked={compareOn}
          onCheckedChange={onCompareChange}
        />
        <Label htmlFor={switchId}>
          {t("myGame.collection.compare.toggle")}
        </Label>
      </div>
      <div className="flex items-center gap-2">
        {atLimit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* A disabled button fires no pointer events, so the span carries the tooltip. */}
              <span data-testid="take-snapshot-limit">{take}</span>
            </TooltipTrigger>
            <TooltipContent>
              {t("myGame.collection.snapshots.limitTooltip")}
            </TooltipContent>
          </Tooltip>
        ) : (
          take
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onManage}
          data-testid="manage-snapshots"
        >
          <ListChecks aria-hidden />
          {t("myGame.collection.snapshots.manage")}
          {usage ? (
            <span className="text-muted-foreground tabular-nums">
              {t("myGame.collection.snapshots.usage", usage)}
            </span>
          ) : null}
        </Button>
      </div>
    </div>
  )
}

export interface CompareControlsProps {
  query: CompareQuery
  update: (patch: Partial<CompareQuery>) => void
  sources: readonly CompareSource[]
  /** The resolved sources (the URL may hold `latest`). */
  fromId: string
  toId: string
  events: readonly { id: string; name: string }[]
  fields: ReadonlySet<CompareField>
  onFieldsChange: (fields: ReadonlySet<CompareField>) => void
  showUnchanged: boolean
  onShowUnchangedChange: (show: boolean) => void
}

/** From/to, Legendary Event filter, order, fields and Show unchanged: inline on desktop, in a
 *  "Compare options" bottom sheet on mobile. */
export function CompareControls(props: CompareControlsProps) {
  const { t } = useTranslation("common")
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  if (!isMobile) {
    return (
      <div
        className="flex flex-wrap items-end gap-3"
        data-testid="compare-controls"
      >
        <CompareFields {...props} />
      </div>
    )
  }
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setOpen(true)}
        data-testid="compare-options"
      >
        <Settings2 aria-hidden />
        {t("myGame.collection.compare.options")}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" data-testid="compare-options-sheet">
          <SheetHeader>
            <SheetTitle>{t("myGame.collection.compare.options")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
            <CompareFields {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

const ANY = "any"

function CompareFields({
  query,
  update,
  sources,
  fromId,
  toId,
  events,
  fields,
  onFieldsChange,
  showUnchanged,
  onShowUnchangedChange,
}: CompareControlsProps) {
  const { t, i18n } = useTranslation("common")
  const ids = {
    from: useId(),
    to: useId(),
    event: useId(),
    lane: useId(),
    order: useId(),
    unchanged: useId(),
  }
  const labels = useSourceLabels()
  const label = (source: CompareSource) =>
    sourceLabel(source, i18n.language, labels)
  const from = sources.find((source) => source.id === fromId)
  const newer = from
    ? sources.filter(
        (source) => Date.parse(source.takenAt) > Date.parse(from.takenAt)
      )
    : []

  return (
    <>
      <Field id={ids.from} label={t("myGame.collection.compare.from")}>
        <Select
          value={fromId}
          onValueChange={(value) =>
            update({
              compare: value === sources[0]?.id ? COMPARE_LATEST : value,
            })
          }
        >
          <SelectTrigger
            id={ids.from}
            className="w-full md:w-60"
            data-testid="compare-from"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SourceGroups sources={sources} label={label} />
          </SelectContent>
        </Select>
      </Field>
      <Field id={ids.to} label={t("myGame.collection.compare.to")}>
        <Select value={toId} onValueChange={(value) => update({ to: value })}>
          <SelectTrigger
            id={ids.to}
            className="w-full md:w-60"
            data-testid="compare-to"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={COMPARE_CURRENT}>
              {t("myGame.collection.compare.current")}
            </SelectItem>
            <SourceGroups sources={newer} label={label} />
          </SelectContent>
        </Select>
      </Field>
      {events.length > 0 ? (
        <>
          <Field id={ids.event} label={t("myGame.collection.compare.event")}>
            <Select
              value={query.event ?? ANY}
              onValueChange={(value) =>
                update({ event: value === ANY ? null : value })
              }
            >
              <SelectTrigger
                id={ids.event}
                className="w-full md:w-48"
                data-testid="compare-event"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>
                  {t("myGame.collection.compare.anyEvent")}
                </SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {query.event ? (
            <Field id={ids.lane} label={t("myGame.collection.compare.lane")}>
              <Select
                value={query.lane ?? ANY}
                onValueChange={(value) =>
                  update({
                    lane:
                      value === ANY
                        ? null
                        : (value as (typeof compareLanes)[number]),
                  })
                }
              >
                <SelectTrigger
                  id={ids.lane}
                  className="w-full md:w-36"
                  data-testid="compare-lane"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>
                    {t("myGame.collection.compare.anyLane")}
                  </SelectItem>
                  {compareLanes.map((lane) => (
                    <SelectItem key={lane} value={lane}>
                      {t(`myGame.collection.compare.lanes.${lane}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
        </>
      ) : null}
      <Field id={ids.order} label={t("myGame.collection.compare.order")}>
        <Select
          value={query.order}
          onValueChange={(value) => update({ order: value as CompareOrder })}
        >
          <SelectTrigger
            id={ids.order}
            className="w-full md:w-40"
            data-testid="compare-order"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {compareOrders.map((order) => (
              <SelectItem key={order} value={order}>
                {order === "gain"
                  ? t("myGame.collection.compare.orderGain")
                  : t(`myGame.collection.toolbar.sortOptions.${order}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="self-start md:self-end"
            data-testid="compare-fields"
          >
            {t("myGame.collection.compare.fields", {
              count: fields.size,
              total: compareFields.length,
            })}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {compareFields.map((field) => (
            <DropdownMenuCheckboxItem
              key={field}
              checked={fields.has(field)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => {
                const next = new Set(fields)
                if (checked) next.add(field)
                else next.delete(field)
                onFieldsChange(next)
              }}
              data-field={field}
            >
              {t(`myGame.collection.compare.fieldNames.${field}`)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex items-center gap-2 self-start md:self-end md:pb-1.5">
        <Switch
          id={ids.unchanged}
          checked={showUnchanged}
          onCheckedChange={onShowUnchangedChange}
          data-testid="compare-show-unchanged"
        />
        <Label htmlFor={ids.unchanged}>
          {t("myGame.collection.compare.showUnchanged")}
        </Label>
      </div>
    </>
  )
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

function SourceGroups({
  sources,
  label,
}: {
  sources: readonly CompareSource[]
  label: (source: CompareSource) => string
}) {
  const { t } = useTranslation("common")
  const personal = sources.filter((source) => source.kind === "snapshot")
  const records = sources.filter((source) => source.kind === "runRecord")
  return (
    <>
      {personal.length > 0 ? (
        <SelectGroup>
          <SelectLabel>
            {t("myGame.collection.compare.personalGroup")}
          </SelectLabel>
          {personal.map((source) => (
            <SelectItem key={source.id} value={source.id}>
              {label(source)}
            </SelectItem>
          ))}
        </SelectGroup>
      ) : null}
      {records.length > 0 ? (
        <SelectGroup>
          <SelectLabel>{t("myGame.collection.compare.leGroup")}</SelectLabel>
          {records.map((source) => (
            <SelectItem key={source.id} value={source.id}>
              {label(source)}
            </SelectItem>
          ))}
        </SelectGroup>
      ) : null}
    </>
  )
}
