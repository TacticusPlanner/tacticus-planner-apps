const avatarColors = [
  "bg-blue-700 text-white",
  "bg-emerald-700 text-white",
  "bg-violet-700 text-white",
  "bg-rose-700 text-white",
  "bg-amber-300 text-slate-950",
  "bg-cyan-300 text-slate-950",
  "bg-fuchsia-700 text-white",
  "bg-lime-300 text-slate-950",
] as const

export function getAccountInitials(displayName: string) {
  const segments = displayName.trim().split(/\s+/u).filter(Boolean)
  const selected =
    segments.length > 1 ? [segments[0], segments.at(-1)!] : segments

  return (
    selected
      .map((segment) => Array.from(segment)[0])
      .join("")
      .toLocaleUpperCase() || "?"
  )
}

export function getAccountAvatarColor(applicationAccountId: string) {
  let hash = 2166136261

  for (const character of applicationAccountId) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }

  return avatarColors[(hash >>> 0) % avatarColors.length]
}
