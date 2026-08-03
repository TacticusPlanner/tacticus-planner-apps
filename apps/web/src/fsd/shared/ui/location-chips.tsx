import { Badge } from "@workspace/ui/components/badge"

import { EntityIcon } from "./entity-icon"

export type LocationViewModel = {
  id: string
  label: string
  icon?: string
  variant?: "outline" | "secondary"
}

export function LocationSection({
  label,
  locations,
}: {
  label: string
  locations: LocationViewModel[]
}) {
  if (locations.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <LocationChips locations={locations} />
    </div>
  )
}

export function LocationChips({
  locations,
}: {
  locations: LocationViewModel[]
}) {
  if (locations.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {locations.map((location) => (
        <Badge
          key={location.id}
          variant={location.variant ?? "outline"}
          className="gap-1 font-normal"
        >
          {location.icon ? (
            <EntityIcon src={location.icon} alt="" className="size-4" />
          ) : null}
          {location.label}
        </Badge>
      ))}
    </div>
  )
}
