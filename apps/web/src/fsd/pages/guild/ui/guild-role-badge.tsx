import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import type { GuildRole } from "@/entities/guild"

const roleLabelKeys = {
  Leader: "guild.roles.leader",
  CoLeader: "guild.roles.coLeader",
  Officer: "guild.roles.officer",
  Member: "guild.roles.member",
} as const satisfies Record<GuildRole, string>

// Leader stands out (solid), Co-Leader next (secondary fill), Officer/Member are progressively
// quieter — mirrors the Leader/Co-Leader/Officer/Member ordering used for the member list itself.
const roleVariants = {
  Leader: "default",
  CoLeader: "secondary",
  Officer: "outline",
  Member: "ghost",
} as const satisfies Record<
  GuildRole,
  "default" | "secondary" | "outline" | "ghost"
>

export function GuildRoleBadge({ role }: { role: GuildRole }) {
  const { t } = useTranslation()

  return (
    <Badge data-testid="guild-role-badge" variant={roleVariants[role]}>
      {t(roleLabelKeys[role])}
    </Badge>
  )
}
