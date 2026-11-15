import type {
  PersonalRosterSnapshot,
  PersonalRosterSnapshotList,
} from "@/entities/roster-snapshot"

/** The manage sheet's sections (design D3): manual snapshots with V1 imports, then automatic ones,
 *  each newest first as the list serves them. */
export function manageSections(list: PersonalRosterSnapshotList | undefined): {
  manual: PersonalRosterSnapshot[]
  auto: PersonalRosterSnapshot[]
} {
  const items = list?.items ?? []
  return {
    manual: items.filter((snapshot) => snapshot.source !== "auto"),
    auto: items.filter((snapshot) => snapshot.source === "auto"),
  }
}

/** Keeping an automatic snapshot needs room under the manual limit. */
export function canKeep(list: PersonalRosterSnapshotList | undefined): boolean {
  return list !== undefined && list.count < list.limit
}
