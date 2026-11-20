import { useTranslation } from "react-i18next"
import { LayoutGrid, Plus, Rows3, Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { TEAM_LIMITS, TEAM_MODES, useTeamModeLabel } from "@/entities/team"
import {
  FILTER_CHIP_CLASS_NAME,
  GroupByControl,
  PageToolbar,
  SegmentedControl,
} from "@/shared/ui"

import { isTeamsModeFilter } from "../../model/teams-view"
import type {
  TeamsGroupBy,
  TeamsLayout,
  TeamsModeFilter,
} from "../../model/teams-view"

/** The quick filters: teams with broken rules, teams sharing a unit across a common mode. */
export interface TeamsQuickFilters {
  needsFixes: boolean
  shared: boolean
}

function ModeSelect({
  value,
  onChange,
  disabled,
}: {
  value: TeamsModeFilter
  onChange: (value: TeamsModeFilter) => void
  disabled: boolean
}) {
  const { t } = useTranslation("teams")
  const modeLabel = useTeamModeLabel()
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      {t("page.mode")}
      <Select
        disabled={disabled}
        onValueChange={(next) => {
          if (isTeamsModeFilter(next)) onChange(next)
        }}
        value={value}
      >
        <SelectTrigger
          aria-label={t("page.mode")}
          className="min-w-40 text-foreground"
          data-testid="teams-mode-select"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t("page.allModes")}</SelectItem>
          {TEAM_MODES.map((mode) => (
            <SelectItem key={mode} value={mode}>
              {modeLabel(mode)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

/**
 * The Teams toolbar (ui-style-guide rule 2, handoff 5.2). Find: search over team and unit names,
 * the Mode select, and the quick-filter chips (each hidden while its count is 0). View: Group by
 * (None or Mode) and the layout (Cards or Table; Cards or List on a phone). Actions: Reorder, the
 * team count against the limit, and Create team.
 */
export function TeamsToolbar({
  search,
  onSearch,
  mode,
  onMode,
  quick,
  onQuick,
  needsFixesCount,
  sharedCount,
  groupBy,
  onGroupBy,
  layout,
  onLayout,
  isPhone,
  teamCount,
  createDisabled,
  onCreate,
  controlsDisabled,
}: {
  search: string
  onSearch: (value: string) => void
  mode: TeamsModeFilter
  onMode: (value: TeamsModeFilter) => void
  quick: TeamsQuickFilters
  onQuick: (value: TeamsQuickFilters) => void
  needsFixesCount: number
  sharedCount: number
  groupBy: TeamsGroupBy
  onGroupBy: (value: TeamsGroupBy) => void
  layout: TeamsLayout
  onLayout: (value: TeamsLayout) => void
  isPhone: boolean
  teamCount: number
  createDisabled: boolean
  onCreate: () => void
  controlsDisabled: boolean
}) {
  const { t } = useTranslation(["teams", "common"])
  const atLimit = teamCount >= TEAM_LIMITS.maxTeams
  const countId = "teams-count"
  const chips =
    needsFixesCount > 0 || sharedCount > 0 ? (
      <ToggleGroup
        aria-label={t("page.quickFilters")}
        className="flex-wrap"
        disabled={controlsDisabled}
        onValueChange={(values) =>
          onQuick({
            needsFixes: values.includes("needsFixes"),
            shared: values.includes("shared"),
          })
        }
        type="multiple"
        value={[
          ...(quick.needsFixes ? ["needsFixes"] : []),
          ...(quick.shared ? ["shared"] : []),
        ]}
        variant="outline"
      >
        {needsFixesCount > 0 ? (
          <ToggleGroupItem
            className={FILTER_CHIP_CLASS_NAME}
            data-testid="teams-chip-needs-fixes"
            value="needsFixes"
          >
            {t("page.needsFixes")}
            <span className="tabular-nums">{needsFixesCount}</span>
          </ToggleGroupItem>
        ) : null}
        {sharedCount > 0 ? (
          <ToggleGroupItem
            className={FILTER_CHIP_CLASS_NAME}
            data-testid="teams-chip-shared"
            value="shared"
          >
            {t("page.sharedUnits")}
            <span className="tabular-nums">{sharedCount}</span>
          </ToggleGroupItem>
        ) : null}
      </ToggleGroup>
    ) : null

  return (
    <PageToolbar
      actions={
        <>
          {/* On a phone Create team is an icon button, so search keeps its row. */}
          <span
            className="text-xs text-muted-foreground tabular-nums max-md:hidden"
            data-testid="teams-limit"
            id={countId}
          >
            {atLimit
              ? t("page.countLimit", { max: TEAM_LIMITS.maxTeams })
              : t("page.count", {
                  count: teamCount,
                  max: TEAM_LIMITS.maxTeams,
                })}
          </span>
          <Button
            aria-describedby={countId}
            aria-label={isPhone ? t("page.create") : undefined}
            data-testid="teams-create"
            disabled={createDisabled}
            onClick={onCreate}
            size={isPhone ? "icon" : "default"}
            title={isPhone ? t("page.create") : undefined}
          >
            <Plus data-icon={isPhone ? undefined : "inline-start"} />
            {isPhone ? null : t("page.create")}
          </Button>
        </>
      }
      chips={chips}
      find={
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-36 md:max-w-60">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={t("page.search")}
              className="pl-8"
              data-testid="teams-search"
              disabled={controlsDisabled}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={t("page.searchPlaceholder")}
              type="search"
              value={search}
            />
          </div>
          <ModeSelect
            disabled={controlsDisabled}
            onChange={onMode}
            value={mode}
          />
        </div>
      }
      label={t("page.toolbarLabel")}
      testId="teams-toolbar"
      view={
        <>
          <GroupByControl
            disabled={controlsDisabled}
            onValueChange={onGroupBy}
            options={[
              { value: "none", label: t("common:pageToolbar.none") },
              { value: "mode", label: t("page.groupByMode") },
            ]}
            testId="teams-group-by"
            value={groupBy}
          />
          <SegmentedControl
            disabled={controlsDisabled}
            label={t("common:pageToolbar.layout")}
            onValueChange={onLayout}
            options={[
              {
                value: "cards",
                label: t("page.cards"),
                icon: <LayoutGrid aria-hidden="true" />,
                testId: "teams-layout-cards",
              },
              {
                value: "table",
                label: isPhone ? t("page.list") : t("page.table"),
                icon: <Rows3 aria-hidden="true" />,
                testId: "teams-layout-table",
              },
            ]}
            testId="teams-layout"
            value={layout}
          />
        </>
      }
      viewTestId="teams-view"
    />
  )
}
