import { useTranslation } from "react-i18next"
import { LayoutGrid, Plus, Rows3 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { IconButton } from "@workspace/ui/components/icon-button"
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

import {
  TEAM_LIMITS,
  TEAM_MODES,
  teamModeIcon,
  useTeamModeLabel,
} from "@/entities/team"
import {
  CountBadge,
  EntityIcon,
  FILTER_CHIP_CLASS_NAME,
  GroupByControl,
  PageToolbar,
  SearchField,
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
              <EntityIcon alt="" size="inline" src={teamModeIcon(mode)} />
              {modeLabel(mode)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

/** The quick-filter chips: each hidden while its count is 0, unless it is on, so an active filter
 *  never disappears from under the player. */
function QuickFilterChips({
  quick,
  onQuick,
  needsFixesCount,
  sharedCount,
  disabled,
}: {
  quick: TeamsQuickFilters
  onQuick: (value: TeamsQuickFilters) => void
  needsFixesCount: number
  sharedCount: number
  disabled: boolean
}) {
  const { t } = useTranslation("teams")
  const showNeedsFixes = needsFixesCount > 0 || quick.needsFixes
  const showShared = sharedCount > 0 || quick.shared
  return showNeedsFixes || showShared ? (
    <ToggleGroup
      aria-label={t("page.quickFilters")}
      className="flex-wrap"
      disabled={disabled}
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
      {showNeedsFixes ? (
        <ToggleGroupItem
          className={FILTER_CHIP_CLASS_NAME}
          data-testid="teams-chip-needs-fixes"
          value="needsFixes"
        >
          {t("page.needsFixes")}
          <CountBadge count={needsFixesCount} showZero />
        </ToggleGroupItem>
      ) : null}
      {showShared ? (
        <ToggleGroupItem
          className={FILTER_CHIP_CLASS_NAME}
          data-testid="teams-chip-shared"
          value="shared"
        >
          {t("page.sharedUnits")}
          <CountBadge count={sharedCount} showZero />
        </ToggleGroupItem>
      ) : null}
    </ToggleGroup>
  ) : null
}

/**
 * The Teams toolbar (ui-style-guide rule 2, handoff 5.2). Find: search over team and unit names,
 * the Mode select, and the quick-filter chips (each hidden while its count is 0, unless it is on,
 * so an active filter never disappears). View: the layout (Cards or Table; Cards or List on a phone),
 * then Group by (None or Mode). Actions: Reorder, the
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
  const chips = (
    <QuickFilterChips
      disabled={controlsDisabled}
      needsFixesCount={needsFixesCount}
      onQuick={onQuick}
      quick={quick}
      sharedCount={sharedCount}
    />
  )

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
          {isPhone ? (
            <IconButton
              aria-describedby={countId}
              data-testid="teams-create"
              disabled={createDisabled}
              label={t("page.create")}
              onClick={onCreate}
              variant="default"
            >
              <Plus />
            </IconButton>
          ) : (
            <Button
              aria-describedby={countId}
              data-testid="teams-create"
              disabled={createDisabled}
              onClick={onCreate}
            >
              <Plus data-icon="inline-start" />
              {t("page.create")}
            </Button>
          )}
        </>
      }
      chips={chips}
      find={
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SearchField
            className="basis-36"
            disabled={controlsDisabled}
            label={t("page.search")}
            onChange={onSearch}
            placeholder={t("page.searchPlaceholder")}
            value={search}
          />
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
        </>
      }
      viewTestId="teams-view"
    />
  )
}
