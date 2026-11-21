import { SearchField } from "@/shared/ui"

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
    <SearchField
      label={label}
      onChange={onChange}
      testId={testId}
      value={query}
    />
  )
}
