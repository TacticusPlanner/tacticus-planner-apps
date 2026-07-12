import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type { GuildMemberSummary } from "@/entities/guild"

import { formatRelativeTime } from "../lib/format-relative-time"
import { GuildRoleBadge } from "./guild-role-badge"

type Props = {
  members: GuildMemberSummary[]
}

/**
 * Read-only guild roster — desktop table on wide viewports, compact cards on narrow ones. Ordering is
 * whatever the backend returned (Leader, Co-Leader, Officer, Member, then display label); this component
 * never re-sorts it (see Guild Phase 1 spec).
 */
export function GuildMembersList({ members }: Props) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  if (members.length === 0) {
    return (
      <p
        className="py-10 text-center text-muted-foreground"
        data-testid="guild-members-empty"
      >
        {t("guild.members.empty")}
      </p>
    )
  }

  return isMobile ? (
    <GuildMembersCards members={members} />
  ) : (
    <GuildMembersTable members={members} />
  )
}

function GuildMembersTable({ members }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <Table data-testid="guild-members-table">
      <TableHeader>
        <TableRow>
          <TableHead>{t("guild.members.columns.member")}</TableHead>
          <TableHead>{t("guild.members.columns.role")}</TableHead>
          <TableHead>{t("guild.members.columns.level")}</TableHead>
          <TableHead>{t("guild.members.columns.lastActiveInGame")}</TableHead>
          <TableHead>
            {t("guild.members.columns.lastActiveInPlanner")}
          </TableHead>
          <TableHead>{t("guild.members.columns.linked")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow data-testid="guild-member-row" key={member.guildMemberId}>
            <TableCell className="font-medium">{member.displayLabel}</TableCell>
            <TableCell>
              <GuildRoleBadge role={member.role} />
            </TableCell>
            <TableCell className="tabular-nums">{member.level}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatLastActiveInGame(
                member.lastActiveInGameOn,
                i18n.language,
                t
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatLastActiveInPlanner(
                member.lastActiveInPlannerOn,
                i18n.language,
                t
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {member.isLinked
                ? t("guild.members.linked")
                : t("guild.members.notLinked")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function GuildMembersCards({ members }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <ul className="flex flex-col gap-3" data-testid="guild-members-cards">
      {members.map((member) => (
        <li
          className="flex flex-col gap-2 rounded-2xl border p-3 text-sm"
          data-testid="guild-member-card"
          key={member.guildMemberId}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{member.displayLabel}</span>
            <GuildRoleBadge role={member.role} />
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>
              {t("guild.members.columns.level")}: {member.level}
            </span>
            <span>
              {t("guild.members.columns.lastActiveInGame")}:{" "}
              {formatLastActiveInGame(
                member.lastActiveInGameOn,
                i18n.language,
                t
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>
              {t("guild.members.columns.lastActiveInPlanner")}:{" "}
              {formatLastActiveInPlanner(
                member.lastActiveInPlannerOn,
                i18n.language,
                t
              )}
            </span>
          </div>
          <span className="text-muted-foreground">
            {member.isLinked
              ? t("guild.members.linked")
              : t("guild.members.notLinked")}
          </span>
        </li>
      ))}
    </ul>
  )
}

function formatLastActiveInGame(
  lastActiveInGameOn: number | null,
  locale: string,
  t: TFunction
) {
  if (lastActiveInGameOn === null) {
    return t("guild.members.never")
  }

  // The upstream Tacticus API reports lastActivityOn as unix milliseconds already.
  return (
    formatRelativeTime(lastActiveInGameOn, locale) ?? t("guild.members.never")
  )
}

function formatLastActiveInPlanner(
  lastActiveInPlannerOn: string | null,
  locale: string,
  t: TFunction
) {
  if (lastActiveInPlannerOn === null) {
    return t("guild.members.never")
  }

  return (
    formatRelativeTime(Date.parse(lastActiveInPlannerOn), locale) ??
    t("guild.members.never")
  )
}
