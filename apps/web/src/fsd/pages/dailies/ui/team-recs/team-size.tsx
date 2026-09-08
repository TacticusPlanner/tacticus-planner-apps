import { useTranslation } from "react-i18next"
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"

import { TEAM_SIZES } from "../../model/team-recommendations.types"

/**
 * The single page-level Team size control (3 / 4 / 5) shared by the Dailies team pages. It sets the
 * requested size for both the Plan Team and the Random Team and renders the same on desktop and
 * mobile. A size the current roster cannot fill is shown disabled.
 */
export function TeamSizeControl({
  value,
  availableSizes,
  onValueChange,
  testIdPrefix = "arena",
}: {
  value: number
  availableSizes: readonly number[]
  onValueChange: (size: number) => void
  testIdPrefix?: string
}) {
  const { t } = useTranslation("teamRecs")

  return (
    <FieldSet data-testid={`${testIdPrefix}-team-size`}>
      <FieldLegend
        variant="label"
        className="mb-1 text-xs font-normal text-muted-foreground"
      >
        {t("teamSize.label")}
      </FieldLegend>
      <RadioGroup
        className="flex flex-row gap-4"
        value={String(value)}
        onValueChange={(next) => onValueChange(Number(next))}
      >
        {TEAM_SIZES.map((size) => {
          const id = `${testIdPrefix}-team-size-${size}`
          return (
            <Field key={size} orientation="horizontal">
              <RadioGroupItem
                id={id}
                value={String(size)}
                disabled={!availableSizes.includes(size)}
                data-testid={id}
              />
              <FieldLabel htmlFor={id} className="text-sm">
                {size}
              </FieldLabel>
            </Field>
          )
        })}
      </RadioGroup>
    </FieldSet>
  )
}
