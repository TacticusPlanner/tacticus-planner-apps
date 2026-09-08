import { useTranslation } from "react-i18next"
import { damageTypeIcon, traitIcon } from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { EntityIcon } from "@/shared/ui"

import type { TeamPreferences } from "../../model/team-recommendations.types"

// Radix `Select` reserves the empty string to clear a value, so "Any" needs its own sentinel.
const ANY = "__any__"

type Dimension = "trait" | "damageType"

/**
 * The Preferred trait / Preferred damage type selects. Options are limited to the values the owned
 * roster actually covers (passed in by the page). Selecting "Any" clears that dimension. The
 * preference is a soft filter applied by the shared engine — it never shrinks a team.
 */
export function PreferenceControls({
  preferences,
  availableTraits,
  availableDamageTypes,
  onChange,
  testIdPrefix = "arena",
}: {
  preferences: TeamPreferences
  availableTraits: readonly string[]
  availableDamageTypes: readonly string[]
  onChange: (next: Partial<TeamPreferences>) => void
  testIdPrefix?: string
}) {
  const { t } = useTranslation(["teamRecs", "traits", "damageTypes"])

  const select = (
    dimension: Dimension,
    options: readonly string[],
    iconOf: (value: string) => string,
    labelNs: "traits" | "damageTypes"
  ) => {
    const current = preferences[dimension]
    return (
      <div className="space-y-1">
        <p className="text-xs font-normal text-muted-foreground">
          {t(`preferences.${dimension}`)}
        </p>
        <Select
          value={current ?? ANY}
          onValueChange={(value) =>
            onChange({ [dimension]: value === ANY ? undefined : value })
          }
        >
          <SelectTrigger
            className="w-44"
            data-testid={`${testIdPrefix}-preferred-${dimension === "damageType" ? "damage-type" : "trait"}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("preferences.any")}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                <span className="flex items-center gap-2">
                  <EntityIcon
                    src={iconOf(option)}
                    alt=""
                    className="size-4 shrink-0"
                  />
                  {t(`${labelNs}:${option}`, { defaultValue: option })}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div
      className="flex flex-wrap items-end gap-4"
      data-testid={`${testIdPrefix}-preferences`}
    >
      {select("trait", availableTraits, traitIcon, "traits")}
      {select(
        "damageType",
        availableDamageTypes,
        damageTypeIcon,
        "damageTypes"
      )}
    </div>
  )
}
