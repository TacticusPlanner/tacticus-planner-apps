import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

export type LineupRole = "core" | "flex"

/**
 * A lineup unit's role as a two-option switch, Core and Flex, both always shown with the current
 * one selected (the shared segmented style, ui-style-guide rule 3; `sm` as it sits in a card). A role the unit cannot take is unavailable: Flex
 * for a team's only core character or a chosen campaign's core, Core while a selected mode's core is
 * full.
 */
export function RoleSwitch({
  name,
  role,
  onChange,
  flexDisabled = false,
  coreDisabled = false,
  className,
}: {
  /** The unit's name, for the switch's accessible name. */
  name: string
  role: LineupRole
  onChange: (role: LineupRole) => void
  flexDisabled?: boolean
  coreDisabled?: boolean
  className?: string
}) {
  const { t } = useTranslation("teams")
  return (
    <ToggleGroup
      aria-label={t("lineup.role", { name })}
      className={cn("shrink-0", className)}
      data-testid="team-lineup-role"
      onValueChange={(value) => {
        if ((value === "core" || value === "flex") && value !== role) {
          onChange(value)
        }
      }}
      size="sm"
      spacing={0}
      type="single"
      value={role}
      variant="outline"
    >
      <ToggleGroupItem
        className="flex-1 px-2"
        disabled={coreDisabled && role !== "core"}
        value="core"
      >
        {t("lineup.core")}
      </ToggleGroupItem>
      <ToggleGroupItem
        className="flex-1 px-2"
        disabled={flexDisabled && role !== "flex"}
        value="flex"
      >
        {t("lineup.flex")}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
