import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

export type LineupRole = "core" | "flex"

/**
 * A lineup unit's role as a two-option switch, Core and Flex, both always shown with the current
 * one selected (the handoff's segmented control). A role the unit cannot take is unavailable: Flex
 * for a team's only core character or a chosen campaign's core.
 */
export function RoleSwitch({
  name,
  role,
  onChange,
  flexDisabled = false,
  className,
}: {
  /** The unit's name, for the switch's accessible name. */
  name: string
  role: LineupRole
  onChange: (role: LineupRole) => void
  flexDisabled?: boolean
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
      type="single"
      value={role}
      variant="outline"
    >
      <ToggleGroupItem
        className="flex-1 px-2 text-xs data-[state=on]:bg-primary! data-[state=on]:font-semibold data-[state=on]:text-primary-foreground!"
        value="core"
      >
        {t("lineup.core")}
      </ToggleGroupItem>
      <ToggleGroupItem
        className="flex-1 px-2 text-xs data-[state=on]:bg-primary! data-[state=on]:font-semibold data-[state=on]:text-primary-foreground!"
        disabled={flexDisabled && role !== "flex"}
        value="flex"
      >
        {t("lineup.flex")}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
