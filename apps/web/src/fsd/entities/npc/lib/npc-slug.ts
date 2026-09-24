/** URL-safe group id from a catalog name: lower-case, runs of non-alphanumerics collapsed to `-`. */
export function npcSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
