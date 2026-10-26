import type {
  QuestCrateStorageModel,
  QuestEventStorageModel,
} from "@workspace/game-catalog"

import type { ReadState } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

const byFeaturedHero = (records: QuestEventStorageModel[]) =>
  new Map(
    records.map((record) => [record.featuredCharacterId as string, record])
  )

const byNumber = (records: QuestCrateStorageModel[]) =>
  [...records].sort((a, b) => a.number - b.number)

/** Every catalog quest by featured hero id, and the shared crate track in crate order. Each read
 *  keeps its own loading and error state: a crate failure only blanks the crate line. */
export function useQuestCatalog(): {
  quests: ReadState<ReadonlyMap<string, QuestEventStorageModel>>
  crates: ReadState<QuestCrateStorageModel[]>
} {
  return {
    quests: useCatalogDataset("quest-events", byFeaturedHero),
    crates: useCatalogDataset("quest-crates", byNumber),
  }
}
