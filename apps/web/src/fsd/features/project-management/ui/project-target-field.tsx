import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { EventTargetOption } from "../model/event-target-options"

const NO_TARGET = "__none__"

/** The project form's Related to field (project-event-target): None, or a Legendary Event shown by
 *  its portrait and localized name. `value` is the chosen event id, null for None. */
export function ProjectTargetField({
  value,
  onChange,
  options,
}: {
  value: string | null
  onChange: (eventId: string | null) => void
  options: readonly EventTargetOption[]
}) {
  const { t } = useTranslation()
  // A target whose event the catalog no longer serves stays selectable until changed.
  const shown =
    value === null || options.some((option) => option.eventId === value)
      ? options
      : [...options, { eventId: value, name: value }]

  return (
    <Field>
      <FieldLabel htmlFor="project-target">
        {t("goals.project.relatedTo")}
      </FieldLabel>
      <Select
        onValueChange={(next) => onChange(next === NO_TARGET ? null : next)}
        value={value ?? NO_TARGET}
      >
        <SelectTrigger
          className="w-full"
          data-testid="project-target"
          id="project-target"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_TARGET}>
            {t("goals.project.relatedToNone")}
          </SelectItem>
          {shown.map((option) => (
            <SelectItem key={option.eventId} value={option.eventId}>
              <EventPortrait eventId={option.eventId} />
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function EventPortrait({ eventId }: { eventId: string }) {
  const portrait = characterIcon(eventId as UnitId)
  return portrait ? (
    <img
      alt=""
      aria-hidden="true"
      className="size-5 shrink-0 rounded-full object-cover"
      src={portrait}
    />
  ) : (
    <span
      aria-hidden="true"
      className="size-5 shrink-0 rounded-full bg-muted"
    />
  )
}
