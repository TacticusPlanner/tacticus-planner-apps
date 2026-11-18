import { Search } from "lucide-react"
import { Input } from "@workspace/ui/components/input"

/** The search field both Tier List tabs put in their toolbar's Find slot, so Heroes and Enemies
 *  look and size the same. */
export function TierListSearchField({
  label,
  query,
  onChange,
  testId,
}: {
  label: string
  query: string
  onChange: (query: string) => void
  testId: string
}) {
  return (
    <div className="relative min-w-0 flex-1 md:max-w-xs">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label={label}
        className="pl-9"
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        type="search"
        value={query}
      />
    </div>
  )
}
